import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { getAIService } from './ai.service';
import type { AIConfig } from '../types/ai-config';
import { RoutingEngineService } from './routing-engine.service';
import { CapabilitySelectorService } from './capability-selector.service';
import { KnowledgeSearchService } from './knowledge-search.service';
import { PackageBuilderService } from './package-builder.service';
import type {
  Project, PipelineStep, StepResult,
  SceneMatchResult, SceneMatchRequest,
  TaskTypeJudgeResult, KnowledgeSearchResult, DeliveryTypeResult,
  CapabilityRouteResult, CapabilityDetailResult, ConfirmPlanResult,
  GenerateResult, CallRecordResult, KnowledgeDepositResult,
  GeneratedFile, UploadedFile, InputURL, SceneType,
} from '../types';

/**
 * 流水线执行器 — 18 步编排引擎
 */
export class PipelineExecutorService {
  private projects: Map<string, Project> = new Map();
  private routingEngine: RoutingEngineService;
  private capabilitySelector: CapabilitySelectorService;
  private knowledgeSearch: KnowledgeSearchService;
  private packageBuilder: PackageBuilderService;

  constructor() {
    this.routingEngine = new RoutingEngineService();
    this.capabilitySelector = new CapabilitySelectorService();
    this.knowledgeSearch = new KnowledgeSearchService();
    this.packageBuilder = new PackageBuilderService();
  }

  // ---- 场景匹配 ----
  async matchScene(request: SceneMatchRequest, aiConfig?: AIConfig): Promise<SceneMatchResult> {
    const ai = getAIService();

    const systemPrompt = `你是 KIVI AI TaskOS 的场景匹配引擎。你需要根据用户输入判断应该进入哪个流程入口。

## 12 种场景

| 场景 | 说明 | 触发条件 |
|---|---|---|
| task-triage | 任务分诊 | 用户卡住了，想解决一个具体问题 |
| task-execution-loop | 任务执行闭环 | 用户想完整完成一件事或一个项目 |
| project-onboarding | 项目接入模式 | 用户要新建项目、接入已有项目、生成项目文件夹 |
| knowledge-ingestion | 知识库摄取 | 用户上传文件/文件夹/图片/表格/视频/URL，希望系统学习 |
| capability-assessment | 新能力评估 | 用户提供 Prompt/Skill/Plugin/MCP/Hook/Agent/GitHub 链接 |
| capability-routing | 能力路由判断 | 用户想知道当前任务该用什么 AI 能力 |
| multi-agent | 多 Agent 判断 | 当前任务涉及多角色、多专业视角、高风险决策 |
| executive-brief | 项目汇报材料生成 | 用户想给老板、客户、HR、投资方或面试官展示 |
| product-planning | 产品从0到1规划 | 用户要做产品规划、MVP、路线图、验证指标 |
| post-use-assessment | 使用后评估 | 用户已经完成任务，想复盘能力是否好用 |
| system-maintenance | 系统维护 | 用户想整理能力库、知识库、规则、项目记录 |
| simple-task | 普通一次性任务 | 用户只是要一个简单回答，不需要走完整项目流程 |

## 项目型任务的 9 条判定标准
- 用户明确要做一个项目
- 需要生成多个交付物
- 需要项目文件夹
- 需要 README/使用说明/项目汇报材料
- 需要产品从0到1规划
- 需要 PRD/原型/流程图/代码/Demo
- 需要长期迭代
- 需要知识库、能力库、Agent 输出记录
- 需要对外展示或交付

## 输出格式
{
  "matches": [
    { "scene": "task-triage", "label": "任务分诊", "matched": true, "confidence": "high", "reason": "...", "recommendedEntry": "..." }
  ],
  "recommendedFlow": {
    "entry": "task-execution-loop",
    "entryLabel": "任务执行闭环",
    "reason": "...",
    "needsProject": true,
    "needsKnowledgeBase": true,
    "needsUpload": false,
    "needsCapabilityRouting": true,
    "needsUserConfirm": true
  }
}`;

    const userMessage = `## 用户任务描述
${request.taskInput}

## 上传的文件
${request.uploadedFileNames.join(', ') || '无'}

## 输入的链接
${request.inputURLs.join(', ') || '无'}

## 用户补充信息
- 汇报对象: ${request.supplementaryInfo.reportAudience || '未指定'}
- 是否需要交付物: ${request.supplementaryInfo.needsDeliverable}
- 是否是项目型: ${request.supplementaryInfo.isProjectTask}
- 是否使用知识库: ${request.supplementaryInfo.useKnowledgeBase}
- 是否允许 GitHub 搜索: ${request.supplementaryInfo.allowGitHubSearch}
- 是否允许创建项目: ${request.supplementaryInfo.allowCreateProject}

请分析以上输入并输出场景匹配结果。`;

    const response = await ai.chat({ systemPrompt, userMessage, temperature: 0.3, aiConfig });
    return this.parseJSONResponse(response) as SceneMatchResult;
  }

