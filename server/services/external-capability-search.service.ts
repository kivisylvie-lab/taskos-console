export type ExternalSearchStatus =
  | '待搜索'
  | '搜索中'
  | '已真实搜索'
  | '使用缓存结果'
  | '搜索被限流'
  | '搜索失败'
  | '平台待接入'
  | 'Demo 模拟';

export interface ExternalCapabilitySearchRequest {
  aiUsage: string;
  painPoints: string[];
  keywords: string[];
  limit?: number;
}

export interface ExternalCapabilityCandidate {
  name: string;
  sourcePlatform: string;
  sourceUrl: string;
  capabilityType: string;
  description: string;
  matchedAIUsage: string;
  matchedPainPoints: string[];
  installMethod: string;
  stars: number;
  lastUpdated: string;
  license: string;
  riskLevel: string;
  recommendationScore: number;
  recommendationReason: string;
  status: ExternalSearchStatus;
  safetyCheck: {
    sourcePlatform: string;
    hasReadme: string;
    hasInstallScript: string;
    needsApiKey: string;
    localFilePermission: string;
    shellCommand: string;
    recentlyMaintained: string;
    obviousRisk: string;
  };
}

export interface ExternalCapabilitySearchResult {
  aiUsage: string;
  generatedKeywords: string[];
  platformStatuses: Array<{
    platform: string;
    status: ExternalSearchStatus;
    evidence: string;
  }>;
  results: ExternalCapabilityCandidate[];
}

