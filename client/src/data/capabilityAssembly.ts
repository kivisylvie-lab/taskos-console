export type AssemblyStatus =
  | '待装配'
  | '本地搜索中'
  | '开源搜索中'
  | '待创建'
  | '已推荐'
  | '已执行'
  | '待用户确认'
  | '需人工审批'
  | '用户已确认'
  | '已跳过';

export type SearchStatus =
  | '待搜索'
  | '搜索中'
  | '已真实搜索'
  | '使用缓存结果'
  | '搜索被限流'
  | '搜索失败'
  | '平台待接入'
  | '未配置'
  | '已配置'
  | '连接失败'
  | '已搜索'
  | '被限流'
  | 'Demo 模拟'
  | '已跳过';

export type CapabilitySourceType =
  | '本地'
  | 'GitHub'
  | 'OpenClawAI'
  | 'Claude Skill 社区'
  | 'MCP Server 市场'
  | '开源插件库'
  | '工具官网'
  | '系统创建'
  | 'Demo 模拟';

export interface CapabilityCandidate {
  id: string;
  name: string;
  sourcePlatform?: string;
  sourceUrl?: string;
  capabilityType: string;
  sourceType: CapabilitySourceType;
  sourceLink?: string;
  sourcePath?: string;
  platform?: string;
  description?: string;
  matchedAIUsage?: string;
  matchedPainPoints?: string[];
  matchedPainPoint?: string;
  installMethod?: string;
  stars?: string | number;
  lastUpdated?: string;
  license?: string;
  riskLevel?: string;
  recommendationScore?: number;
  status?: SearchStatus;
  safetyCheck?: {
    sourcePlatform: string;
    hasReadme: string;
    hasInstallScript: string;
    needsApiKey: string;
    localFilePermission: string;
    shellCommand: string;
    recentlyMaintained: string;
    obviousRisk: string;
  };
  purpose: string;
  usageLocation: string;
  relatedPainPoints: string[];
  aiUsage: string;
  input: string;
  output: string;
  triggerCondition?: string;
  installStatus: '待安装' | '待接入' | '待验证' | '已收藏' | 'Demo 模拟' | '需用户确认' | '待用户确认' | '已选用' | '已保存到系统' | '已真实安装' | '需人工审批' | '已跳过';
  risk: string;
  recommendationReason: string;
  score?: number;
  scoreBreakdown?: Record<string, number>;
}

export interface CapabilityAssemblyPlan {
  aiUsage: string;
  relatedPainPoints: string[];
  requiredCapabilityTypes: string[];
  localSearchStatus: SearchStatus;
  externalSearchStatus: SearchStatus;
  localSearchResults: CapabilityCandidate[];
  externalSearchResults: CapabilityCandidate[];
  externalSearchKeywords: string[];
  externalPlatformStatuses: Array<{ platform: string; status: SearchStatus; evidence: string }>;
  systemCreatedCapabilities: CapabilityCandidate[];
  scoredCandidates: CapabilityCandidate[];
  finalRecommendedCapabilities: CapabilityCandidate[];
  createdPrompts: CapabilityCandidate[];
  createdAgents: CapabilityCandidate[];
  createdHooks: CapabilityCandidate[];
  createdWorkflows: CapabilityCandidate[];
  installPlan: string[];
  evidence: string[];
  confirmed: boolean;
  status: AssemblyStatus;
  selectedPlan?: CapabilityCandidate[];
  executionStatus?: 'executed' | 'saved' | 'pending-confirm' | 'skipped' | 'need-human-approval';
}

interface PainPointLike {
  realPainPoint: string;
  aiCombinations?: string[];
  requiredData?: string[];
  businessAction?: string;
  executorRoles?: string[];
}

export interface ExternalSearchResponse {
  aiUsage: string;
  generatedKeywords: string[];
  platformStatuses: Array<{ platform: string; status: SearchStatus; evidence: string }>;
  results: Array<{
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
    status: SearchStatus;
    safetyCheck?: CapabilityCandidate['safetyCheck'];
  }>;
}