  // ---- 项目管理 ----
  createProject(
    name: string,
    description: string,
    extra?: {
      sceneType?: string;
      requiresProject?: boolean;
      supplementaryInfo?: any;
      metadata?: Record<string, any>;
    }
  ): Project {
    const id = uuidv4();
    const project: Project = {
      id,
      name,
      description,
      createdAt: new Date().toISOString(),
      currentStep: '03-supplementary-info',
      sceneType: (extra?.sceneType as SceneType) || null,
      files: [],
      urls: [],
      taskObjective: description || '',
      supplementaryInfo: extra?.supplementaryInfo || {},
      stepResults: {},
      requiresProject: extra?.requiresProject ?? false,
      metadata: extra?.metadata || {},
    };

    this.projects.set(id, project);
    this.saveState(project);
    return project;
  }

  getProject(id: string): Project | undefined {
    if (this.projects.has(id)) return this.projects.get(id);

    const statePath = path.join(config.outputPath, id, 'pipeline-state.json');
    if (fs.existsSync(statePath)) {
      const data = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      this.projects.set(id, data);
      return data;
    }
    return undefined;
  }

  // ---- 文件管理 ----
  addFiles(projectId: string, files: UploadedFile[]): Project {
    const project = this.getProjectOrThrow(projectId);
    project.files.push(...files);
    this.advanceStep(project, '03-supplementary-info');
    return project;
  }

  addURLs(projectId: string, urls: InputURL[]): Project {
    const project = this.getProjectOrThrow(projectId);
    project.urls.push(...urls);
    this.advanceStep(project, '03-supplementary-info');
    return project;
  }

  setTaskObjective(projectId: string, objective: string): Project {
    const project = this.getProjectOrThrow(projectId);
    project.taskObjective = objective;
    this.advanceStep(project, '03-supplementary-info');
    return project;
  }

  // ---- 流水线步骤执行 ----
  async executeStep05(projectId: string, aiConfig?: AIConfig): Promise<{ project: Project; result: TaskTypeJudgeResult }> {
    const project = this.getProjectOrThrow(projectId);
    const result = await this.routingEngine.judgeTaskType({
      taskObjective: project.taskObjective,
      files: project.files.map(f => f.name),
      urls: project.urls.map(u => u.url),
      aiConfig,
    });
    project.stepResults['05-task-type-judge'] = result;
    this.advanceStep(project, '05-task-type-judge');
    return { project, result };
  }

  async executeStep06(projectId: string, aiConfig?: AIConfig): Promise<{ project: Project; result: KnowledgeSearchResult }> {
    const project = this.getProjectOrThrow(projectId);
    const taskTypeResult = project.stepResults['05-task-type-judge'] as TaskTypeJudgeResult;
    const result = await this.knowledgeSearch.search({
      taskObjective: project.taskObjective,
      taskType: taskTypeResult?.gapTypes?.join(','),
      aiConfig,
    });
    project.stepResults['06-knowledge-search'] = result;
    this.advanceStep(project, '06-knowledge-search');
    return { project, result };
  }