const CAPABILITY_TYPE_HINTS: Record<string, string> = {
  RAG: 'RAG / Knowledge Base',
  数据分析: 'Data Analysis Tool',
  自动化工作流: 'Workflow / Automation',
  报告生成: 'Report Generation Skill',
  多Agent: 'Multi-Agent Framework',
  Skill: 'Skill',
  指标复盘: 'Metrics Review / Dashboard',
  知识库沉淀: 'Knowledge Base Workflow',
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const KEYWORD_DELAY_MS = 2500;
const MAX_KEYWORDS_PER_USAGE = 3;

interface CacheEntry {
  expiresAt: number;
  result: ExternalCapabilitySearchResult;
}

interface GitHubSearchOutcome {
  status: ExternalSearchStatus;
  evidence: string;
  results: ExternalCapabilityCandidate[];
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getCacheKey(request: ExternalCapabilitySearchRequest) {
  return JSON.stringify({
    platform: 'GitHub',
    aiUsage: request.aiUsage.trim().toLowerCase(),
    painPoints: [...request.painPoints].sort(),
    keywords: Array.from(new Set(request.keywords)).slice(0, MAX_KEYWORDS_PER_USAGE).sort(),
  });
}

function getRetryAfterMs(response: Response) {
  const retryAfter = response.headers.get('retry-after');
  if (!retryAfter) return 60000;
  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) return Math.max(60000, seconds * 1000);
  const dateMs = new Date(retryAfter).getTime();
  if (Number.isFinite(dateMs)) return Math.max(60000, dateMs - Date.now());
  return 60000;
}

function inferCapabilityType(aiUsage: string, repoText: string) {
  const direct = Object.entries(CAPABILITY_TYPE_HINTS).find(([key]) => aiUsage.includes(key));
  if (direct) return direct[1];
  if (/rag|vector|embedding|knowledge/i.test(repoText)) return 'RAG / Knowledge Base';
  if (/workflow|automation|n8n|zapier/i.test(repoText)) return 'Workflow / Automation';
  if (/agent|multi-agent|multiagent/i.test(repoText)) return 'Agent / Multi-Agent';
  if (/parser|csv|excel|pandas|duckdb|analytics/i.test(repoText)) return 'Data Analysis Tool';
  return 'Open Source Tool';
}

function scoreRepository(repo: any, aiUsage: string, painPoints: string[], hasReadme: boolean) {
  const text = `${repo.name || ''} ${repo.description || ''} ${repo.topics?.join(' ') || ''}`.toLowerCase();
  const usageMatch = aiUsage
    .toLowerCase()
    .split(/\s+|\/|、|，|,|\+/)
    .filter(Boolean)
    .some(token => text.includes(token));
  const painMatchCount = painPoints.filter(point =>
    point
      .toLowerCase()
      .split(/\s+|\/|、|，|,|\+/)
      .filter(token => token.length >= 3)
      .some(token => text.includes(token))
  ).length;
  const stars = repo.stargazers_count || 0;
  const updatedAt = repo.pushed_at || repo.updated_at;
  const daysSinceUpdate = updatedAt
    ? Math.max(0, (Date.now() - new Date(updatedAt).getTime()) / 86400000)
    : 9999;

  const scenarioScore = usageMatch ? 24 : 16;
  const painScore = Math.min(20, 10 + painMatchCount * 5);
  const heatScore = Math.min(18, Math.log10(stars + 1) * 6);
  const freshnessScore = daysSinceUpdate <= 180 ? 16 : daysSinceUpdate <= 730 ? 10 : 4;
  const installCostScore = /cli|sdk|api|library|tool|framework/i.test(text) ? 10 : 7;
  const readmeScore = hasReadme ? 8 : 2;
  const licenseScore = repo.license ? 8 : 2;
  const installComplexityScore = /docker|kubernetes|self-host|database|server/i.test(text) ? 5 : 8;
  const riskScore = repo.archived ? 0 : 8;
  const reusableScore = repo.topics?.length ? 8 : 5;

  return Math.round(scenarioScore + painScore + heatScore + freshnessScore + readmeScore + licenseScore + installCostScore + installComplexityScore + riskScore + reusableScore);
}

function toSafetyCheck(repo: any, hasReadme: boolean) {
  const text = `${repo.name || ''} ${repo.description || ''} ${repo.topics?.join(' ') || ''}`.toLowerCase();
  const recentlyMaintained = repo.pushed_at
    ? (Date.now() - new Date(repo.pushed_at).getTime()) / 86400000 <= 365
    : false;

  return {
    sourcePlatform: 'GitHub',
    hasReadme: hasReadme ? '已通过 GitHub README 接口确认存在' : '未发现 README 或 README 检查失败',
    hasInstallScript: /cli|npm|pip|docker|install|setup/.test(text) ? '可能有安装方式，需查看仓库确认' : '未发现明显安装脚本线索',
    needsApiKey: /api key|token|openai|anthropic|llm/.test(text) ? '可能需要 API Key' : '未发现明显 API Key 线索',
    localFilePermission: /file|filesystem|csv|excel|pdf|document|parser/.test(text) ? '可能读取本地文件，接入前需确认权限边界' : '未发现明显本地文件权限线索',
    shellCommand: /cli|shell|command|automation|workflow/.test(text) ? '可能涉及 shell/CLI 命令' : '未发现明显 shell 命令线索',
    recentlyMaintained: recentlyMaintained ? '有最近维护记录' : '维护记录偏旧或未知',
    obviousRisk: repo.archived ? '仓库已归档，不建议直接接入' : '未发现明显高风险标记',
  };
}

export class ExternalCapabilitySearchService {
  private cache = new Map<string, CacheEntry>();
  private queue: Promise<unknown> = Promise.resolve();
  private githubRateLimitedUntil = 0;
  private githubTokenOverride = '';

  configureGitHubToken(token: string) {
    this.githubTokenOverride = token.trim();
    return {
      configured: Boolean(this.getGitHubToken()),
      source: this.githubTokenOverride ? 'runtime-config' : process.env.GITHUB_TOKEN ? 'env' : 'none',
    };
  }

  getGitHubConfigStatus() {
    return {
      configured: Boolean(this.getGitHubToken()),
      source: this.githubTokenOverride ? 'runtime-config' : process.env.GITHUB_TOKEN ? 'env' : 'none',
    };
  }

  async testGitHubConnection(token?: string) {
    const authToken = token?.trim() || this.getGitHubToken();
    if (!authToken) {
      return {
        connected: false,
        status: '未配置',
        evidence: '未配置 GITHUB_TOKEN，请先保存 Token 或在 .env 中配置。',
      };
    }

    const response = await fetch('https://api.github.com/rate_limit', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${authToken}`,
        'User-Agent': 'kivi-taskos-console',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (response.status === 429 || response.status === 403) {
      const waitMs = getRetryAfterMs(response);
      this.githubRateLimitedUntil = Date.now() + waitMs;
      return {
        connected: false,
        status: '被限流',
        evidence: `GitHub 测试连接被限流，请约 ${Math.ceil(waitMs / 1000)} 秒后重试。`,
      };
    }

    if (!response.ok) {
      return {
        connected: false,
        status: '连接失败',
        evidence: `GitHub 测试连接失败：${response.status} ${response.statusText}`,
      };
    }

    const data: any = await response.json();
    return {
      connected: true,
      status: '已配置',
      evidence: `GitHub 已连接。search 剩余额度：${data.resources?.search?.remaining ?? '未知'} / ${data.resources?.search?.limit ?? '未知'}。`,
    };
  }

  private getGitHubToken() {
    return this.githubTokenOverride || process.env.GITHUB_TOKEN || '';
  }

  async search(request: ExternalCapabilitySearchRequest): Promise<ExternalCapabilitySearchResult> {
    return this.searchGitHubWithCacheAndQueue(request);
  }

  async searchGitHubWithCacheAndQueue(request: ExternalCapabilitySearchRequest): Promise<ExternalCapabilitySearchResult> {
    const cacheKey = getCacheKey(request);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return {
        ...cached.result,
        platformStatuses: cached.result.platformStatuses.map(item => item.platform === 'GitHub'
          ? { ...item, status: '使用缓存结果', evidence: `${item.evidence}（24 小时缓存命中）` }
          : item
        ),
        results: cached.result.results.map(item => ({ ...item, status: '使用缓存结果' })),
      };
    }

    const run = async () => {
      const limit = Math.min(Math.max(request.limit || 5, 3), 5);
      const githubResults = await this.searchGitHub(request, limit);
      const result = this.createSearchResult(request, githubResults);
      if (githubResults.status === '已真实搜索' && githubResults.results.length > 0) {
        this.cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, result });
      }
      return result;
    };

    const queued = this.queue.then(run, run);
    this.queue = queued.catch(() => undefined);
    return queued;
  }

  private createSearchResult(request: ExternalCapabilitySearchRequest, githubResults: GitHubSearchOutcome): ExternalCapabilitySearchResult {
    return {
      aiUsage: request.aiUsage,
      generatedKeywords: Array.from(new Set(request.keywords)).slice(0, MAX_KEYWORDS_PER_USAGE),
      platformStatuses: [
        {
          platform: 'GitHub',
          status: githubResults.status,
          evidence: githubResults.evidence,
        },
        {
          platform: 'OpenClaw Skills / ClawHub',
          status: '平台待接入',
          evidence: '暂未配置真实搜索接口，等待接入。',
        },
        {
          platform: 'OpenClaw Skill Registry',
          status: '平台待接入',
          evidence: '暂未配置真实搜索接口，等待接入。',
        },
        {
          platform: 'MCP Server 相关仓库',
          status: '平台待接入',
          evidence: '暂未配置真实搜索接口，等待接入。',
        },
        {
          platform: '开源插件库',
          status: '平台待接入',
          evidence: '暂未配置真实搜索接口，等待接入。',
        },
        {
          platform: '工具官网',
          status: '平台待接入',
          evidence: '暂未配置真实搜索接口，等待接入。',
        },
      ],
      results: githubResults.results,
    };
  }

  private async searchGitHub(request: ExternalCapabilitySearchRequest, limit: number): Promise<GitHubSearchOutcome> {
    const githubToken = this.getGitHubToken();
    if (!githubToken) {
      return {
        status: '搜索失败',
        evidence: '后端未配置 GITHUB_TOKEN，已取消 GitHub API 请求，避免匿名搜索触发限流。',
        results: [],
      };
    }

    if (Date.now() < this.githubRateLimitedUntil) {
      const waitSeconds = Math.ceil((this.githubRateLimitedUntil - Date.now()) / 1000);
      return {
        status: '搜索被限流',
        evidence: `GitHub 搜索被限流，请约 ${waitSeconds} 秒后重试。`,
        results: [],
      };
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'kivi-taskos-console',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${githubToken}`,
    };

    try {
      const reposById = new Map<number, any>();
      const searchedKeywords = Array.from(new Set(request.keywords)).slice(0, MAX_KEYWORDS_PER_USAGE);
      const failures: string[] = [];

      for (const [index, keyword] of searchedKeywords.entries()) {
        if (index > 0) await sleep(KEYWORD_DELAY_MS);
        const url = new URL('https://api.github.com/search/repositories');
        url.searchParams.set('q', `${keyword} in:name,description,topics archived:false`);
        url.searchParams.set('sort', 'stars');
        url.searchParams.set('order', 'desc');
        url.searchParams.set('per_page', String(limit));

        const response = await fetch(url, { headers });
        if (response.status === 429 || response.status === 403) {
          const waitMs = getRetryAfterMs(response);
          this.githubRateLimitedUntil = Date.now() + waitMs;
          return {
            status: '搜索被限流',
            evidence: `GitHub 搜索被限流，请稍后重试。retry-after=${response.headers.get('retry-after') || '未返回'}，系统至少等待 ${Math.ceil(waitMs / 1000)} 秒后才允许重试。`,
            results: [],
          };
        }

        if (!response.ok) {
          const errorText = await response.text();
          failures.push(`${keyword}: ${response.status} ${errorText.slice(0, 120)}`);
          continue;
        }

        const data: any = await response.json();
        (data.items || []).forEach((repo: any) => reposById.set(repo.id, repo));
      }

      if (reposById.size === 0 && failures.length > 0) {
        return {
          status: '搜索失败' as const,
          evidence: `GitHub Search API 调用失败：${failures.join('；')}`,
          results: [],
        };
      }

      const topRepos = Array.from(reposById.values())
        .sort((a: any, b: any) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
        .slice(0, limit);
      const readmeChecks = new Map<number, boolean>();
      for (const repo of topRepos) {
        readmeChecks.set(repo.id, await this.hasReadme(repo, headers));
      }

      const results = topRepos
        .map((repo: any) => {
          const hasReadme = readmeChecks.get(repo.id) || false;
          const score = scoreRepository(repo, request.aiUsage, request.painPoints, hasReadme);
          const capabilityType = inferCapabilityType(request.aiUsage, `${repo.name} ${repo.description}`);
          return {
            name: repo.full_name || repo.name,
            sourcePlatform: 'GitHub',
            sourceUrl: repo.html_url,
            capabilityType,
            description: repo.description || '仓库未提供描述',
            matchedAIUsage: request.aiUsage,
            matchedPainPoints: request.painPoints,
            installMethod: '查看仓库 README 后按官方安装方式接入；安装前必须做安全确认。',
            stars: repo.stargazers_count || 0,
            lastUpdated: repo.pushed_at || repo.updated_at || '',
            license: repo.license?.spdx_id || repo.license?.name || '未知',
            riskLevel: repo.archived || !hasReadme ? '高' : score >= 78 ? '低' : '中',
            recommendationScore: score,
            recommendationReason: `按名称/描述匹配、痛点匹配、Stars、最近更新时间、README、License、安装复杂度和安全风险综合评分 ${score}。`,
            status: '已真实搜索' as const,
            safetyCheck: toSafetyCheck(repo, hasReadme),
          };
        })
        .sort((a: ExternalCapabilityCandidate, b: ExternalCapabilityCandidate) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);

      return {
        status: '已真实搜索' as const,
        evidence: `GitHub Search API 已真实搜索，关键词 ${searchedKeywords.join(' / ')}，返回 ${results.length} 个候选。${failures.length ? `部分关键词失败：${failures.join('；')}` : ''}`,
        results,
      };
    } catch (err: any) {
      return {
        status: '搜索失败' as const,
        evidence: `GitHub Search API 调用失败：${err.message || String(err)}`,
        results: [],
      };
    }
  }

  private async hasReadme(repo: any, headers: Record<string, string>) {
    try {
      const response = await fetch(`https://api.github.com/repos/${repo.full_name}/readme`, { headers });
      if (response.status === 429 || response.status === 403) {
        const waitMs = getRetryAfterMs(response);
        this.githubRateLimitedUntil = Date.now() + waitMs;
        return false;
      }
      return response.ok;
    } catch {
      return false;
    }
  }
}
