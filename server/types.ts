// ============================================================
// KIVI AI TaskOS Console — 共享类型定义（16 步流水线）
// ============================================================

// ---------- 16 步流水线 ----------
export type PipelineStep =
  | '01-task-input'
  | '02-scene-match'
  | '03-supplementary-info'
  | '04-project-setup'
  | '05-task-type-judge'
  | '06-knowledge-search'
  | '07-delivery-type'
  | '08-capability-precheck'
  | '09-local-capability-scan'
  | '10-github-search-judge'
  | '11-multi-agent-judge'
  | '12-capability-route'
  | '13-confirm-plan'
  | '14-execute-generate'
  | '15-quality-check'
  | '16-generate-deliverables'
  | '17-call-record-materials'
  | '18-assessment-deposit';

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
  '13-confirm-plan',
  '10-github-search-judge',
  '14-execute-generate',
  '15-quality-check',
  '16-generate-deliverables',
  '17-call-record-materials',
  '18-assessment-deposit',
];

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
  '10-github-search-judge': '人工审批与风险确认',
  '11-multi-agent-judge': '业务动作定义',
  '12-capability-route': '能力路由',
  '13-confirm-plan': '工具调用计划 / 自动化流程配置',
  '14-execute-generate': '解决包封装',
  '15-quality-check': '客户使用培训',
  '16-generate-deliverables': '汇报材料生成',
  '17-call-record-materials': '运行与指标验证',
  '18-assessment-deposit': '复盘与能力沉淀',
};

export function getStepLabel(step: PipelineStep, sceneType: SceneType | null): string {
  if (sceneType === 'business-solution') {
    return STEP_LABELS_BS[step] || STEP_LABELS[step];
  }
  return STEP_LABELS[step];
}

export const STEP_LABELS: Record<PipelineStep, string> = {
  '01-task-input': '输入任务 / 模糊搜索',
  '02-scene-match': '入口与流程路由判断',
  '03-supplementary-info': '项目创建 / 项目目录选择',
  '04-project-setup': '项目设置',
  '05-task-type-judge': '真实痛点拆解',
  '06-knowledge-search': '知识库检索',
  '07-delivery-type': '数据与资料判断',
  '08-capability-precheck': 'AI能力装配与工具选择',
  '09-local-capability-scan': '本地能力扫描',
  '10-github-search-judge': '人工审批与风险确认',
  '11-multi-agent-judge': '业务动作定义',
  '12-capability-route': '能力路由',
  '13-confirm-plan': '工具调用计划 / 自动化流程配置',
  '14-execute-generate': '人工审批与风险确认',
  '15-quality-check': '解决包封装',
  '16-generate-deliverables': '客户使用培训',
  '17-call-record-materials': '汇报材料生成',
  '18-assessment-deposit': '复盘与能力沉淀',
};

// ---------- 场景匹配 / 入口路由 ----------
export type SceneType =
  | 'task-triage'
  | 'task-execution-loop'
  | 'project-onboarding'
  | 'knowledge-ingestion'
  | 'capability-assessment'
  | 'capability-routing'
  | 'multi-agent'
  | 'executive-brief'
  | 'product-planning'
  | 'post-use-assessment'
  | 'system-maintenance'
  | 'simple-task'
  | 'business-solution';

/** 五种路由角色 */
export type RouteRole =
  | 'primary-entry'
  | 'support-flow'
  | 'later-flow'
  | 'weak-related'
  | 'not-recommended';

export interface FlowMatchResult {
  flowName: SceneType;
  flowLabel: string;
  routeRole: RouteRole;
  confidence: 'high' | 'medium' | 'low';
  matchedKeywords: string[];
  matchedIntent: string;
  reason: string;
  recommendedEntry: string;
}

export interface SceneMatchResult {
  flowResults: FlowMatchResult[];
  primaryEntry: FlowMatchResult | null;
  supportFlows: FlowMatchResult[];
  laterFlows: FlowMatchResult[];
  weakRelatedFlows: FlowMatchResult[];
  notRecommendedFlows: FlowMatchResult[];
  evidence: string[];
}

// 向后兼容别名
export type SceneMatchEntry = FlowMatchResult;