  async executeStep07(projectId: string, aiConfig?: AIConfig): Promise<{ project: Project; result: DeliveryTypeResult }> {
    const project = this.getProjectOrThrow(projectId);
    const ai = getAIService();
    const systemPrompt = `你是 KIVI AI TaskOS 的交付物类型判断引擎。

## 规则 26：7 种交付物类型
1. 文本文档类: Markdown / PRD / README / 报告
2. 办公文件类: Word / PDF / PPT / Excel
3. 图片与视觉类: 原型图 / 流程图 / 架构图 / SVG / PNG
4. 视频类: 脚本 / 分镜 / 口播稿 / 视频文件
5. 系统与代码类: Web Demo / 前端页面 / 脚本
6. 数据结构类: JSON / YAML / CSV / 配置文件
7. 组合交付类: PRD+原型图+流程图

输出 JSON: { "deliveries": [...], "missingData": [...] }`;

    const userMessage = `## 任务目标\n${project.taskObjective}\n\n## 任务类型\n${JSON.stringify(project.stepResults['05-task-type-judge'])}\n\n## 已上传文件\n${project.files.map(f => f.name).join(', ') || '无'}`;

    const response = await ai.chat({ systemPrompt, userMessage, temperature: 0.3, aiConfig });
    const result = await this.parseJSONResponse(response) as DeliveryTypeResult;
    project.stepResults['07-delivery-type'] = result;
    this.advanceStep(project, '07-delivery-type');
    return { project, result };
  }

  async executeStep12(projectId: string, aiConfig?: AIConfig): Promise<{ project: Project; result: CapabilityRouteResult }> {
    const project = this.getProjectOrThrow(projectId);
    const taskTypeResult = project.stepResults['05-task-type-judge'] as TaskTypeJudgeResult;
    const deliveryResult = project.stepResults['07-delivery-type'] as DeliveryTypeResult;
    const result = await this.routingEngine.generateRoute({
      taskObjective: project.taskObjective,
      taskTypeResult,
      deliveryTypes: deliveryResult?.deliveries?.map(d => d.type) || [],
      aiConfig,
    });
    project.stepResults['12-capability-route'] = result;
    this.advanceStep(project, '12-capability-route');
    return { project, result };
  }

  async executeStep11(projectId: string, aiConfig?: AIConfig): Promise<{ project: Project; result: CapabilityDetailResult }> {
    const project = this.getProjectOrThrow(projectId);
    const routeResult = project.stepResults['12-capability-route'] as CapabilityRouteResult;
    const taskTypeResult = project.stepResults['05-task-type-judge'] as TaskTypeJudgeResult;
    const result = await this.capabilitySelector.selectCapabilities({
      taskObjective: project.taskObjective,
      routingTable: routeResult?.routingTable?.map(r => ({
        step: r.step,
        capabilityType: r.capabilityType,
      })) || [],
      taskType: taskTypeResult?.gapTypes?.join(',') || '',
      aiConfig,
    });
    project.stepResults['11-multi-agent-judge'] = result;
    this.advanceStep(project, '11-multi-agent-judge');
    return { project, result };
  }

  async executeStep13(projectId: string): Promise<{ project: Project; result: ConfirmPlanResult }> {
    const project = this.getProjectOrThrow(projectId);
    const plan: ConfirmPlanResult = {
      confirmed: true,
      confirmedAt: new Date().toISOString(),
      plan: {
        goal: project.taskObjective,
        taskType: project.stepResults['05-task-type-judge'] as TaskTypeJudgeResult,
        knowledgeHits: project.stepResults['06-knowledge-search'] as KnowledgeSearchResult,
        deliveries: project.stepResults['07-delivery-type'] as DeliveryTypeResult,
        capabilityRoute: project.stepResults['12-capability-route'] as CapabilityRouteResult,
        capabilityDetail: project.stepResults['11-multi-agent-judge'] as CapabilityDetailResult,
        risks: [
          { risk: 'AI API 调用可能超时', probability: 'medium', impact: '某步骤需要重试', mitigation: '每步独立重试，状态持久化' },
          { risk: '生成的文件质量可能波动', probability: 'medium', impact: '需人工审阅修改', mitigation: '生成文件标注 AI 生成' },
          { risk: '部分依赖外部资源', probability: 'low', impact: '该资源无法用于任务', mitigation: '提前检查 URL 可访问性' },
        ],
        fallbacks: [
          { step: '判断步骤', possibleFailure: 'AI 返回格式错误', fallback: '重试 2 次' },
          { step: '生成步骤', possibleFailure: '单个文件生成失败', fallback: '跳过该文件，标注未生成原因' },
        ],
        claudeCannotDo: [
          '安装系统依赖（需人工执行 npm install）',
          '配置 API Key（需人工在 .env 中填写）',
          '运行生产环境部署（需人工操作）',
        ],
      },
    };
    project.stepResults['13-confirm-plan'] = plan;
    this.advanceStep(project, '13-confirm-plan');
    return { project, result: plan };
  }

