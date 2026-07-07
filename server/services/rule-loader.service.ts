import fs from 'fs';
import path from 'path';
import { config } from '../config';

/**
 * 规则加载服务 — 读取 KIVIDAILYLIFE 母库规则到内存
 *
 * 只读不写。规则文本作为系统 Prompt 发送给 Claude，
 * 不重新编码规则逻辑。
 */
export class RuleLoaderService {
  private static instance: RuleLoaderService;

  private rules: Map<string, string> = new Map();
  private loaded = false;

  static getInstance(): RuleLoaderService {
    if (!RuleLoaderService.instance) {
      RuleLoaderService.instance = new RuleLoaderService();
    }
    return RuleLoaderService.instance;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * 加载所有母库规则文件到内存
   */
  async loadAllRules(): Promise<void> {
    const basePath = config.kividailylifePath;

    const filesToLoad: { key: string; filePath: string }[] = [
      { key: 'claude.md', filePath: path.join(basePath, 'CLAUDE.md') },
      { key: '能力判断器', filePath: path.join(basePath, '能力判断器.md') },
      { key: '个人AI能力库', filePath: path.join(basePath, '个人AI能力库.md') },
      { key: '常用Prompt', filePath: path.join(basePath, '常用Prompt.md') },
      { key: 'README', filePath: path.join(basePath, 'README.md') },
      // 能力分类
      { key: '生活管理', filePath: path.join(basePath, '能力分类', '生活管理.md') },
      { key: '学习成长', filePath: path.join(basePath, '能力分类', '学习成长.md') },
      { key: '工作效率', filePath: path.join(basePath, '能力分类', '工作效率.md') },
      { key: '产品商业', filePath: path.join(basePath, '能力分类', '产品商业.md') },
      { key: '开发自动化', filePath: path.join(basePath, '能力分类', '开发自动化.md') },
      { key: '投资量化', filePath: path.join(basePath, '能力分类', '投资量化.md') },
    ];

    let loadedCount = 0;
    for (const { key, filePath } of filesToLoad) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        this.rules.set(key, content);
        loadedCount++;
      } catch (err) {
        console.warn(`   ⚠️ 无法加载规则文件: ${filePath}`);
      }
    }

    // 加载知识库索引
    await this.loadKnowledgeIndexes(basePath);

    this.loaded = loadedCount >= 5; // 至少核心规则加载成功
    console.log(`   📚 规则加载: ${loadedCount}/${filesToLoad.length} 文件`);
  }

  /**
   * 加载知识库索引
   */
  private async loadKnowledgeIndexes(basePath: string): Promise<void> {
    const indexDir = path.join(basePath, '知识库', '04_索引');
    const indexFiles = ['全局知识索引.md', '标签索引.md', '行业索引.md'];

    for (const file of indexFiles) {
      try {
        const content = fs.readFileSync(path.join(indexDir, file), 'utf-8');
        this.rules.set(`知识库索引_${file.replace('.md', '')}`, content);
      } catch {
        // 索引文件可能为空或不存在，静默跳过
      }
    }
  }

  /**
   * 获取完整规则文本（用于系统 Prompt）
   */
  getRule(key: string): string {
    return this.rules.get(key) || '';
  }

  /**
   * 获取多个规则合并文本
   */
  getRules(keys: string[]): string {
    return keys.map(k => this.getRule(k)).filter(Boolean).join('\n\n---\n\n');
  }

  /**
   * 获取 CLAUDE.md 的指定章节（按 ## 标题分割）
   */
  getClaudeMdSection(sectionTitle: string): string {
    const content = this.getRule('claude.md');
    if (!content) return '';

    const sections = content.split(/(?=^## )/m);
    const section = sections.find(s =>
      s.trim().startsWith(`## ${sectionTitle}`) ||
      s.includes(sectionTitle)
    );
    return section || '';
  }

  /**
   * 获取能力判断器的指定章节（按 ## 标题分割）
   */
  getJudgeSection(chapterTitle: string): string {
    const content = this.getRule('能力判断器');
    if (!content) return '';

    const sections = content.split(/(?=^## )/m);
    const section = sections.find(s =>
      s.includes(chapterTitle)
    );
    return section || '';
  }

  /**
   * 获取所有能力记录列表（从能力分类中提取）
   */
  getCapabilityList(): string {
    const categories = ['生活管理', '学习成长', '工作效率', '产品商业', '开发自动化', '投资量化'];
    return categories.map(cat => this.getRule(cat)).filter(Boolean).join('\n\n');
  }

  /**
   * 获取知识库索引文本
   */
  getKnowledgeIndex(): string {
    const keys = ['知识库索引_全局知识索引', '知识库索引_标签索引', '知识库索引_行业索引'];
    return keys.map(k => this.getRule(k)).filter(Boolean).join('\n\n');
  }
}
