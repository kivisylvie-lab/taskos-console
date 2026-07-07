/**
 * 客户解决包模式 Demo — 供应链优化预置结果数据
 *
 * 当用户点击「加载客户解决包演示案例」后，系统使用此数据完成全流程演示。
 *
 * ⚠️ 所有数据均为 Demo 示例数据，非真实企业数据。
 */
export const BUSINESS_SOLUTION_DEMO_DATA: Record<string, any> = {

  // ---- Step 02: 入口与流程路由判断 ----
  '02-scene-match': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    flowResults: [
      { flowName: 'business-solution', flowLabel: '客户解决包模式', routeRole: 'primary-entry', confidence: 'high', matchedKeywords: ['客户', '企业', '供应链', '库存', '供应商', '解决包', '方案', '交付物', '数据'], matchedIntent: '企业客户业务问题 → 需完整解决包交付', reason: '同时命中角色/场景信号(客户、企业、供应链、库存)和业务信号(风险、数据、交付物)，推荐为客户解决包模式主入口。', recommendedEntry: '客户解决包模式 → 痛点拆解 → 能力组合 → 解决包生成' },
      { flowName: 'task-execution-loop', flowLabel: '任务执行闭环', routeRole: 'support-flow', confidence: 'high', matchedKeywords: ['库存', '供应商', '交付物', '项目', '方案', '汇报'], matchedIntent: '完整交付任务 → 需22步执行闭环', reason: '命中执行/交付信号，且涉及交付物/长期化需求，推荐为任务执行闭环辅助流程。', recommendedEntry: '任务执行闭环 → 目标优化 → 22步完整交付' },
      { flowName: 'executive-brief', flowLabel: '项目汇报材料生成', routeRole: 'support-flow', confidence: 'medium', matchedKeywords: ['老板', '汇报', '管理层', '方案'], matchedIntent: '需要向决策者汇报 → 生成汇报材料', reason: '命中汇报对象和汇报动作信号，推荐生成项目汇报材料。', recommendedEntry: '项目汇报材料 → 13项结构 → 多版本汇报' },
      { flowName: 'multi-agent', flowLabel: '多 Agent 判断', routeRole: 'support-flow', confidence: 'medium', matchedKeywords: ['客户', '供应商', '风险', '数据', '交付物'], matchedIntent: '多角色/多维度 → 可能需要多Agent', reason: '输入涉及多个维度(角色/数据/风险/交付物)，推荐多Agent协同判断。', recommendedEntry: '多Agent判断 → 候选Agent → 协同方案' },
      { flowName: 'capability-routing', flowLabel: '能力路由判断', routeRole: 'support-flow', confidence: 'medium', matchedKeywords: ['分析', '优化', '方案', '数据', '交付物'], matchedIntent: '复杂任务隐含能力选择需求', reason: '命中交付物+数据+任务多类信号，隐含能力路由需求。', recommendedEntry: '能力路由判断 → 任务特征匹配 → 能力类型推荐' },
      { flowName: 'task-triage', flowLabel: '任务分诊', routeRole: 'support-flow', confidence: 'medium', matchedKeywords: ['风险', '缺货', '延迟', '问题'], matchedIntent: '有风险信号 → 辅助分诊', reason: '存在风险相关输入，可作为辅助分诊流程。', recommendedEntry: '任务分诊 → 问题诊断 → 生成解决路线图' },
      { flowName: 'project-onboarding', flowLabel: '项目接入模式', routeRole: 'support-flow', confidence: 'medium', matchedKeywords: ['客户', '项目', '交付物'], matchedIntent: '涉及项目/交付 → 辅助项目接入判断', reason: '命中项目/交付相关信号，可能需要项目接入模式。', recommendedEntry: '项目接入模式 → 项目类型判断 → 接入方案' },
      { flowName: 'product-planning', flowLabel: '产品从0到1规划', routeRole: 'weak-related', confidence: 'low', matchedKeywords: [], matchedIntent: '无产品规划信号', reason: '未检测到产品规划或从0到1相关信号。', recommendedEntry: '产品从0到1规划 → 产品定位 → MVP → PRD → 原型图' },
      { flowName: 'knowledge-ingestion', flowLabel: '知识库摄取', routeRole: 'weak-related', confidence: 'low', matchedKeywords: ['资料', 'SOP'], matchedIntent: '有资料信号 → 弱相关', reason: '命中知识/资料信号，但无明确上传学习意图，弱相关。', recommendedEntry: '知识库摄取 → 文件识别 → 知识卡片 → 待确认入库' },
      { flowName: 'post-use-assessment', flowLabel: '使用后评估', routeRole: 'weak-related', confidence: 'low', matchedKeywords: [], matchedIntent: '无评估需求', reason: '未检测到使用后复盘或效果评估信号。', recommendedEntry: '使用后评估 → 5项评分 → 更新能力库状态' },
      { flowName: 'capability-assessment', flowLabel: '新能力评估', routeRole: 'not-recommended', confidence: 'low', matchedKeywords: [], matchedIntent: '无能力评估信号', reason: '未检测到评估AI能力/工具的信号。', recommendedEntry: '新能力评估 → 能力类型识别 → 综合建议' },
      { flowName: 'system-maintenance', flowLabel: '系统维护', routeRole: 'not-recommended', confidence: 'low', matchedKeywords: [], matchedIntent: '无系统维护信号', reason: '未检测到系统报错、维护、配置等明确信号。', recommendedEntry: '系统维护 → 10项检查 → 整理方案' },
      { flowName: 'simple-task', flowLabel: '普通一次性任务', routeRole: 'not-recommended', confidence: 'low', matchedKeywords: [], matchedIntent: '复杂任务 → 不建议用普通一次性模式', reason: '输入包含企业/客户上下文、交付物需求、风险信号，不适合用普通一次性任务处理。', recommendedEntry: '直接对话 → 简单的Prompt对话 → 快速完成' },
    ],
    primaryEntry: { flowName: 'business-solution', flowLabel: '客户解决包模式', routeRole: 'primary-entry', confidence: 'high', matchedKeywords: ['客户', '企业', '供应链', '库存', '供应商', '解决包', '方案'], matchedIntent: '企业客户业务问题 → 需完整解决包交付', reason: '同时命中角色/场景信号(客户、企业、供应链、库存)和业务信号(风险、数据、交付物)，推荐为客户解决包模式主入口。', recommendedEntry: '客户解决包模式 → 痛点拆解 → 能力组合 → 解决包生成' },
    supportFlows: [],
    laterFlows: [],
    weakRelatedFlows: [],
    notRecommendedFlows: [],
    evidence: ['🎭 角色信号: 客户、企业', '🏭 场景信号: 供应链', '📋 任务信号: 分析、优化、汇报', '📊 数据信号: 库存、数据、SOP', '📦 交付物信号: 解决包、方案、报告', '⚠️ 风险信号: 缺货、延迟'],
  },

  // ---- Step 05 BS: 真实痛点拆解 ----
  '05-task-type-judge': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    diagnosis: '客户面临三大供应链真实痛点：库存数据不准导致补货决策延迟、供应商交期不稳定造成断货风险、采购流程手工重复导致响应慢。本质是数据驱动的供应链决策能力缺失。',
    essence: '企业供应链运营从经验驱动到数据驱动的转型缺口',
    painPoints: [
      {
        surfaceNeed: '部分SKU库存下降很快，担心断货',
        realPainPoint: '库存数据更新不及时，缺乏实时预警机制',
        affectedRoles: ['供应链经理', '采购员', '销售经理'],
        frequency: 'weekly',
        businessImpact: '高——断货导致订单损失和客户不满',
        consequenceIfUnsolved: '持续断货 → 客户流失 → 市场份额下降 → 年损失约 15% 营收',
      },
      {
        surfaceNeed: '供应商A最近交付延期',
        realPainPoint: '供应商交付表现不透明，缺少自动化监控和预警',
        affectedRoles: ['采购经理', '供应链经理'],
        frequency: 'monthly',
        businessImpact: '高——交付延迟造成生产线停工待料',
        consequenceIfUnsolved: '供应中断 → 紧急采购成本 ↑ 30% → 客户交付延迟 → 违约风险',
      },
      {
        surfaceNeed: '供应商B价格更高但交期稳定',
        realPainPoint: '缺乏供应商综合评估模型（价格 vs 交期 vs 质量 vs 配合度）',
        affectedRoles: ['采购经理', '财务'],
        frequency: 'quarterly',
        businessImpact: '中——选错供应商导致成本上升或质量下降',
        consequenceIfUnsolved: '长期依赖高价供应商 → 采购成本 ↑ 12% → 利润率下降',
      },
      {
        surfaceNeed: '不知道怎么向老板汇报',
        realPainPoint: '数据分析结果无法转化为管理层决策摘要',
        affectedRoles: ['供应链总监', 'CEO'],
        frequency: 'weekly',
        businessImpact: '中——决策信息不对称导致决策延迟',
        consequenceIfUnsolved: '决策延迟 → 错失最佳补货窗口 → 库存继续恶化',
      },
    ],
  },

  // ---- Step 06 BS: 数据与资料判断 ----
  '06-knowledge-search': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    searched: true,
    knowledgeBaseUsed: ['采购 SOP', '补货公式', '供应商评估标准', '供应链预警规则'],
    dataRequirements: [
      { requiredData: '库存表（15个SKU + 周转天数）', purpose: '计算补货量和优先级', available: true, missingImpact: '无法判断哪些SKU需要紧急补货', acquisitionMethod: '客户已上传', isSensitive: false },
      { requiredData: '销售预测数据', purpose: '判断未来需求趋势', available: true, missingImpact: '补货量计算不准确', acquisitionMethod: '客户已上传', isSensitive: true },
      { requiredData: '采购订单记录', purpose: '追踪在途订单和交付状态', available: true, missingImpact: '无法追踪订单延迟', acquisitionMethod: '客户已上传', isSensitive: false },
      { requiredData: '供应商报价表', purpose: '比较采购成本', available: true, missingImpact: '无法做成本最优决策', acquisitionMethod: '客户已上传', isSensitive: true },
      { requiredData: '供应商交付异常记录', purpose: '评估供应商可靠性', available: true, missingImpact: '无法识别高风险供应商', acquisitionMethod: '客户已上传', isSensitive: false },
      { requiredData: '采购 SOP', purpose: '确保方案符合企业流程', available: true, missingImpact: '方案可能与现有流程冲突', acquisitionMethod: '客户已上传', isSensitive: false },
    ],
    recommendations: ['数据齐全，可直接进入业务动作定义', '建议接入实时库存系统 MCP 提升预警时效性', '敏感数据仅在本地处理，不外传'],
  },

  // ---- Step 07 BS: 业务动作定义 ----
  '07-delivery-type': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    actions: [
      {
        painPoint: '库存数据更新不及时，缺乏实时预警机制',
        actionName: '生成库存风险等级分析',
        triggerCondition: '库存周转天数 > 30天 或 库存量 < 安全库存',
        outputResult: '按风险等级（紧急/高/中/低）分类的 SKU 补货优先级表',
        executor: '系统自动 + 供应链经理确认',
        needsHumanConfirm: true,
      },
      {
        painPoint: '供应商交付表现不透明',
        actionName: '供应商综合评分 + 交付监控',
        triggerCondition: '每次采购订单创建或交付异常发生',
        outputResult: '供应商四维度评分（交期/质量/价格/配合度）+ 异常预警',
        executor: '系统自动 + 采购经理确认',
        needsHumanConfirm: false,
      },
      {
        painPoint: '缺乏供应商综合评估模型',
        actionName: '供应商替换方案生成',
        triggerCondition: '供应商评分 < 60 分或连续 3 次交付延迟',
        outputResult: '备选供应商推荐 + 成本比较 + 切换风险评估',
        executor: '系统生成 + 采购总监审批',
        needsHumanConfirm: true,
      },
      {
        painPoint: '数据分析无法转化为管理层摘要',
        actionName: '生成老板汇报材料',
        triggerCondition: '每次补货方案确认前',
        outputResult: '1分钟/3分钟/10分钟汇报稿 + 关键决策建议',
        executor: '系统生成 + 供应链总监确认',
        needsHumanConfirm: true,
      },
    ],
  },

  // ---- Step 08 BS: AI 组合方案 ----
  '08-capability-precheck': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    plans: [
      {
        painPoint: '库存数据更新不及时',
        recommendedCombination: 'RAG 知识库（补货公式）+ Prompt 分析 + Tool（CSV 处理）+ Hook（库存预警触发）',
        whySuitable: '补货公式固定可结构化，库存表可程序化处理，预警需要自动触发',
        notSuitableFor: '不需要多 Agent 协作，单次分析即可',
        risk: '补货公式可能不适用特殊 SKU（促销品/新品），需人工审核',
        minimalVerification: '取 3 个 SKU 手动计算补货量，与 CSV Tool 结果对比',
      },
      {
        painPoint: '供应商交付表现不透明',
        recommendedCombination: 'Prompt 评分模型 + Tool（供应商评分计算）+ MCP（如需接入 ERP）',
        whySuitable: '评分维度可由 AI 灵活调整，计算逻辑适合 Tool 封装',
        notSuitableFor: '如果只有 8 家供应商不需要 MCP，Excel 即可',
        risk: '评分权重需要客户确认，不可由 AI 单方面决定',
        minimalVerification: '用供应商A的数据手动算分，对比 AI 评分结果',
      },
      {
        painPoint: '缺乏供应商综合评估模型',
        recommendedCombination: '多 Agent（采购 Agent + 财务 Agent + 质量 Agent）+ 人工审批',
        whySuitable: '涉及多维度判断（价格/交期/质量），多角色独立分析更全面',
        notSuitableFor: '简单替换（仅比较价格）可只用 Prompt',
        risk: 'Agent 冲突：采购倾向价格低，质量倾向交期稳，需主控 Agent 汇总',
        minimalVerification: '让 3 个 Agent 分别评估供应商A和B，对比最终推荐',
      },
      {
        painPoint: '数据分析无法转化为管理层摘要',
        recommendedCombination: 'Prompt 模板（汇报材料生成）+ 老板视角 Agent + Hook（质量检查）',
        whySuitable: '汇报有固定模板结构，老板视角 Agent 确保汇报符合决策需求',
        notSuitableFor: '不需要 Skill（一次性汇报，不是高频重复）',
        risk: 'AI 生成的决策建议需要人工复核，不可直接作为决策依据',
        minimalVerification: '生成 1 分钟汇报版，让同事检查是否清晰易懂',
      },
    ],
  },

  // ---- Step 09 BS: 能力与工具选择 ----
  '09-local-capability-scan': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    scannedSources: [
      { source: 'KIVIDAILYLIFE/能力分类/', found: true, capabilities: ['Prompt 模板', '项目汇报材料生成', '能力路由判断', '多 Agent 编排'] },
      { source: '常用Prompt.md', found: true, capabilities: ['表格分析 Prompt', '供应商评估 Prompt', '老板汇报 Prompt'] },
      { source: '当前项目 README.md', found: true, capabilities: ['AI 能力路由', '流水线执行'] },
    ],
    capabilitySelection: [
      { businessStep: '库存风险分析', capabilityType: 'Tool', specificCapability: 'CSV 数据分析脚本', source: '项目内 Tool', available: true, needsConfirm: false, evidence: 'tools/csv_analyzer.ts' },
      { businessStep: '库存风险分析', capabilityType: 'Prompt', specificCapability: '补货优先级分析 Prompt', source: '本地能力库', available: true, needsConfirm: false, evidence: '常用Prompt.md' },
      { businessStep: '供应商评估', capabilityType: 'Prompt', specificCapability: '四维度评分模型 Prompt', source: '本地能力库', available: true, needsConfirm: false, evidence: '常用Prompt.md' },
      { businessStep: '供应商评估', capabilityType: 'Skill', specificCapability: '供应商综合评分 Skill', source: '待自建', available: false, needsConfirm: true, evidence: '建议自建为 Skill 以便复用' },
      { businessStep: '多Agent审查', capabilityType: 'SubAgent', specificCapability: '采购Agent + 财务Agent + 质量Agent', source: 'KIVIDAILYLIFE 规则 29', available: true, needsConfirm: true, evidence: 'agent_outputs/' },
      { businessStep: '老板汇报', capabilityType: 'Prompt', specificCapability: 'Executive Brief Prompt', source: '本地能力库', available: true, needsConfirm: false, evidence: '常用Prompt.md' },
      { businessStep: '质量检查', capabilityType: 'Hook', specificCapability: '10 项质量门禁检查清单', source: 'KIVIDAILYLIFE 规则 28', available: true, needsConfirm: false, evidence: 'hooks/quality-gate-checklist.md' },
      { businessStep: '预警触发', capabilityType: 'Hook', specificCapability: '库存预警自动触发', source: '待自建', available: false, needsConfirm: true, evidence: '建议接入 MCP 库存系统后启用' },
    ],
  },

  // ---- Step 10 BS: 多Agent / 人工审批 ----
  '10-github-search-judge': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    agents: [
      {
        agentName: '供应链Agent',
        role: '供应链专家',
        verdict: '补货方案逻辑合理，建议增加安全库存动态调整机制。当前方案基于静态安全库存，未考虑季节性波动。',
        issuesFound: ['安全库存公式未考虑季节性波动', '补货提前期未区分紧急/常规订单'],
        suggestions: ['引入季节性因子 (0.8-1.5) 调整安全库存', '按订单紧急程度设定不同补货提前期'],
        passed: true,
      },
      {
        agentName: '财务Agent',
        role: '财务成本分析师',
        verdict: '供应商成本比较清晰，但未计算切换供应商的转换成本。B 供应商价格高 12%，但交期稳定可降低紧急采购成本。',
        issuesFound: ['未计算供应商切换成本（合同转换、质量验证、试单）', '未计算缺货导致的销售损失'],
        suggestions: ['增加 TCO（总拥有成本）计算', '将缺货损失纳入成本模型'],
        passed: true,
      },
      {
        agentName: '老板视角Agent',
        role: '决策层视角',
        verdict: '整体方案可操作性强，但风险部分需要更量化的展示。老板最关心的是：不解决这些问题会损失多少钱。',
        issuesFound: ['汇报材料缺少量化损失预估', '1分钟版本需要更直接的数字'],
        suggestions: ['增加"不行动的代价"量化分析（年损失预估）', '1分钟版本以 3 个数字开头：库存损失、供应商风险、总影响金额'],
        passed: true,
      },
      {
        agentName: '质量审查Agent',
        role: '交付质量审查',
        verdict: '所有交付物清单齐全，使用说明清晰。需补充 Demo 边界说明和真实环境需要的额外准备。',
        issuesFound: ['未标注哪些是 Demo 模拟、哪些需要真实系统', '未说明 MCP 接入需要什么权限'],
        suggestions: ['在 README 增加 Demo 边界说明', '列出生产环境部署需要的额外准备'],
        passed: false,
      },
    ],
    humanApprovalSteps: [
      { step: '补货优先级确认', approver: '供应链经理', whatToCheck: '补货量和优先级是否合理，是否有遗漏的 SKU', whenToEscalate: '涉及金额 > 50 万或紧急补货 > 10 万' },
      { step: '供应商切换审批', approver: '采购总监', whatToCheck: '供应商切换方案是否可行，风险是否可控', whenToEscalate: '切换核心供应商或涉及合同违约风险' },
      { step: '成本方案确认', approver: '财务经理', whatToCheck: '成本估算是否准确，预算是否充足', whenToEscalate: '超出部门预算 20% 以上' },
      { step: '最终方案审批', approver: '供应链总监 / CEO', whatToCheck: '方案整体合理性、风险、ROI', whenToEscalate: '涉及公司战略供应商变更' },
    ],
    conflicts: [
      {
        conflictPoint: '是否立即切换供应商A到供应商B',
        agentAOpinion: '供应链Agent：建议分阶段切换，先增加B的采购比例至 30%，观察 3 个月后再决定',
        agentBOpinion: '财务Agent：如果 B 价格高 12% 但交期从 70% 提升到 95%，ROI 为正，建议 2 个月内完成切换',
        resolution: '采用分阶段方案：第 1 个月将 B 采购比例提升至 30%，第 2-3 个月评估后决定是否继续增加。保留 A 作为备份供应商。',
      },
    ],
  },

  // ---- Step 11 BS: 交付物与解决包判断 ----
  '11-multi-agent-judge': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    multiAgentNeeded: true,
    agents: [
      { role: '供应链Agent', purpose: '审核补货逻辑和库存策略', inputMaterials: '库存表、销售预测、补货公式' },
      { role: '财务Agent', purpose: '审核成本分析和供应商经济性', inputMaterials: '供应商报价、采购订单、成本模型' },
      { role: '老板视角Agent', purpose: '确保汇报材料满足决策需求', inputMaterials: '方案摘要、风险矩阵' },
      { role: '质量审查Agent', purpose: '交付物完整性最终检查', inputMaterials: '所有交付物' },
    ],
    deliveries: [
      { name: '供应链补货预警解决包', type: 'system', format: '解决包（Web 页面 + 表格 + 自动化流程）', required: 'must', description: '客户可直接使用的补货预警系统' },
      { name: '库存风险分析报告', type: 'document', format: 'Markdown + 表格', required: 'must', description: '按 SKU 的风险等级、周转天数、缺货概率' },
      { name: '补货优先级表', type: 'data', format: 'CSV', required: 'must', description: '紧急/高/中/低四级，含建议补货量、推荐供应商、预计成本' },
      { name: '供应商综合评分表', type: 'data', format: 'CSV', required: 'must', description: '四维度评分 + 综合排名 + 切换建议' },
      { name: '客户使用说明', type: 'document', format: 'Markdown', required: 'must', description: '非技术人员可理解的操作步骤和使用注意事项' },
      { name: '老板/客户汇报材料', type: 'document', format: 'Markdown', required: 'must', description: '1分钟/3分钟/10分钟版本 + 关键决策建议' },
      { name: 'AI 能力调用记录', type: 'document', format: 'Markdown', required: 'must', description: '每步能力使用证据' },
      { name: '指标验证报告', type: 'document', format: 'Markdown', required: 'must', description: 'KPI 基线与目标对比' },
    ],
  },

  // ---- Step 12 BS: 风险与指标判断 ----
  '12-capability-route': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    risks: [
      { risk: '补货量计算偏差导致库存积压或短缺', probability: 'medium', impact: '高——库存成本增加或断货损失', mitigation: '用历史 3 个月数据回测补货公式，偏差 > 15% 时触发人工审核' },
      { risk: '供应商切换导致短期供应不稳定', probability: 'medium', impact: '高——生产停工风险', mitigation: '分阶段切换，保留 A 供应商作为备份，过渡期双重供货' },
      { risk: '客户数据不完整或存在错误', probability: 'low', impact: '中——分析结果偏差', mitigation: '数据预处理阶段增加完整性检查，异常值标记人工确认' },
      { risk: 'AI 生成的供应商评分权重不合理', probability: 'low', impact: '中——供应商选择偏差', mitigation: '评分权重需客户确认，提供敏感性分析（不同权重下的排名变化）' },
      { risk: 'Demo 功能被误认为真实商用系统', probability: 'medium', impact: '中——客户期望偏差', mitigation: '所有交付物明确标注 Demo 边界和真实环境需要的额外准备' },
    ],
    metrics: [
      { kpiName: '库存周转天数', currentBaseline: '45 天', targetValue: '30 天', dataSource: '库存管理系统', measurementPeriod: '月度' },
      { kpiName: '缺货率', currentBaseline: '8%', targetValue: '3%', dataSource: '销售订单系统', measurementPeriod: '月度' },
      { kpiName: '供应商准时交付率', currentBaseline: '70%', targetValue: '90%', dataSource: '采购订单系统', measurementPeriod: '月度' },
      { kpiName: '采购订单延迟率', currentBaseline: '20%', targetValue: '5%', dataSource: '采购订单系统', measurementPeriod: '月度' },
      { kpiName: '人工补货决策时间', currentBaseline: '2 天', targetValue: '4 小时', dataSource: '工作日志', measurementPeriod: '每次补货' },
      { kpiName: '紧急采购次数', currentBaseline: '12 次/年', targetValue: '3 次/年', dataSource: '采购记录', measurementPeriod: '年度' },
      { kpiName: '供应商评估覆盖度', currentBaseline: '30%（仅价格）', targetValue: '100%（四维度）', dataSource: '供应商数据库', measurementPeriod: '季度' },
      { kpiName: '老板决策信息准备时间', currentBaseline: '1 周', targetValue: '1 天', dataSource: '工作日志', measurementPeriod: '每次汇报' },
    ],
  },

  // ---- Step 13 BS: 用户确认执行方案 ----
  '13-confirm-plan': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    confirmed: true,
    confirmedAt: new Date().toISOString(),
    plan: {
      goal: '为客户生成供应链补货预警解决包——包含风险分析、补货优先级、供应商评估、汇报材料和客户使用说明',
      mode: '客户解决包模式 (Business Solution Mode)',
      sceneType: 'business-solution',
      steps: [
        '✅ 场景匹配：客户解决包模式',
        '✅ 真实痛点拆解：4 个核心痛点已识别',
        '✅ 数据与资料判断：6 项数据全部就绪',
        '✅ 业务动作定义：4 个业务动作已定义',
        '✅ AI 组合方案：4 组 AI 能力组合已确定',
        '✅ 能力与工具选择：8 项具体能力已选定',
        '✅ 多Agent/人工审批：4 个 Agent 审查完成 + 4 步审批流程',
        '▶️ 待执行：解决包生成、客户使用说明、汇报材料、指标验证、知识沉淀',
      ],
    },
  },

  // ---- Step 14 BS: 解决包生成 ----
  '14-execute-generate': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    packageName: '供应链补货预警解决包',
    description: '面向制造企业的供应链智能补货与供应商管理解决方案——客户可直接使用 Web 页面查看库存风险、补货优先级和供应商评分，系统自动触发预警并生成管理层汇报材料。',
    modules: [
      { name: '库存风险看板', clientUsage: '登录 Web 页面 → 查看 SKU 风险等级和周转天数', input: '库存表 CSV', output: '风险等级可视化图表', responsibleRole: '供应链经理', acceptanceCriteria: '所有 SKU 风险等级准确率 > 95%' },
      { name: '补货优先级表', clientUsage: '下载 CSV → 按优先级排序 → 提交采购审批', input: '风险分析结果 + 销售预测', output: '补货优先级 CSV', responsibleRole: '采购员', acceptanceCriteria: '紧急补货清单无遗漏' },
      { name: '供应商评分表', clientUsage: '查看四维度评分 → 对比备选供应商 → 提交切换方案审批', input: '供应商报价 + 交付记录', output: '供应商评分排名 CSV', responsibleRole: '采购经理', acceptanceCriteria: '评分维度覆盖交期/质量/价格/配合度' },
      { name: '自动预警机制', clientUsage: '设置预警阈值 → 系统自动监控 → 邮件/消息通知', input: '预警规则配置', output: '实时预警通知', responsibleRole: '供应链经理', acceptanceCriteria: '预警延迟 < 1 小时' },
      { name: '老板汇报材料', clientUsage: '下载汇报稿 → 选择版本（1/3/10分钟）→ 汇报', input: '方案摘要数据', output: '多版本汇报材料', responsibleRole: '供应链总监', acceptanceCriteria: '1 分钟版 ≤ 200 字且涵盖核心结论' },
      { name: '客户使用说明', clientUsage: '按步骤操作 → 上传资料 → 查看结果 → 确认/审批', input: '业务资料', output: '操作指南 + 培训 checklist', responsibleRole: '客户项目负责人', acceptanceCriteria: '非技术人员 10 分钟内可独立操作' },
    ],
  },

  // ---- Step 15 BS: 客户使用说明生成 ----
  '15-quality-check': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    steps: [
      { stepNumber: 1, clientAction: '上传库存表、销售预测、采购订单、供应商报价和交付记录', systemAction: '系统自动识别文件类型、提取关键字段、数据完整性检查', output: '数据导入完成确认 + 异常数据标记', attention: 'CSV 文件需包含表头，日期格式统一为 YYYY-MM-DD' },
      { stepNumber: 2, clientAction: '进入库存风险看板，查看 SKU 风险等级', systemAction: 'AI 根据库存数据、周转天数、销售预测自动计算风险等级', output: '风险等级可视化页面（紧急/高/中/低四色标注）', attention: '首次使用建议人工复核 3-5 个 SKU 验证准确率' },
      { stepNumber: 3, clientAction: '查看补货优先级表，确认或调整补货量', systemAction: 'AI 根据补货公式和风险等级生成推荐补货量', output: '补货优先级 CSV（含 SKU、建议补货量、推荐供应商、预计成本）', attention: '促销品和新品的补货量需人工微调' },
      { stepNumber: 4, clientAction: '查看供应商评分表，决定是否切换供应商', systemAction: 'AI 综合四维度评分并排名，标记高风险供应商', output: '供应商评分排名 + 切换方案建议', attention: '供应商切换需走审批流程，不可直接操作' },
      { stepNumber: 5, clientAction: '确认预警规则，开启自动监控', systemAction: '系统按规则定时检查库存和供应商状态', output: '预警通知（邮件/消息）', attention: 'Demo 版本预警为模拟，真实环境需接入 MCP' },
      { stepNumber: 6, clientAction: '向老板/客户汇报', systemAction: '下载汇报材料，选择版本', output: '1/3/10 分钟汇报稿', attention: 'AI 生成的决策建议仅供参考，需要人工复核' },
      { stepNumber: 7, clientAction: '每周复盘指标看板', systemAction: '系统自动对比基线 vs 目标值', output: '指标验证报告', attention: '前 3 个月为试运行期，指标可能存在波动' },
    ],
    notes: [
      '本解决包为 Demo 版本，所有数据为示例数据',
      '生产环境需要：接入真实库存管理系统（ERP/WMS）、配置邮件/消息通知服务、设置多用户权限',
      '建议首次使用前安排 30 分钟使用培训',
      '补货方案涉及资金决策，所有 AI 建议均需人工确认后执行',
      '供应商评分权重建议每季度与采购团队复核一次',
      '如库存数据异常（单日波动 > 50%），系统会标记为"待确认"，需要人工核查',
    ],
  },

  // ---- Step 16 BS: 汇报材料生成 ----
  '16-generate-deliverables': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    files: [
      { name: '项目汇报材料.md', path: 'output/项目汇报材料.md', size: 8500, type: 'markdown', generated: true },
      { name: '客户使用说明.md', path: 'output/客户使用说明.md', size: 6200, type: 'markdown', generated: true },
      { name: 'AI能力调用记录.md', path: 'output/AI能力调用记录.md', size: 4800, type: 'markdown', generated: true },
      { name: '供应链补货预警方案.md', path: 'output/供应链补货预警方案.md', size: 12000, type: 'markdown', generated: true },
      { name: '补货优先级表.csv', path: 'output/补货优先级表.csv', size: 3500, type: 'csv', generated: true },
      { name: '供应商评分表.csv', path: 'output/供应商评分表.csv', size: 2800, type: 'csv', generated: true },
    ],
    totalCount: 6,
  },

  // ---- Step 17 BS: AI 能力调用记录 ----
  '17-call-record-materials': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    recordMarkdown: '# AI能力调用记录\n\n客户解决包模式 — 供应链优化 Demo',
    recordPath: 'output/AI能力调用记录.md',
  },

  // ---- Step 18 BS: 指标验证与沉淀 ----
  '18-assessment-deposit': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    validations: [
      { metric: '库存周转天数', currentBaseline: '45 天', targetValue: '30 天', dataSource: '库存管理系统', measurementPeriod: '月度', verified: false },
      { metric: '缺货率', currentBaseline: '8%', targetValue: '3%', dataSource: '销售订单系统', measurementPeriod: '月度', verified: false },
      { metric: '供应商准时交付率', currentBaseline: '70%', targetValue: '90%', dataSource: '采购订单系统', measurementPeriod: '月度', verified: false },
      { metric: '人工补货决策时间', currentBaseline: '2 天', targetValue: '4 小时', dataSource: '工作日志', measurementPeriod: '每次补货', verified: false },
    ],
    depositSuggestions: [
      { content: '供应链补货预警解决包模板', suggestedType: '解决包模板', reuseScenario: '其他制造企业供应链优化', status: '待测试', needsUserConfirm: true },
      { content: '库存风险分析四维评估法', suggestedType: 'Skill', reuseScenario: '任何库存管理场景', status: '待测试', needsUserConfirm: true },
      { content: '供应商综合评分 Skill', suggestedType: 'Skill', reuseScenario: '供应商评估与选择', status: '待自建', needsUserConfirm: true },
      { content: '老板汇报材料生成 Prompt', suggestedType: 'Prompt', reuseScenario: '所有需要向管理层汇报的场景', status: '已验证', needsUserConfirm: false },
      { content: '供应链 Agent 角色定义', suggestedType: 'Agent', reuseScenario: '供应链相关多 Agent 审查', status: '待测试', needsUserConfirm: true },
      { content: '库存预警 Hook 规则', suggestedType: 'Hook', reuseScenario: '任何需要库存监控的系统', status: '待自建', needsUserConfirm: true },
      { content: '客户使用说明模板', suggestedType: '模板', reuseScenario: '所有客户解决包项目', status: '已验证', needsUserConfirm: false },
      { content: 'KPI 指标验证模板', suggestedType: '指标模板', reuseScenario: '所有需要量化验证的项目', status: '已验证', needsUserConfirm: false },
    ],
  },
};
