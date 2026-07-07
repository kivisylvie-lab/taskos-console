// 前端类型 — 与后端 types.ts 对应
// KIVI AI TaskOS Console — 18 步流水线

export type PipelineStep =
  // 输入阶段
  | '01-task-input'
  | '02-scene-match'
  | '03-supplementary-info'
  | '04-project-setup'
  // 判断阶段
  | '05-task-type-judge'
  | '06-knowledge-search'
  | '07-delivery-type'
  | '08-capability-precheck'
  | '09-local-capability-scan'
  | '10-github-search-judge'
  | '11-multi-agent-judge'
  | '12-capability-route'
  | '13-confirm-plan'
  // 执行阶段
  | '14-execute-generate'
  | '15-quality-check'
  | '16-generate-deliverables'
  | '17-call-record-materials'
  | '18-assessment-deposit';

export const STEP_LABELS: Record<PipelineStep, string> = {
  '01-task-input': '输入任务 / 模糊搜索',
  '02-scene-match': '入口与流程路由判断',
  '03-supplementary-info': '项目创建 / 项目目录选择',
  '04-project-setup': '项目设置',
  '05-task-type-judge': '真实痛点拆解',
  '06-knowledge-search': '知识检索',
  '07-delivery-type': '数据与资料判断',
  '08-capability-precheck': 'AI能力装配与工具选择',
  '09-local-capability-scan': '本地能力扫描',
  '10-github-search-judge': '工具调用计划 / 自动化流程配置',
  '11-multi-agent-judge': '业务动作定义',
  '12-capability-route': '能力路由',
  '13-confirm-plan': '工具调用计划 / 自动化流程配置',
  '14-execute-generate': '人工审批与风险确认',
  '15-quality-check': '解决包封装',
  '16-generate-deliverables': '客户使用培训',
  '17-call-record-materials': '汇报材料生成',
  '18-assessment-deposit': '复盘与能力沉淀',
};

export const PIPELINE_STEPS: PipelineStep[] = [
  '01-task-input',
  '02-scene-match',
  '03-supplementary-info',
  '04-project-setup',
  '05-task-type-judge',
  '06-knowledge-search',
  '07-delivery-type',
  '08-capability-precheck',
  '11-multi-agent-judge',
  '10-github-search-judge',
  '13-confirm-plan',
  '14-execute-generate',
  '15-quality-check',
  '16-generate-deliverables',
  '17-call-record-materials',
  '18-assessment-deposit',
];

export const PIPELINE_STEPS_BS: PipelineStep[] = [
  '01-task-input',
  '02-scene-match',
  '03-supplementary-info',
  '04-project-setup',
  '05-task-type-judge',
  '06-knowledge-search',
  '07-delivery-type',
  '08-capability-precheck',
  '11-multi-agent-judge',
  '10-github-search-judge',
  '14-execute-generate',
  '15-quality-check',
  '16-generate-deliverables',
  '17-call-record-materials',
  '18-assessment-deposit',
];

export function getPipelineSteps(sceneType: string | null | undefined): PipelineStep[] {
  return sceneType === 'business-solution' ? PIPELINE_STEPS_BS : PIPELINE_STEPS;
}

// 客户解决包模式的步骤标签
export const STEP_LABELS_BS: Record<PipelineStep, string> = {
  '01-task-input': '输入任务 / 模糊搜索',
  '02-scene-match': '入口与流程路由判断',
  '03-supplementary-info': '项目创建 / 项目目录选择',
  '04-project-setup': '项目设置',
  '05-task-type-judge': '真实痛点拆解',
  '06-knowledge-search': '知识库检索',
  '07-delivery-type': '数据与资料判断',
  '08-capability-precheck': 'AI 能力装配与工具选择',
  '09-local-capability-scan': '本地能力扫描',
  '10-github-search-judge': '工具调用计划 / 自动化流程配置',
  '11-multi-agent-judge': '业务动作定义',
  '12-capability-route': '能力路由',
  '13-confirm-plan': '工具调用计划 / 自动化流程配置',
  '14-execute-generate': '解决包封装',
  '15-quality-check': '客户使用培训',
  '16-generate-deliverables': '汇报材料生成',
  '17-call-record-materials': '运行与指标验证',
  '18-assessment-deposit': '复盘与能力沉淀',
};

/**
 * 根据场景类型获取步骤标签
 */
export function getStepLabel(step: PipelineStep, sceneType: SceneType | null): string {
  if (sceneType === 'business-solution') {
    return STEP_LABELS_BS[step] || STEP_LABELS[step];
  }
  return STEP_LABELS[step];
}