export interface SceneMatchRequest {
  taskInput: string;
  uploadedFileNames: string[];
  inputURLs: string[];
  supplementaryInfo: {
    reportAudience: string;
    needsDeliverable: string;
    isProjectTask: string;
    useKnowledgeBase: string;
    allowGitHubSearch: string;
    allowCreateProject: string;
  };
}

// ---------- 项目 ----------
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
  supplementaryInfo: any;
  stepResults: Partial<Record<string, StepResult>>;
  requiresProject: boolean;
  metadata?: Record<string, any>;
}

// ---------- 上传文件 ----------
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  path: string;
  recognizedType: 'image' | 'table' | 'document' | 'code' | 'archive' | 'other';
}

// ---------- URL 输入 ----------
export interface InputURL {
  url: string;
  type: 'webpage' | 'video' | 'github' | 'doc' | 'other';
  accessible: boolean;
  title?: string;
}

// ---------- 各步骤结果 ----------
export type StepResult =
  | SceneMatchResult
  | TaskTypeJudgeResult
  | KnowledgeSearchResult
  | DeliveryTypeResult
  | CapabilityRouteResult
  | CapabilityDetailResult
  | ConfirmPlanResult
  | GenerateResult
  | CallRecordResult
  | KnowledgeDepositResult;

// Step 05: 任务类型判断
export interface TaskTypeJudgeResult {
  diagnosis: string;
  gapTypes: GapType[];
  essence: string;
  recommendedSteps: TaskStep[];
}

export type GapType = 'knowledge' | 'process' | 'tool' | 'data' | 'experience' | 'execution';

export interface TaskStep {
  goal: string;
  action: string;
  input: string;
  output: string;
  acceptanceCriteria: string;
}

// Step 06: 知识库检索
export interface KnowledgeSearchResult {
  hits: KnowledgeHit[];
  searchKeywords: string[];
}

export interface KnowledgeHit {
  cardName: string;
  path: string;
  summary: string;
  relevance: string;
  tags: string[];
  usage: string;
}

// Step 07: 交付物类型判断
export interface DeliveryTypeResult {
  deliveries: DeliveryItem[];
  missingData: MissingDataItem[];
}

export type DeliveryFormat = 'text' | 'office' | 'image' | 'video' | 'system' | 'data' | 'combo';

export interface DeliveryItem {
  name: string;
  type: DeliveryFormat;
  required: 'must' | 'optional';
  format: string;
  dataNeeds: string;
  canProduce: boolean;
}

export interface MissingDataItem {
  item: string;
  purpose: string;
  impact: string;
  alternative: string;
}

// Step 12: 能力路由
export interface CapabilityRouteResult {
  routingTable: CapabilityRouteEntry[];
}

export interface CapabilityRouteEntry {
  step: string;
  capabilityType: string;
  specificCapability: string;
  reason: string;
  needsVerification: boolean;
  claudeCanComplete: boolean;
}

// Step 11: 多 Agent 判断 + 具体能力
export interface CapabilityDetailResult {
  skillScores: SkillScore[];
  multiAgentNeeded: boolean;
  agents: AgentRecommendation[];
  hookNeeded: boolean;
  hookTriggers: string[];
  toolNeeded: boolean;
  toolsRecommended: string[];
  mcpNeeded: boolean;
  mcpConnections: string[];
  githubSearchNeeded: boolean;
  githubKeywords: string[];
}

export interface SkillScore {
  capabilityName: string;
  category: string;
  scores: {
    scene: number;
    io: number;
    status: number;
    history: number;
    risk: number;
  };
  total: number;
  recommendation: 'recommended' | 'candidate' | 'not_recommended';
  reason: string;
}

export interface AgentRecommendation {
  role: string;
  purpose: string;
  inputMaterials: string;
}

// Step 13: 确认方案
export interface ConfirmPlanResult {
  confirmed: boolean;
  confirmedAt: string;
  plan: ExecutionPlan;
}

export interface ExecutionPlan {
  goal: string;
  taskType: TaskTypeJudgeResult;
  knowledgeHits: KnowledgeSearchResult;
  deliveries: DeliveryTypeResult;
  capabilityRoute: CapabilityRouteResult;
  capabilityDetail: CapabilityDetailResult;
  risks: RiskItem[];
  fallbacks: FallbackItem[];
  claudeCannotDo: string[];
}