const REQUIRED_TYPE_MAP: Record<string, string[]> = {
  问答: ['Prompt'],
  RAG: ['Prompt', 'RAG', '知识库', 'MCP / API'],
  Skill: ['Skill', 'Prompt'],
  '插件 / Tool': ['Plugin', 'Tool'],
  'API / 数据库连接': ['MCP', 'API', '数据库连接'],
  数据分析: ['Tool', '数据分析脚本', 'Prompt'],
  自动化工作流: ['Workflow', 'Hook', 'Tool'],
  单Agent: ['Agent', 'Prompt'],
  '单 Agent': ['Agent', 'Prompt'],
  多Agent: ['Multi-Agent', 'Agent', 'Prompt'],
  '多 Agent': ['Multi-Agent', 'Agent', 'Prompt'],
  人工审批: ['Hook', 'Approval Workflow'],
  报告生成: ['Prompt', 'Skill', '模板'],
  指标复盘: ['Prompt', 'Dashboard', '数据分析脚本'],
  知识库沉淀: ['RAG', 'Skill', '知识库'],
  方案生成: ['Prompt', 'Skill'],
  预测模型: ['Tool', '预测模型脚本', '数据分析'],
  自动化预警: ['Hook', 'Workflow', 'API / 数据库连接'],
  '汇报模板 Skill': ['Skill', 'Prompt', '模板'],
};

const TYPE_NAME_MAP: Record<string, string> = {
  数据分析: '供应链数据分析 Tool',
  RAG: '供应链 SOP RAG 检索配置',
  Skill: '供应链解决包 Skill',
  '插件 / Tool': '业务数据处理插件',
  'API / 数据库连接': '库存系统 API / 数据库连接模板',
  自动化工作流: '补货预警自动化流程',
  单Agent: '业务分析 Agent',
  '单 Agent': '业务分析 Agent',
  多Agent: '供应链多 Agent 协同组',
  '多 Agent': '供应链多 Agent 协同组',
  人工审批: '高风险采购人工审批 Hook',
  报告生成: '老板汇报生成 Prompt',
  指标复盘: '指标复盘 Dashboard 模板',
  知识库沉淀: '项目知识沉淀流程',
  方案生成: '采购方案生成 Prompt',
  预测模型: 'SKU 缺货预测模型脚本',
  自动化预警: '库存异常自动化预警 Hook',
  '汇报模板 Skill': '项目汇报模板 Skill',
  问答: '客户业务问答 Prompt',
};

const SEARCH_KEYWORD_MAP: Record<string, string[]> = {
  数据分析: [
    'data analysis agent skill',
    'csv excel parser ai agent',
    'pandas data analysis tool',
    'duckdb csv analytics',
    'supply chain analytics python',
    'inventory forecasting python',
    'document table extraction',
    'unstructured document parser',
  ],
  RAG: [
    'rag document parser',
    'vector database skill',
    'pdf to markdown parser',
    'knowledge base agent skill',
    'langchain rag tool',
    'llamaindex document loader',
  ],
  自动化工作流: [
    'workflow automation agent',
    'n8n ai workflow',
    'zapier ai agent tool',
    'automation hook agent',
  ],
  报告生成: [
    'report generation ai agent',
    'markdown pdf report generator',
    'business report generation llm',
    'executive summary agent',
  ],
  多Agent: [
    'multi agent framework',
    'multi-agent orchestration',
    'agent collaboration framework',
    'autogen crewai multi agent',
  ],
  Skill: [
    'ai agent skill',
    'codex skill',
    'claude skill',
    'agent skill registry',
  ],
  指标复盘: [
    'metrics dashboard python',
    'kpi review agent',
    'business metrics analytics',
    'dashboard report generator',
  ],
  知识库沉淀: [
    'knowledge base agent skill',
    'knowledge ingestion workflow',
    'document indexing rag',
    'markdown knowledge base generator',
  ],
};