  async executeStep16(
    projectId: string,
    onProgress: (current: number, total: number, fileName: string) => void,
    aiConfig?: AIConfig
  ): Promise<{ project: Project; result: GenerateResult }> {
    const project = this.getProjectOrThrow(projectId);
    const plan = (project.stepResults['13-confirm-plan'] as ConfirmPlanResult)?.plan;
    if (!plan) throw new Error('执行计划未确认');

    const deliveryResult = project.stepResults['07-delivery-type'] as DeliveryTypeResult;
    const deliverables = deliveryResult?.deliveries?.filter(d => d.required === 'must') || [];
    const generatedFiles: GeneratedFile[] = [];

    const ai = getAIService();
    const outputDir = path.join(config.outputPath, projectId, 'deliverables');
    fs.mkdirSync(outputDir, { recursive: true });

    for (let i = 0; i < deliverables.length; i++) {
      const delivery = deliverables[i];
      onProgress(i + 1, deliverables.length, delivery.name);

      try {
        const systemPrompt = this.buildGenerationPrompt(delivery.type, delivery.format);
        const context = this.buildGenerationContext(project, delivery);
        const content = await ai.chat({
          systemPrompt,
          userMessage: context,
          temperature: 0.5,
          maxTokens: 8192,
          aiConfig,
        });

        const ext = this.getFileExtension(delivery.type, delivery.format);
        const fileName = `${delivery.name.replace(/[/\\?%*:|"<>]/g, '_')}${ext}`;
        const filePath = path.join(outputDir, fileName);

        const cleanContent = this.cleanGeneratedContent(content, ext);
        fs.writeFileSync(filePath, cleanContent, 'utf-8');

        const stat = fs.statSync(filePath);
        generatedFiles.push({
          name: fileName,
          path: path.relative(config.outputPath, filePath),
          size: stat.size,
          type: delivery.type,
          generated: true,
        });
      } catch (err: any) {
        console.error(`生成文件失败: ${delivery.name}`, err.message);
        generatedFiles.push({
          name: delivery.name,
          path: '',
          size: 0,
          type: delivery.type,
          generated: false,
        });
      }
    }

    const result: GenerateResult = {
      files: generatedFiles,
      totalCount: generatedFiles.length,
    };
    project.stepResults['16-generate-deliverables'] = result;
    this.advanceStep(project, '16-generate-deliverables');
    return { project, result };
  }

  async executeStep17(projectId: string, aiConfig?: AIConfig): Promise<{ project: Project; result: CallRecordResult }> {
    const project = this.getProjectOrThrow(projectId);
    const ai = getAIService();

    const systemPrompt = `你是 KIVI AI TaskOS 的能力调用记录生成引擎。请生成 AI能力调用记录.md。
记录格式：| 项目环节 | 使用能力类型 | 具体能力 | 来源 | 是否真实调用 | 调用证据 | 为什么选这个能力类型 | 为什么选这个具体能力 |`;

    const userMessage = this.buildCallRecordContext(project);
    const recordMarkdown = await ai.chat({ systemPrompt, userMessage, temperature: 0.3, maxTokens: 4096, aiConfig });

    const recordPath = path.join(config.outputPath, projectId, 'AI能力调用记录.md');
    fs.writeFileSync(recordPath, recordMarkdown, 'utf-8');

    const result: CallRecordResult = { recordMarkdown, recordPath };
    project.stepResults['17-call-record-materials'] = result;
    this.advanceStep(project, '17-call-record-materials');
    return { project, result };
  }