export interface RiskItem {
  risk: string;
  probability: 'high' | 'medium' | 'low';
  impact: string;
  mitigation: string;
}

export interface FallbackItem {
  step: string;
  possibleFailure: string;
  fallback: string;
}

// Step 16: 生成交付物
export interface GenerateResult {
  files: GeneratedFile[];
  totalCount: number;
}

export interface GeneratedFile {
  name: string;
  path: string;
  size: number;
  type: string;
  generated: boolean;
}

// Step 17: AI能力调用记录
export interface CallRecordResult {
  recordMarkdown: string;
  recordPath: string;
}

// Step 18: 知识库沉淀
export interface KnowledgeDepositResult {
  suggestions: DepositSuggestion[];
  createdCards: string[];
  skippedCards: string[];
}

export interface DepositSuggestion {
  cardTitle: string;
  knowledgeType: string;
  tags: string[];
  summary: string;
  needsConfirmation: boolean;
}

// ============================================================
// 客户解决包模式 (Business Solution Mode) 专用类型
// ============================================================

// Step 05 BS: 真实痛点拆解
export interface PainPointAnalysisResult {
  items: PainPointItem[];
  summary: string;
}

export interface PainPointItem {
  surfaceNeed: string;
  realPainPoint: string;
  affectedRoles: string[];
  frequency: string;
  businessImpact: string;
  consequenceIfUnsolved: string;
}

// Step 07 BS: 业务动作定义
export interface BusinessActionDefResult {
  actions: BusinessActionItem[];
}

export interface BusinessActionItem {
  painPoint: string;
  actionName: string;
  triggerCondition: string;
  outputResult: string;
  executor: string;
  needsHumanConfirm: boolean;
}

// Step 08 BS: AI 组合方案
export interface AICombinationPlanResult {
  plans: AICombinationItem[];
}

export interface AICombinationItem {
  painPoint: string;
  recommendedCombination: string;
  whySuitable: string;
  notSuitableFor: string;
  risk: string;
  minimalVerification: string;
}

// Step 10 BS: 多Agent / 人工审批
export interface MultiAgentApprovalResult {
  agents: BSAgentReview[];
  humanApprovalSteps: HumanApprovalStep[];
  conflicts: AgentConflict[];
}

export interface BSAgentReview {
  agentName: string;
  role: string;
  verdict: string;
  issuesFound: string[];
  suggestions: string[];
  passed: boolean;
}

export interface HumanApprovalStep {
  step: string;
  approver: string;
  whatToCheck: string;
  whenToEscalate: string;
}

export interface AgentConflict {
  conflictPoint: string;
  agentAOpinion: string;
  agentBOpinion: string;
  resolution: string;
}

// Step 12 BS: 风险与指标判断
export interface RiskMetricsResult {
  risks: RiskMatrixItem[];
  metrics: MetricItem[];
}

export interface RiskMatrixItem {
  risk: string;
  probability: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface MetricItem {
  kpiName: string;
  currentBaseline: string;
  targetValue: string;
  dataSource: string;
  measurementPeriod: string;
}

// Step 14 BS: 解决包生成
export interface SolutionPackageResult {
  modules: SolutionPackageModule[];
  packageName: string;
  description: string;
}

export interface SolutionPackageModule {
  name: string;
  clientUsage: string;
  input: string;
  output: string;
  responsibleRole: string;
  acceptanceCriteria: string;
}

// Step 15 BS: 客户使用说明
export interface ClientUsageGuideResult {
  steps: ClientUsageStep[];
  notes: string[];
}

export interface ClientUsageStep {
  stepNumber: number;
  clientAction: string;
  systemAction: string;
  output: string;
  attention: string;
}

// Step 18 BS: 指标验证与沉淀
export interface MetricsValidationResult {
  validations: MetricValidationItem[];
  depositSuggestions: BSDepositSuggestion[];
}

export interface MetricValidationItem {
  metric: string;
  currentBaseline: string;
  targetValue: string;
  dataSource: string;
  measurementPeriod: string;
  verified: boolean;
}

export interface BSDepositSuggestion {
  content: string;
  suggestedType: string;
  reuseScenario: string;
  status: string;
  needsUserConfirm: boolean;
}