function normalizeUsage(usage: string) {
  return usage.trim().replace(/\s+/g, ' ');
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

export function getExternalSearchKeywords(aiUsage: string, painPoints: string[] = []) {
  const matchedKey = Object.keys(SEARCH_KEYWORD_MAP).find(key => aiUsage.includes(key));
  const baseKeywords = matchedKey ? SEARCH_KEYWORD_MAP[matchedKey] : [
    `${aiUsage} ai agent tool`,
    `${aiUsage} skill`,
    `${aiUsage} workflow`,
    `${aiUsage} open source`,
  ];
  const painKeywords = painPoints.flatMap(point => {
    const text = point.toLowerCase();
    const keywords: string[] = [];
    if (text.includes('供应链') || text.includes('库存') || text.includes('采购')) {
      keywords.push('supply chain analytics python', 'inventory forecasting python');
    }
    if (text.includes('表格') || text.includes('excel') || text.includes('csv')) {
      keywords.push('csv excel parser ai agent');
    }
    if (text.includes('文档') || text.includes('pdf')) {
      keywords.push('document table extraction', 'pdf to markdown parser');
    }
    if (text.includes('知识库')) {
      keywords.push('knowledge base agent skill');
    }
    return keywords;
  });

  return unique([...baseKeywords, ...painKeywords]).slice(0, 10);
}

function scoreCandidate(candidate: CapabilityCandidate): CapabilityCandidate {
  if (candidate.recommendationScore) {
    return { ...candidate, score: candidate.recommendationScore };
  }
  const starsValue = typeof candidate.stars === 'number'
    ? candidate.stars
    : Number(String(candidate.stars || '').replace(/[^\d]/g, '')) || 0;
  const externalHeatScore = candidate.sourceType === 'GitHub'
    ? Math.min(95, 55 + Math.log10(starsValue + 1) * 12)
    : 65;
  const riskScore = candidate.riskLevel === '低' ? 88 : candidate.riskLevel === '高' ? 40 : candidate.risk.includes('待') ? 68 : 82;
  const breakdown = {
    场景匹配度: candidate.sourceType === '系统创建' ? 92 : candidate.sourceType === 'GitHub' ? 82 : 78,
    输入输出匹配度: candidate.input && candidate.output ? 88 : 70,
    'Stars / 热度': candidate.sourceType === 'GitHub' ? externalHeatScore : candidate.sourceType === '本地' ? 80 : 65,
    最近更新时间: candidate.lastUpdated ? 82 : 60,
    '安装 / 接入成本': candidate.sourceType === '系统创建' ? 86 : candidate.sourceType === '本地' ? 90 : 60,
    安全风险: riskScore,
    可复用性: candidate.capabilityType.includes('Skill') || candidate.capabilityType.includes('Workflow') ? 90 : 78,
    与当前痛点匹配度: candidate.relatedPainPoints.length > 0 ? 86 : 70,
  };
  const score = Math.round(Object.values(breakdown).reduce((sum, value) => sum + value, 0) / Object.keys(breakdown).length);
  return { ...candidate, score, scoreBreakdown: breakdown };
}

function createSystemCapabilities(aiUsage: string, relatedPainPoints: string[]): CapabilityCandidate[] {
  const baseName = TYPE_NAME_MAP[aiUsage] || `${aiUsage} 能力模板`;
  const safeId = aiUsage.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]+/g, '-');
  const location = relatedPainPoints.join('、') || '当前业务痛点';
  const common = {
    relatedPainPoints,
    aiUsage,
    usageLocation: location,
    installStatus: '需用户确认' as const,
    risk: '当前为系统创建草案，启用前需要用户确认并在真实数据环境中验证。',
  };

  return [
    {
      id: `${safeId}-prompt`,
      name: `${baseName} Prompt`,
      capabilityType: 'Prompt',
      sourceType: '系统创建',
      purpose: `围绕「${aiUsage}」生成可执行判断与输出指令。`,
      input: '客户痛点、所需数据、业务动作、验证指标',
      output: '结构化分析结果、执行建议、风险提示',
      triggerCondition: '进入对应痛点处理步骤时触发',
      recommendationReason: 'Prompt 创建成本低，可立即覆盖业务判断和输出规范。',
      ...common,
    },
    {
      id: `${safeId}-agent`,
      name: `${baseName} Agent`,
      capabilityType: aiUsage.includes('多') ? 'Multi-Agent' : 'Agent',
      sourceType: '系统创建',
      purpose: `为「${aiUsage}」提供专门角色判断。`,
      input: '业务上下文、数据摘要、候选动作',
      output: '独立审查意见、通过/不通过、修改建议',
      triggerCondition: '需要跨角色判断或风险审查时触发',
      recommendationReason: 'Agent 能把业务角色和质量判断拆开，降低漏项风险。',
      ...common,
    },
    {
      id: `${safeId}-hook`,
      name: `${baseName} Hook`,
      capabilityType: 'Hook',
      sourceType: '系统创建',
      purpose: `在「${aiUsage}」关键输出前做质量和风险检查。`,
      input: '待输出结果、业务规则、验收指标',
      output: '质量检查结果、阻断原因、人工确认项',
      triggerCondition: '生成交付物、触发预警或进入审批前',
      recommendationReason: 'Hook 适合沉淀强制检查点，避免把 Demo 或低置信结果直接交付。',
      ...common,
    },
    {
      id: `${safeId}-workflow`,
      name: `${baseName} 自动化流程`,
      capabilityType: 'Workflow',
      sourceType: '系统创建',
      purpose: `把「${aiUsage}」串成可重复执行的业务流程。`,
      input: '数据源、触发条件、审批规则',
      output: '自动化任务、通知、记录和复盘数据',
      triggerCondition: '数据更新、风险命中或用户手动启动',
      recommendationReason: '自动化流程能减少重复操作，并给后续复盘留下证据。',
      ...common,
    },
  ];
}

