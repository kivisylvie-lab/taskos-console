import { getAIService, AIService } from './ai.service';
import { RuleLoaderService } from './rule-loader.service';
import type { TaskTypeJudgeResult, CapabilityRouteEntry } from '../types';
import type { AIConfig } from '../types/ai-config';

/**
 * 能力路由引擎 — 实现 KIVIDAILYLIFE 的能力类型决策树
 *
 * 混合架构：
 * - 确定性分支：代码实现决策树逻辑
 * - 语义判断：AI API 判断任务标志位
 */
export class RoutingEngineService {
  private ai: AIService;
  private ruleLoader: RuleLoaderService;

  constructor() {
    this.ai = getAIService();
    this.ruleLoader = RuleLoaderService.getInstance();
  }

  /**
   * Step 05: 判断任务类型 — 诊断问题 + 缺口类型
   */
  async judgeTaskType(params: {
    taskObjective: string;
    files: string[];
    urls: string[];
    aiConfig?: AIConfig;
  }): Promise<TaskTypeJudgeResult> {
    const systemPrompt = this.buildTaskTypePrompt();
    const userMessage = `
## 用户任务目标
${params.taskObjective}

## 已上传文件
${params.files.length > 0 ? params.files.join('\n') : '（无）'}

## 已输入链接
${params.urls.length > 0 ? params.urls.join('\n') : '（无）'}
`;

    const response = await this.ai.chat({
      systemPrompt,
      userMessage,
      temperature: 0.3,
      aiConfig: params.aiConfig,
    });

    return AIService.parseJSONResponse(response);
  }

  /**
   * Step 08: 生成能力路由表 — 为每个解决步骤推荐能力类型
   */
  async generateRoute(params: {
    taskObjective: string;
    taskTypeResult: TaskTypeJudgeResult;
    deliveryTypes: string[];
    aiConfig?: AIConfig;
  }): Promise<{ routingTable: CapabilityRouteEntry[] }> {
    const systemPrompt = this.buildRoutePrompt();
    const capabilityList = this.ruleLoader.getCapabilityList();

    const userMessage = `
## 任务目标
${params.taskObjective}

## 任务类型诊断
- 缺口类型: ${params.taskTypeResult.gapTypes.join(', ')}
- 问题本质: ${params.taskTypeResult.essence}

## 解决步骤
${params.taskTypeResult.recommendedSteps.map((s, i) =>
  `${i + 1}. ${s.goal}: ${s.action}`
).join('\n')}

## 交付物类型
${params.deliveryTypes.join(', ')}

## 本地能力库
${capabilityList.substring(0, 8000)}
`;

    const response = await this.ai.chat({
      systemPrompt,
      userMessage,
      temperature: 0.3,
      aiConfig: params.aiConfig,
    });

    return AIService.parseJSONResponse(response);
  }

  // ---- 构建系统 Prompt ----

  private buildTaskTypePrompt(): string {
    const rules = this.ruleLoader.getRule('能力判断器');
    const rule2 = this.extractSection(rules, '任务分诊') ||
                 this.extractSection(rules, '第二章');

    return `你是 KIVI AI TaskOS 的任务分诊引擎。

## 核心规则
${rule2?.substring(0, 4000) || '根据 KIVIDAILYLIFE 规则，你需要判断用户任务的问题类型和缺口。有 6 种缺口类型：knowledge（知识缺口）、process（流程缺口）、tool（工具缺口）、data（数据缺口）、experience（经验缺口）、execution（执行缺口）。'}

## 你的任务
1. 诊断用户任务的真正卡点
2. 判断缺口类型
3. 生成推荐解决步骤

## 输出格式
{
  "diagnosis": "一句话诊断",
  "gapTypes": ["knowledge", "process"],
  "essence": "问题本质描述",
  "recommendedSteps": [
    {
      "goal": "这一步要解决什么",
      "action": "具体做什么",
      "input": "需要什么输入",
      "output": "产出什么",
      "acceptanceCriteria": "验收标准"
    }
  ]
}`;
  }

  private buildRoutePrompt(): string {
    const rules = this.ruleLoader.getRule('能力判断器');
    const chapter15 = this.extractSection(rules, '能力选择验证机制') ||
                      this.extractSection(rules, '第十五章');
    const chapter3 = this.extractSection(rules, '能力类型选择') ||
                     this.extractSection(rules, '第三章');

    return `你是 KIVI AI TaskOS 的能力路由引擎。

## 能力类型决策规则
${chapter3?.substring(0, 3000) || ''}

## 能力选择验证规则
${chapter15?.substring(0, 3000) || ''}

## 9 种能力类型
- Prompt: 一次性分析、简单文案
- Skill: 高频重复、流程固定
- SubAgent: 复杂研究、多角色分工
- Hook: 固定触发、自动检查
- Plugin: 多能力组合编排
- MCP: 连接外部系统
- Tool/自动化: 批量处理、格式转换
- Claude Code 项目执行: 创建文件、修改代码
- 外部人工: Claude 不能完成的任务

## 你的任务
为每个解决步骤推荐最合适的能力类型，判断 Claude 是否能完成。

## 输出格式
{
  "routingTable": [
    {
      "step": "步骤名称",
      "capabilityType": "Skill",
      "specificCapability": "能力名称或候选描述",
      "reason": "选择原因",
      "needsVerification": true,
      "claudeCanComplete": true
    }
  ]
}`;
  }

  /**
   * 从文本中提取指定标题的章节
   */
  private extractSection(text: string, sectionKeyword: string): string | null {
    const sections = text.split(/(?=^## )/m);
    const found = sections.find(s => s.includes(sectionKeyword));
    return found || null;
  }
}