  async executeStep18(projectId: string, aiConfig?: AIConfig): Promise<{ project: Project; result: KnowledgeDepositResult }> {
    const project = this.getProjectOrThrow(projectId);
    const generateResult = project.stepResults['16-generate-deliverables'] as GenerateResult;
    const detailResult = project.stepResults['11-multi-agent-judge'] as CapabilityDetailResult;

    const result_data = await this.knowledgeSearch.judgeDeposit({
      taskObjective: project.taskObjective,
      generatedFiles: generateResult?.files?.map(f => f.name) || [],
      capabilitiesUsed: detailResult?.skillScores?.filter(s => s.total >= 5).map(s => s.capabilityName) || [],
      aiConfig,
    });

    const result: KnowledgeDepositResult = {
      suggestions: result_data.suggestions,
      createdCards: [],
      skippedCards: [],
    };
    project.stepResults['18-assessment-deposit'] = result;
    this.advanceStep(project, '18-assessment-deposit');
    return { project, result };
  }

  async buildPackage(projectId: string): Promise<string> {
    const project = this.getProjectOrThrow(projectId);
    return this.packageBuilder.buildPackage(project);
  }

  // ---- 辅助方法 ----
  private getProjectOrThrow(id: string): Project {
    const project = this.getProject(id);
    if (!project) throw new Error(`项目不存在: ${id}`);
    return project;
  }

  private advanceStep(project: Project, step: PipelineStep): void {
    project.currentStep = step;
    this.saveState(project);
  }

  private saveState(project: Project): void {
    const dir = path.join(config.outputPath, project.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'pipeline-state.json'),
      JSON.stringify(project, null, 2),
      'utf-8'
    );
  }

  private buildGenerationPrompt(type: string, format: string): string {
    return `你是 KIVI AI TaskOS 的交付物生成引擎。请为以下交付物生成完整内容。

## 交付物类型: ${type}
## 格式: ${format}

## 输出规则
- 直接输出文件内容，不要用 markdown 代码块包裹
- 不要添加"这是生成的..."之类的说明文字`;
  }

  private buildGenerationContext(project: Project, delivery: any): string {
    return `## 项目名称\n${project.name}\n\n## 任务目标\n${project.taskObjective}\n\n## 需要生成的交付物\n- 名称: ${delivery.name}\n- 类型: ${delivery.type}\n- 格式: ${delivery.format}`;
  }

  private getFileExtension(type: string, format: string): string {
    const map: Record<string, string> = {
      'text': '.md',
      'office': format.toLowerCase().includes('excel') ? '.csv' : '.md',
      'image': format.toLowerCase().includes('mermaid') ? '.mmd' : '.md',
      'video': '.md',
      'system': format.toLowerCase().includes('html') ? '.html' :
                format.toLowerCase().includes('json') ? '.json' : '.txt',
      'data': format.toLowerCase().includes('json') ? '.json' : '.csv',
      'combo': '.md',
    };
    return map[type] || '.md';
  }

  private cleanGeneratedContent(content: string, ext: string): string {
    const codeBlockMatch = content.match(/```[\w]*\n([\s\S]*?)\n```/);
    if (codeBlockMatch && (ext === '.html' || ext === '.json' || ext === '.js' || ext === '.ts' || ext === '.css' || ext === '.csv' || ext === '.svg')) {
      return codeBlockMatch[1].trim();
    }
    return content.trim();
  }

  private buildCallRecordContext(project: Project): string {
    const parts: string[] = [];
    parts.push(`## 项目: ${project.name}`);
    parts.push(`## 任务目标: ${project.taskObjective}`);

    const detailResult = project.stepResults['11-multi-agent-judge'] as CapabilityDetailResult;
    if (detailResult?.skillScores) {
      parts.push('## 使用的能力');
      for (const s of detailResult.skillScores.filter(s => s.total >= 5)) {
        parts.push(`- ${s.capabilityName}: ${s.total}/10 分`);
      }
    }

    return parts.join('\n\n');
  }

  private async parseJSONResponse(response: string): Promise<any> {
    try {
      return JSON.parse(response);
    } catch {
      const match = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (match) return JSON.parse(match[1]);
      const firstBrace = response.indexOf('{');
      const lastBrace = response.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        return JSON.parse(response.substring(firstBrace, lastBrace + 1));
      }
      throw new Error('无法解析响应');
    }
  }
}
