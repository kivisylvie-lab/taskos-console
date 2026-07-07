import { getAIService, AIService } from './ai.service';
import { RuleLoaderService } from './rule-loader.service';
import type { KnowledgeSearchResult } from '../types';
import type { AIConfig } from '../types/ai-config';

/**
 * 知识库检索服务 — 索引解析 + Claude 语义搜索
 *
 * 对应 KIVIDAILYLIFE 规则 30（知识库摄取与引用）
 */
export class KnowledgeSearchService {
  private ai: AIService;
  private ruleLoader: RuleLoaderService;

  constructor() {
    this.ai = getAIService();
    this.ruleLoader = RuleLoaderService.getInstance();
  }

  /**
   * Step 06: 搜索知识库
   */
  async search(params: {
    taskObjective: string;
    taskType?: string;
    aiConfig?: AIConfig;
  }): Promise<KnowledgeSearchResult> {
    // 1. 从索引中做基础关键词匹配
    const indexText = this.ruleLoader.getKnowledgeIndex();
    const keywords = this.extractKeywords(params.taskObjective);

    // 2. 用 Claude 做深度语义匹配
    const systemPrompt = this.buildKnowledgeSearchPrompt();
    const userMessage = `
## 用户任务
${params.taskObjective}

## 提取的关键词
${keywords.join(', ')}

## 知识库索引
${indexText || '（知识库索引为空或未加载）'}
`;

    // 如果索引为空，返回空结果
    if (!indexText || indexText.trim().length === 0) {
      return {
        hits: [],
        searchKeywords: keywords,
      };
    }

    const response = await this.ai.chat({
      systemPrompt,
      userMessage,
      temperature: 0.2,
      maxTokens: 2048,
      aiConfig: params.aiConfig,
    });

    return AIService.parseJSONResponse(response);
  }

  /**
   * Step 14: 判断知识库沉淀
   */
  async judgeDeposit(params: {
    taskObjective: string;
    generatedFiles: string[];
    capabilitiesUsed: string[];
    aiConfig?: AIConfig;
  }): Promise<{
    suggestions: Array<{
      cardTitle: string;
      knowledgeType: string;
      tags: string[];
      summary: string;
      needsConfirmation: boolean;
    }>;
  }> {
    const systemPrompt = this.buildDepositPrompt();
    const userMessage = `
## 任务目标
${params.taskObjective}

## 生成的文件
${params.generatedFiles.join('\n')}

## 使用的能力
${params.capabilitiesUsed.join(', ')}

## 新发现的知识点或启示
请根据以上信息，判断是否有值得沉淀到知识库的内容。
`;

    const response = await this.ai.chat({
      systemPrompt,
      userMessage,
      temperature: 0.3,
      maxTokens: 2048,
      aiConfig: params.aiConfig,
    });

    return AIService.parseJSONResponse(response);
  }

  /**
   * 从任务目标中提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 简单的中文分词关键词提取
    const stopWords = ['我', '想', '要', '帮', '做', '一个', '的', '了', '是', '在', '和', '请', '这个', '那个'];
    const words = text
      .replace(/[，。！？、；：""''《》（）\n\r]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !stopWords.includes(w));

    return [...new Set(words)].slice(0, 20);
  }

  private buildKnowledgeSearchPrompt(): string {
    const rules = this.ruleLoader.getRule('能力判断器');
    const chapter22 = this.extractSection(rules, '知识库') ||
                      this.extractSection(rules, '第二十二章');

    return `你是 KIVI AI TaskOS 的知识库检索引擎。

## 知识库检索规则
${chapter22?.substring(0, 3000) || '根据 KIVIDAILYLIFE 规则 30，执行任务前必须先检索知识库中的已有知识卡片。知识卡片包含：标题、类型、适用场景、核心内容、标签等字段。'}

## 你的任务
判断知识库中的哪些知识卡片与当前任务相关，说明如何使用。

## 输出格式
{
  "hits": [
    {
      "cardName": "知识卡片标题",
      "path": "文件路径",
      "summary": "一句话摘要",
      "relevance": "与任务的相关性说明",
      "tags": ["标签1", "标签2"],
      "usage": "在当前任务中如何使用"
    }
  ],
  "searchKeywords": ["关键词1", "关键词2"]
}`;
  }

  private buildDepositPrompt(): string {
    return `你是 KIVI AI TaskOS 的知识沉淀判断引擎。

## 规则：自动迭代知识库（规则 30）
以下情况应触发知识库迭代：
1. 用户上传新资料
2. 项目完成
3. 某个规则被验证
4. 新行业/新客户资料被加入

## 你的任务
判断本次任务中是否有值得沉淀到知识库的新知识点。建议的知识卡片必须包含：标题、类型、标签、摘要。

## 输出格式
{
  "suggestions": [
    {
      "cardTitle": "知识卡片标题",
      "knowledgeType": "知识类型（方法论/商业判断/技术方案/经验教训/Prompt模板）",
      "tags": ["标签1", "标签2"],
      "summary": "一句话摘要",
      "needsConfirmation": true
    }
  ]
}`;
  }

  private extractSection(text: string, sectionKeyword: string): string | null {
    const sections = text.split(/(?=^## )/m);
    const found = sections.find(s => s.includes(sectionKeyword));
    return found || null;
  }
}