function createLocalDemoCandidate(aiUsage: string, relatedPainPoints: string[], localPath?: string): CapabilityCandidate {
  return {
    id: `${aiUsage}-local-demo`,
    name: `${TYPE_NAME_MAP[aiUsage] || aiUsage} 本地候选`,
    capabilityType: REQUIRED_TYPE_MAP[aiUsage]?.[0] || 'Prompt',
    sourceType: '本地',
    sourcePath: localPath || '待连接本地能力库',
    purpose: `复用本地能力处理「${aiUsage}」。`,
    usageLocation: relatedPainPoints.join('、') || '当前业务痛点',
    relatedPainPoints,
    aiUsage,
    input: '当前痛点、数据字段、业务动作',
    output: '本地能力执行结果或配置草案',
    installStatus: localPath ? 'Demo 模拟' : '待接入',
    risk: localPath ? '已连接目录但未真实扫描文件内容，当前为 Demo 模拟匹配。' : '尚未连接本地能力库。',
    recommendationReason: '本地能力优先，接入成本低，适合沉淀为系统能力。',
  };
}

function createExternalDemoCandidate(aiUsage: string, relatedPainPoints: string[]): CapabilityCandidate {
  return {
    id: `${aiUsage}-external-demo`,
    name: `${TYPE_NAME_MAP[aiUsage] || aiUsage} 开源搜索占位`,
    capabilityType: REQUIRED_TYPE_MAP[aiUsage]?.[0] || 'Plugin',
    sourceType: 'Demo 模拟',
    platform: 'GitHub / OpenClawAI / MCP Server 市场',
    sourcePlatform: 'Demo 模拟',
    sourceLink: '',
    sourceUrl: '',
    stars: '待搜索',
    lastUpdated: '待搜索',
    license: '待搜索',
    riskLevel: '待评估',
    status: 'Demo 模拟',
    purpose: `搜索可复用开源能力覆盖「${aiUsage}」。`,
    usageLocation: relatedPainPoints.join('、') || '当前业务痛点',
    relatedPainPoints,
    aiUsage,
    input: '搜索关键词、痛点上下文、能力类型',
    output: '开源候选能力、安装方式、风险提示',
    installStatus: '待安装',
    risk: '当前未真实调用外部搜索接口，不允许标记为已搜索或已安装。',
    recommendationReason: '当本地能力不足时，外部候选可作为补充来源。',
  };
}

export function normalizeExternalSearchResults(
  response: ExternalSearchResponse | undefined,
  aiUsage: string,
  relatedPainPoints: string[]
): CapabilityCandidate[] {
  if (!response?.results?.length) return [];

  return response.results.map((result, index) => ({
    id: `${aiUsage}-external-${result.sourcePlatform}-${index}-${result.name}`.replace(/[^a-zA-Z0-9\u4e00-\u9fa5-]+/g, '-'),
    name: result.name,
    sourcePlatform: result.sourcePlatform,
    sourceUrl: result.sourceUrl,
    sourceLink: result.sourceUrl,
    platform: result.sourcePlatform,
    sourceType: result.sourcePlatform === 'GitHub' ? 'GitHub' : '开源插件库',
    capabilityType: result.capabilityType,
    description: result.description,
    matchedAIUsage: result.matchedAIUsage,
    matchedPainPoints: result.matchedPainPoints,
    matchedPainPoint: (result.matchedPainPoints?.length ? result.matchedPainPoints : relatedPainPoints).join('、'),
    installMethod: result.installMethod,
    stars: result.stars,
    lastUpdated: result.lastUpdated,
    license: result.license,
    riskLevel: result.riskLevel,
    recommendationScore: result.recommendationScore,
    status: result.status,
    purpose: result.description,
    usageLocation: relatedPainPoints.join('、') || '当前业务痛点',
    relatedPainPoints: result.matchedPainPoints?.length ? result.matchedPainPoints : relatedPainPoints,
    aiUsage,
    input: '按仓库 README / API 文档接入前确认输入格式',
    output: '开源能力运行结果、工具输出或可复用组件',
    installStatus: '待安装',
    risk: result.riskLevel === '低'
      ? '外部开源能力，当前仅完成搜索和基础安全线索检查，安装前仍需人工确认。'
      : '外部开源能力存在接入或维护风险，安装前必须做安全确认。',
    recommendationReason: result.recommendationReason,
    safetyCheck: result.safetyCheck,
    score: result.recommendationScore,
  }));
}