// ---- 场景匹配 / 入口路由 ----
export type SceneType =
  | 'task-triage'           // 任务分诊
  | 'task-execution-loop'   // 任务执行闭环
  | 'project-onboarding'    // 项目接入模式
  | 'knowledge-ingestion'   // 知识库摄取
  | 'capability-assessment' // 新能力评估
  | 'capability-routing'    // 能力路由判断
  | 'multi-agent'           // 多 Agent 判断
  | 'executive-brief'       // 项目汇报材料生成
  | 'product-planning'      // 产品从0到1规划
  | 'post-use-assessment'   // 使用后评估
  | 'system-maintenance'    // 系统维护
  | 'simple-task'           // 普通一次性任务
  | 'business-solution';    // 客户解决包模式

export const SCENE_LABELS: Record<SceneType, string> = {
  'task-triage': '任务分诊',
  'task-execution-loop': '任务执行闭环',
  'project-onboarding': '项目接入模式',
  'knowledge-ingestion': '知识库摄取',
  'capability-assessment': '新能力评估',
  'capability-routing': '能力路由判断',
  'multi-agent': '多 Agent 判断',
  'executive-brief': '项目汇报材料生成',
  'product-planning': '产品从0到1规划',
  'post-use-assessment': '使用后评估',
  'system-maintenance': '系统维护',
  'simple-task': '普通一次性任务',
  'business-solution': '客户解决包模式',
};

/** 五种路由角色 */
export type RouteRole =
  | 'primary-entry'     // 主入口
  | 'support-flow'      // 辅助流程
  | 'later-flow'        // 后置流程
  | 'weak-related'      // 弱相关
  | 'not-recommended';  // 不推荐

export const ROUTE_ROLE_LABELS: Record<RouteRole, string> = {
  'primary-entry': '主入口',
  'support-flow': '辅助流程',
  'later-flow': '后置流程',
  'weak-related': '弱相关',
  'not-recommended': '不推荐',
};

/** 单个流程的路由判断结果 */
export interface FlowMatchResult {
  /** 流程名称（对应 SceneType） */
  flowName: SceneType;
  /** 流程展示标签 */
  flowLabel: string;
  /** 路由角色 */
  routeRole: RouteRole;
  /** 置信度 */
  confidence: 'high' | 'medium' | 'low';
  /** 命中的关键词/信号 */
  matchedKeywords: string[];
  /** 识别到的业务意图 */
  matchedIntent: string;
  /** 推荐原因（解释"为什么"） */
  reason: string;
  /** 推荐入口路径 */
  recommendedEntry: string;
}

/** 入口与流程路由判断结果 */
export interface SceneMatchResult {
  /** 全量流程路由结果（用于表格展示） */
  flowResults: FlowMatchResult[];
  /** 主入口 */
  primaryEntry: FlowMatchResult | null;
  /** 辅助流程 */
  supportFlows: FlowMatchResult[];
  /** 后置流程 */
  laterFlows: FlowMatchResult[];
  /** 弱相关 */
  weakRelatedFlows: FlowMatchResult[];
  /** 不推荐 */
  notRecommendedFlows: FlowMatchResult[];
  /** 匹配证据（命中的信号分类） */
  evidence: string[];
}

// 向后兼容别名
export type SceneMatchEntry = FlowMatchResult;

// ---- 项目 ----
export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  currentStep: PipelineStep;
  sceneType: SceneType | null;
  files: UploadedFile[];
  urls: InputURL[];
  taskObjective: string;
  supplementaryInfo: SupplementaryInfo;
  stepResults: Record<string, any>;
  requiresProject: boolean;
  metadata?: Record<string, any>;
}

export interface SupplementaryInfo {
  reportAudience: 'self' | 'boss' | 'client' | 'hr' | 'investor' | 'team' | '';
  needsDeliverable: 'yes' | 'no' | 'uncertain';
  isProjectTask: 'yes' | 'no' | 'uncertain';
  useKnowledgeBase: 'yes' | 'no' | 'uncertain';
  allowGitHubSearch: 'yes' | 'no' | 'ask-first';
  allowCreateProject: 'yes' | 'no' | 'ask-first';
  // 客户解决包模式专用字段
  companyName?: string;
  industry?: string;
  businessPainPoint?: string;
  expectedOutcome?: string;
  budget?: string;
  timeline?: string;
}

export const DEFAULT_SUPPLEMENTARY_INFO: SupplementaryInfo = {
  reportAudience: '',
  needsDeliverable: 'uncertain',
  isProjectTask: 'uncertain',
  useKnowledgeBase: 'uncertain',
  allowGitHubSearch: 'ask-first',
  allowCreateProject: 'ask-first',
};

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  path: string;
  recognizedType: 'image' | 'table' | 'document' | 'code' | 'archive' | 'other';
}

export interface InputURL {
  url: string;
  type: 'webpage' | 'video' | 'github' | 'doc' | 'other';
  accessible: boolean;
  title?: string;
}

// Pipeline state machine context
export interface PipelineContext {
  projectId: string | null;
  project: Project | null;
  error: string | null;
  loading: boolean;
}
