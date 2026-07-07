import { getAIService, AIService } from './ai.service';
import { RuleLoaderService } from './rule-loader.service';
import type { CapabilityDetailResult } from '../types';
import type { AIConfig } from '../types/ai-config';

/**
 * 具体能力选择器 — 实现 5 维度打分 + Multi-Agent 判断
 *
 * 对应 KIVIDAILYLIFE 规则 24（具体能力选择）和规则 29（多 Agent）
 */
export class CapabilitySelectorService {
  private ai: AIService;
  private ruleLoader: RuleLoaderService;

  constructor() {
    this.ai = getAIService();
    this.ruleLoader = RuleLoaderService.getInstance();
  }

  /**
   * Step 09: 具体能力判断 — 5 维度打分 + 多 Agent/Hook/Tool/MCP 判断
   */
  async selectCapabilities(params: {
    taskObjective: string;
    routingTable: { step: string; capabilityType: string }[];
    taskType: string;
    aiConfig?: AIConfig;
  }): Promise<CapabilityDetailResult> {
    const systemPrompt = this.buildCapabilityDetailPrompt();
    const capabilityList = this.ruleLoader.getCapabilityList();

    // 截断能力列表到合理长度
    const truncatedList = capabilityList.length > 10000
      ? capabilityList.substring(0, 10000) + '\n\n（能力列表已截断，共 46 条能力记录）'
      : capabilityList;

    const userMessage = `
## 任务目标
${params.taskObjective}

## 任务类型
${params.taskType}

## 能力路由表
${params.routingTable.map(r => `- ${r.step}: 需要 ${r.capabilityType}`).join('\n')}

## 本地能力库（46 条能力记录）
${truncatedList}
`;

    const response = await this.ai.chat({
      systemPrompt,
      userMessage,
      temperature: 0.3,
      maxTokens: 4096,
      aiConfig: params.aiConfig,
    });

    return AIService.parseJSONResponse(response);
  }

  private buildCapabilityDetailPrompt(): string {
    const rules = this.ruleLoader.getRule('能力判断器');
    const chapter16 = this.extractSection(rules, '具体能力选择') ||
                      this.extractSection(rules, '第十六章');
    const chapter21 = this.extractSection(rules, '多 Agent') ||
                      this.extractSection(rules, '第二十一章');

    return `你是 KIVI AI TaskOS 的具体能力选择引擎。

## 5 维度打分规则（规则 24）
${chapter16?.substring(0, 3000) || ''}

## 多 Agent 判断规则（规则 29）
${chapter21?.substring(0, 2000) || ''}

## 打分标准
| 维度 | 满分 | 评分规则 |
|---|---|---|
| 场景匹配度 | 3 | 3=专门解决当前问题 / 2=高度相关 / 1=部分相关 / 0=不相关 |
| 输入输出匹配度 | 2 | 2=完全匹配 / 1=部分匹配 / 0=不匹配 |
| 能力状态 | 2 | 2=已验证 / 1=待测试 / 0.5=暂存 / 0=已弃用 |
| 历史效果 | 2 | 2=效果好 / 1=效果一般 / 0.5=未使用过 / 0=效果差 |
| 风险可控 | 1 | 1=低风险 / 0.5=中风险 / 0=高风险 |

总分判定：8-10=推荐 / 5-7=候选需验证 / 0-4=不建议

## 13 种 Agent 类型（按需推荐）
产品经理 Agent / 商业价值 Agent / 用户视角 Agent / 技术架构 Agent / 视觉设计 Agent / 内容导演 Agent / 法务合规 Agent / 财务成本 Agent / 销售售前 Agent / 老板视角 Agent / 投资人视角 Agent / 质量审查 Agent / 交付经理 Agent

## 输出格式
{
  "skillScores": [
    {
      "capabilityName": "能力名称",
      "category": "分类",
      "scores": { "scene": 3, "io": 2, "status": 2, "history": 2, "risk": 1 },
      "total": 10,
      "recommendation": "recommended",
      "reason": "推荐原因"
    }
  ],
  "multiAgentNeeded": false,
  "agents": [
    { "role": "角色名", "purpose": "为什么需要", "inputMaterials": "需要什么输入" }
  ],
  "hookNeeded": false,
  "hookTriggers": [],
  "toolNeeded": false,
  "toolsRecommended": [],
  "mcpNeeded": false,
  "mcpConnections": [],
  "githubSearchNeeded": false,
  "githubKeywords": []
}`;
  }

  private extractSection(text: string, sectionKeyword: string): string | null {
    const sections = text.split(/(?=^## )/m);
    const found = sections.find(s => s.includes(sectionKeyword));
    return found || null;
  }
}