export function buildCapabilityAssemblyPlans(
  painPoints: PainPointLike[],
  options?: {
    localPath?: string;
    localSearchStatus?: SearchStatus;
    externalSearchStatus?: SearchStatus;
    externalSearchResultsByUsage?: Record<string, ExternalSearchResponse>;
  }
): CapabilityAssemblyPlan[] {
  const aiUsages = unique(painPoints.flatMap(point => point.aiCombinations || []).map(normalizeUsage).filter(Boolean));

  return aiUsages.map(aiUsage => {
    const relatedPainPoints = painPoints
      .filter(point => (point.aiCombinations || []).map(normalizeUsage).includes(aiUsage))
      .map(point => point.realPainPoint);
    const localSearchResults = options?.localSearchStatus === '已跳过'
      ? []
      : [createLocalDemoCandidate(aiUsage, relatedPainPoints, options?.localPath)];
    const externalResponse = options?.externalSearchResultsByUsage?.[aiUsage];
    const realExternalResults = normalizeExternalSearchResults(externalResponse, aiUsage, relatedPainPoints);
    const externalSearchResults = realExternalResults.length > 0
      ? realExternalResults
      : externalResponse
        ? []
        : [createExternalDemoCandidate(aiUsage, relatedPainPoints)];
    const externalSearchStatus = externalResponse?.platformStatuses?.find(item => item.platform === 'GitHub')?.status
      || options?.externalSearchStatus
      || '待搜索';
    const systemCreatedCapabilities = createSystemCapabilities(aiUsage, relatedPainPoints);
    const scoredCandidates = [...localSearchResults, ...externalSearchResults, ...systemCreatedCapabilities]
      .map(scoreCandidate)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
    const finalRecommendedCapabilities = scoredCandidates
      .filter(candidate => candidate.sourceType !== 'Demo 模拟')
      .slice(0, 4);

    return {
      aiUsage,
      relatedPainPoints,
      requiredCapabilityTypes: REQUIRED_TYPE_MAP[aiUsage] || ['Prompt', 'Tool', 'Workflow'],
      localSearchStatus: options?.localSearchStatus || '待搜索',
      externalSearchStatus,
      localSearchResults,
      externalSearchResults,
      externalSearchKeywords: externalResponse?.generatedKeywords || getExternalSearchKeywords(aiUsage, relatedPainPoints),
      externalPlatformStatuses: externalResponse?.platformStatuses || [
        { platform: 'GitHub', status: options?.externalSearchStatus || '待搜索', evidence: '尚未调用后端 GitHub 搜索代理。' },
        { platform: 'OpenClaw Skills / ClawHub', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
        { platform: 'OpenClaw Skill Registry', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
        { platform: 'MCP Server 相关仓库', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
        { platform: '开源插件库', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
        { platform: '工具官网', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
      ],
      systemCreatedCapabilities,
      scoredCandidates,
      finalRecommendedCapabilities,
      createdPrompts: systemCreatedCapabilities.filter(item => item.capabilityType === 'Prompt'),
      createdAgents: systemCreatedCapabilities.filter(item => item.capabilityType.includes('Agent')),
      createdHooks: systemCreatedCapabilities.filter(item => item.capabilityType === 'Hook'),
      createdWorkflows: systemCreatedCapabilities.filter(item => item.capabilityType === 'Workflow'),
      installPlan: finalRecommendedCapabilities.map(item => `${item.installStatus}: ${item.name}`),
      evidence: [
        `来源：Step 5 painPoints.aiCombinations`,
        `本地能力搜索状态：${options?.localSearchStatus || '待搜索'}`,
        `外部平台搜索状态：${externalSearchStatus}`,
        '系统自动创建 Prompt / Agent / Hook / Workflow 草案',
      ],
      confirmed: false,
      status: '已推荐',
    };
  });
}
