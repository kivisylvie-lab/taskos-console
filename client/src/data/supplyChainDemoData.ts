/**
 * 供应链决策 Demo — 预置结果数据
 *
 * 当用户点击「加载供应链演示案例」后，系统使用此数据完成全流程演示，
 * 无需调用真实 AI API。
 *
 * ⚠️ 所有数据均为 Demo 示例数据，非真实企业数据。
 */

export const SUPPLY_CHAIN_DEMO_DATA: Record<string, any> = {

  // ---- Step 02: 入口与流程路由判断 ----
  '02-scene-match': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    flowResults: [
      { flowName: 'task-execution-loop', flowLabel: '任务执行闭环', routeRole: 'primary-entry', confidence: 'high', matchedKeywords: ['库存', '补货', '供应商', '交付物', '项目', '汇报', '方案', '分析'], matchedIntent: '完整交付任务 → 需22步执行闭环', reason: '命中执行/交付信号，且涉及交付物/长期化需求，推荐为任务执行闭环主入口。', recommendedEntry: '任务执行闭环 → 目标优化 → 22步完整交付' },
      { flowName: 'executive-brief', flowLabel: '项目汇报材料生成', routeRole: 'support-flow', confidence: 'high', matchedKeywords: ['老板', '汇报', '管理层', '方案', '报告'], matchedIntent: '需要向决策者汇报 → 生成汇报材料', reason: '命中汇报对象和汇报动作信号，推荐生成项目汇报材料。', recommendedEntry: '项目汇报材料 → 13项结构 → 多版本汇报' },
      { flowName: 'capability-routing', flowLabel: '能力路由判断', routeRole: 'support-flow', confidence: 'medium', matchedKeywords: ['分析', '评估', '优化', '方案', '报告'], matchedIntent: '复杂任务隐含能力选择需求', reason: '命中交付物+数据+任务多类信号，隐含能力路由需求。', recommendedEntry: '能力路由判断 → 任务特征匹配 → 能力类型推荐' },
      { flowName: 'multi-agent', flowLabel: '多 Agent 判断', routeRole: 'support-flow', confidence: 'medium', matchedKeywords: ['库存', '供应商', '采购', '风险', '交付物'], matchedIntent: '多角色/多维度 → 可能需要多Agent', reason: '输入涉及多个维度(数据/风险/交付物)，推荐多Agent协同判断。', recommendedEntry: '多Agent判断 → 候选Agent → 协同方案' },
      { flowName: 'business-solution', flowLabel: '客户解决包模式', routeRole: 'support-flow', confidence: 'medium', matchedKeywords: ['库存', '供应商', '方案', '交付物', '汇报'], matchedIntent: '企业相关输入 → 可能适合解决包模式', reason: '命中业务场景信号，但业务信号不足，作为辅助流程推荐。', recommendedEntry: '客户解决包模式 → 痛点拆解 → 能力组合 → 解决包生成' },
      { flowName: 'task-triage', flowLabel: '任务分诊', routeRole: 'support-flow', confidence: 'medium', matchedKeywords: ['库存', '积压', '缺货', '延迟', '风险'], matchedIntent: '有任务或风险信号 → 可能需分诊', reason: '存在风险相关输入，可作为辅助分诊流程判断是否需要生成路线图。', recommendedEntry: '任务分诊 → 问题诊断 → 生成解决路线图' },
      { flowName: 'project-onboarding', flowLabel: '项目接入模式', routeRole: 'weak-related', confidence: 'low', matchedKeywords: ['项目'], matchedIntent: '有项目创建信号 → 弱相关', reason: '未检测到明确的创建项目或项目接入需求。', recommendedEntry: '项目接入模式 → 项目类型判断 → 接入方案' },
      { flowName: 'product-planning', flowLabel: '产品从0到1规划', routeRole: 'weak-related', confidence: 'low', matchedKeywords: [], matchedIntent: '无产品规划信号', reason: '未检测到产品规划或从0到1相关信号。', recommendedEntry: '产品从0到1规划 → 产品定位 → MVP → PRD → 原型图' },
      { flowName: 'knowledge-ingestion', flowLabel: '知识库摄取', routeRole: 'weak-related', confidence: 'low', matchedKeywords: [], matchedIntent: '无资料学习需求', reason: '未检测到上传资料、学习文档或知识提取的信号。', recommendedEntry: '知识库摄取 → 文件识别 → 知识卡片 → 待确认入库' },
      { flowName: 'post-use-assessment', flowLabel: '使用后评估', routeRole: 'weak-related', confidence: 'low', matchedKeywords: [], matchedIntent: '无评估需求', reason: '未检测到使用后复盘或效果评估信号。', recommendedEntry: '使用后评估 → 5项评分 → 更新能力库状态' },
      { flowName: 'capability-assessment', flowLabel: '新能力评估', routeRole: 'not-recommended', confidence: 'low', matchedKeywords: [], matchedIntent: '无能力评估信号', reason: '未检测到评估AI能力/工具的信号。', recommendedEntry: '新能力评估 → 能力类型识别 → 综合建议' },
      { flowName: 'system-maintenance', flowLabel: '系统维护', routeRole: 'not-recommended', confidence: 'low', matchedKeywords: [], matchedIntent: '无系统维护信号', reason: '未检测到系统报错、维护、配置或能力库整理等明确信号。', recommendedEntry: '系统维护 → 10项检查 → 整理方案' },
      { flowName: 'simple-task', flowLabel: '普通一次性任务', routeRole: 'not-recommended', confidence: 'low', matchedKeywords: [], matchedIntent: '复杂任务 → 不建议用普通一次性模式', reason: '输入包含交付物需求、风险/痛点信号，不适合用普通一次性任务处理。', recommendedEntry: '直接对话 → 简单的Prompt对话 → 快速完成' },
    ],
    primaryEntry: { flowName: 'task-execution-loop', flowLabel: '任务执行闭环', routeRole: 'primary-entry', confidence: 'high', matchedKeywords: ['库存', '补货', '供应商', '交付物', '项目', '汇报', '方案', '分析'], matchedIntent: '完整交付任务 → 需22步执行闭环', reason: '命中执行/交付信号，且涉及交付物/长期化需求，推荐为任务执行闭环主入口。', recommendedEntry: '任务执行闭环 → 目标优化 → 22步完整交付' },
    supportFlows: [],
    laterFlows: [],
    weakRelatedFlows: [],
    notRecommendedFlows: [],
    evidence: ['🏭 场景信号: 供应链', '📋 任务信号: 分析、优化、汇报', '📊 数据信号: 库存、数据、报表', '📦 交付物信号: 报告、方案', '⚠️ 风险信号: 积压、缺货、延迟'],
  },

  // ---- Step 05: 任务类型判断 ----
  '05-task-type-judge': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    diagnosis: '供应链决策优化任务。用户面临库存周转慢（45天 vs 目标30天）、供应商交期不稳定（准时率70%）、采购订单延迟（20%）三大问题。需要数据分析 + 决策方案 + 老板汇报。',
    taskType: 'project',
    isProjectTask: true,
    complexity: 'high',
    estimatedSteps: 18,
    needsMultiAgent: true,
    needsKnowledgeBase: true,
    needsGitHubSearch: false,
  },

  // ---- Step 06: 知识库检索 ----
  '06-knowledge-search': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    searched: true,
    knowledgeBaseUsed: ['采购 SOP', '补货公式', '供应商评估标准'],
    searchResults: [
      { source: 'procurement_sop.md', relevance: 'high', content: '补货触发规则、建议补货量公式、供应商评估四维度、库存健康度标准' },
    ],
    recommendations: ['使用采购 SOP 中的补货公式', '按四维度评估供应商', '参照库存健康度标准判断风险等级'],
  },

  // ---- Step 07: 交付物类型判断 ----
  '07-delivery-type': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    deliveries: [
      { name: '库存风险分析报告', type: 'document', format: 'Markdown + 表格', required: true, description: '按 SKU 的风险等级、周转天数、缺货概率' },
      { name: '补货优先级表', type: 'data', format: 'CSV', required: true, description: '紧急/高/中/低四级，含建议补货量' },
      { name: '供应商评分表', type: 'data', format: 'CSV', required: true, description: '交期/质量/价格/配合度四维度评分' },
      { name: '多 Agent 评审结果', type: 'document', format: 'Markdown', required: true, description: '产品经理+商业+技术+质量四种视角独立输出' },
      { name: '老板汇报材料', type: 'document', format: 'Markdown', required: true, description: '一句话汇报 + 1/3/10 分钟版本' },
      { name: '能力路由表', type: 'document', format: 'Markdown', required: true, description: '每一步用什么能力及判断依据' },
      { name: 'AI 能力调用记录', type: 'document', format: 'Markdown', required: true, description: '每一步的能力使用证据' },
    ],
    hasVisualDeliverable: false,
    needsUserConfirm: true,
  },

  // ---- Step 08: 能力执行前置检查 ----
  '08-capability-precheck': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    checks: [
      { item: '是否扫描本地能力库', done: true, evidence: 'KIVIDAILYLIFE/能力分类/ + 常用Prompt.md' },
      { item: '是否发现可用 Skill', done: false, evidence: '本地暂无供应链专用 Skill' },
      { item: '是否发现可用 Hook', done: true, evidence: '质量门禁检查清单 Hook' },
      { item: '是否发现可用 Tool', done: true, evidence: 'CSV 数据分析 Tool / 补货公式计算' },
      { item: '是否发现可用 MCP', done: false, evidence: '当前未接入真实 ERP/WMS MCP' },
      { item: '是否需要 GitHub 搜索', done: false, evidence: '本地能力库已有匹配能力' },
      { item: '是否需要自建能力', done: false, evidence: '当前能力组合已可完成' },
      { item: '是否需要用户确认', done: true, evidence: '交付物清单已确认' },
    ],
  },

  // ---- Step 09: 本地能力扫描 ----
  '09-local-capability-scan': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    scannedSources: [
      { source: 'KIVIDAILYLIFE/能力分类/', found: true, capabilities: ['Prompt 模板', '项目汇报材料生成', '能力路由判断', '多 Agent 编排'] },
      { source: 'KIVIDAILYLIFE/常用Prompt.md', found: true, capabilities: ['数据分析 Prompt', '汇报材料 Prompt', '风险评估 Prompt'] },
      { source: '项目 README.md', found: true, capabilities: [] },
      { source: '项目 CLAUDE.md', found: false, capabilities: [] },
      { source: '项目 skills/', found: false, capabilities: [] },
      { source: '项目 hooks/', found: false, capabilities: [] },
      { source: '项目 tools/', found: false, capabilities: [] },
      { source: '项目 mcp/', found: false, capabilities: [] },
    ],
    availableCapabilities: ['Prompt', 'Multi-Agent', 'Hook', 'Tool'],
    missingCapabilities: ['MCP (ERP/WMS 连接)', '供应链专用 Skill'],
  },

  // ---- Step 10: GitHub 搜索判断 ----
  '10-github-search-judge': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    needSearch: false,
    reason: '本地能力库已有匹配能力（Prompt + Multi-Agent + Hook + Tool），不需要搜索外部能力。',
    searchedTypes: [],
  },

  // ---- Step 11: 多 Agent 判断 ----
  '11-multi-agent-judge': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    needsMultiAgent: true,
    selectedAgents: [
      { name: '产品经理 Agent', use: true, reason: '供应链补货是产品型决策，需要功能规划视角', input: '库存/销售/采购数据', output: '补货方案审阅' },
      { name: '商业价值 Agent', use: true, reason: '需要判断成本影响和商业价值', input: '库存金额/采购成本', output: '商业影响分析' },
      { name: '技术架构 Agent', use: true, reason: '需要验证数据分析和公式正确性', input: 'SOP/公式/CSV 结构', output: '技术可行性验证' },
      { name: '质量审查 Agent', use: true, reason: '所有交付物需质量把关', input: '全部输出', output: '质量审查报告' },
      { name: '老板视角 Agent', use: false, reason: '由汇报材料单独处理' },
      { name: '法务合规 Agent', use: false, reason: '不涉及合同/合规' },
    ],
    agentOutputs: {
      productManager: {
        conclusion: '✅ 通过，建议优化',
        issues: ['补货优先级未考虑 SKU 替代关系', '建议增加季节因子（润滑油夏季用量更大）'],
        suggestions: ['增加「可替代 SKU」列', '增加季节调整系数'],
      },
      businessValue: {
        conclusion: '✅ 通过',
        findings: [
          '库存积压 5 个 SKU，占用资金约 ¥285,000',
          '紧急缺货 3 个 SKU，月损失销售额约 ¥42,000',
          '供应商 E (SKU-009) 和供应商 D (SKU-006) 评分低于 6 分，建议启动备选',
          '周转天数降至 30 天可释放约 ¥190,000 库存资金',
        ],
      },
      technicalArchitect: {
        conclusion: '✅ 通过',
        verified: ['补货量公式正确', '供应商评分权重总和 100%', 'CSV 数据结构完整'],
        risk: '当前为静态 CSV 分析，真实场景需对接 ERP 实时数据',
      },
      qualityReview: {
        conclusion: '✅ 通过',
        checks: [
          { item: '有无漏项', pass: true },
          { item: '有无空泛', pass: true },
          { item: '有无夸大', pass: true },
          { item: '是否可落地', pass: true, note: '数据为模拟，真实场景需替换' },
          { item: '是否标注 Demo', pass: true },
          { item: '是否暴露隐私', pass: true },
        ],
      },
    },
    conflicts: [],
    finalDecision: '✅ 总体通过。所有交付物可发布，标注为 Demo 示例。',
  },

  // ---- Step 12: 能力路由 ----
  '12-capability-route': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    routingTable: [
      { step: 1, action: '场景匹配', capabilityType: 'Prompt', specificCapability: '本地场景匹配引擎', reason: '低延迟、无需 API、19 场景覆盖', confidence: '高', alternative: 'AI 深度匹配（需要 API Key）' },
      { step: 2, action: '知识库检索', capabilityType: 'Prompt', specificCapability: '采购 SOP 知识检索', reason: '已有 SOP 文档，直接检索', confidence: '高', alternative: '知识库 MCP（未接入）' },
      { step: 3, action: '交付物判断', capabilityType: 'Prompt', specificCapability: '交付物类型路由规则', reason: '7 种类型判断，规则明确', confidence: '高', alternative: '—' },
      { step: 4, action: '库存风险分析', capabilityType: 'Prompt + Tool', specificCapability: 'CSV 数据分析 + 风险评估', reason: '结构化数据适合工具处理', confidence: '高', alternative: 'Python 脚本自动分析' },
      { step: 5, action: '补货优先级计算', capabilityType: 'Tool', specificCapability: '补货公式计算', reason: '固定公式，可脚本化', confidence: '高', alternative: 'Excel 公式' },
      { step: 6, action: '供应商评分', capabilityType: 'Prompt + Tool', specificCapability: '四维度加权评分', reason: '多维评分需综合判断', confidence: '中', alternative: 'MCP 连接 ERP（未接入）' },
      { step: 7, action: '多 Agent 评审', capabilityType: 'Multi-Agent', specificCapability: '产品经理+商业+技术+质量', reason: '需要多角色独立视角验证', confidence: '高', alternative: '单一 Prompt 分析（视角不全）' },
      { step: 8, action: '汇报材料生成', capabilityType: 'Prompt', specificCapability: '项目汇报材料生成规则', reason: '13 项结构，规则明确', confidence: '高', alternative: '—' },
      { step: 9, action: '质量检查', capabilityType: 'Hook', specificCapability: '质量门禁检查清单', reason: '自动检查漏项/空泛/夸大', confidence: '高', alternative: '人工审查' },
      { step: 10, action: '能力调用记录', capabilityType: 'Prompt', specificCapability: '能力调用证据规则', reason: '记录所有步骤的能力使用', confidence: '高', alternative: '—' },
    ],
    unusedCapabilities: [
      { type: 'MCP', reason: '当前 Demo 环境未接入真实 ERP/CRM' },
      { type: 'Plugin', reason: '不需要能力组合打包' },
      { type: 'GitHub 能力搜索', reason: '本地能力库已有匹配能力' },
      { type: 'Skill', reason: '供应链补货是一次性分析，不满足高频重复标准' },
    ],
    globalOptimalCheck: {
      stepsTooLong: false,
      canMerge: false,
      hasMoreRobustRoute: false,
      hasFasterRoute: true,
      fasterRouteNote: '如需更快，可跳过 Agent 评审（不推荐）',
    },
  },

  // ---- Step 13: 确认执行方案 ----
  '13-confirm-plan': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    goal: '生成供应链优化方案：库存风险分析 + 补货优先级 + 供应商评估 + 老板汇报材料',
    taskType: {
      diagnosis: '供应链决策优化任务。三大核心问题：库存周转慢（45天）、供应商交期不稳定（准时率70%）、采购订单延迟（20%）。',
    },
    deliveries: {
      deliveries: [
        { name: '库存风险分析报告' },
        { name: '补货优先级表' },
        { name: '供应商评分表' },
        { name: '多 Agent 评审结果' },
        { name: '老板汇报材料' },
        { name: '能力路由表' },
        { name: 'AI 能力调用记录' },
      ],
    },
    capabilityRoute: {
      routingTable: new Array(10).fill(0).map((_, i) => ({ step: i + 1 })),
    },
    risks: [
      { risk: '紧急补货需快速决策（缺货 SKU 库存仅够 3-6 天）', probability: 'high', mitigation: 'Demo 演示，不涉及真实库存风险' },
      { risk: '数据为模拟数据，真实场景需替换', probability: 'medium', mitigation: '所有输出已标注 Demo 示例数据' },
    ],
    claudeCannotDo: [
      '连接真实 ERP/WMS 系统（当前无 MCP 接入）',
      '获取实时库存和销售数据（Demo 使用静态 CSV）',
      '执行真实采购下单（需人工操作）',
    ],
  },

  // ---- Step 14-16: 生成交付物 ----
  '16-generate-deliverables': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    status: 'completed',
    files: [
      { name: 'inventory_risk_report.md', type: 'document', description: '库存风险分析报告 — 15 个 SKU 逐项分析' },
      { name: 'replenishment_priority.csv', type: 'data', description: '补货优先级表 — 紧急/高/中/低四级' },
      { name: 'supplier_scorecard.csv', type: 'data', description: '供应商评分表 — 8 家供应商四维度评分' },
      { name: 'multi_agent_review.md', type: 'document', description: '多 Agent 评审结果 — 4 个 Agent 独立输出' },
      { name: 'executive_brief.md', type: 'document', description: '老板汇报材料 — 1/3/10 分钟版本' },
      { name: 'capability_routing.md', type: 'document', description: '能力路由表 — 11 步能力选择' },
      { name: 'capability_evidence.md', type: 'document', description: 'AI 能力调用记录' },
    ],
    summary: '共生成 7 个交付物。所有数据均为 Demo 示例数据，非真实企业数据。完整输出见 examples/supply-chain-demo/output/。',
  },

  // ---- Step 17: 调用记录与汇报材料 ----
  '17-call-record-materials': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    callRecord: {
      totalSteps: 10,
      promptCalls: 6,
      toolCalls: 2,
      multiAgentCalls: 1,
      hookCalls: 1,
      realCalls: 1,
      demoSimulations: 9,
    },
    executiveBrief: {
      oneLiner: '供应链存在 4 个严重积压 SKU（占用 ¥285,000）+ 3 个严重缺货 SKU（月损失 ¥42,000），建议立即启动紧急补货 + 库存清理 + 供应商汰换。',
      oneMinute: '我们供应链当前有两个核心问题：3 个 SKU 严重缺货，每月损失约 ¥42,000；5 个 SKU 严重积压，占用 ¥285,000。建议三步走：紧急补货 3 个缺货 SKU（约 ¥35,000）、促销清理 4 个积压 SKU（预计回收 ¥150,000）、汰换 1 家供应商。目标：3 个月内周转天数从 45 降到 30。',
    },
  },

  // ---- Step 18: 使用后评估与知识沉淀 ----
  '18-assessment-deposit': {
    demoNote: '⚠️ Demo 示例数据，非真实企业数据。',
    assessment: {
      capabilityUsed: '供应链决策分析（Prompt + Multi-Agent + Tool + Hook 组合）',
      scores: {
        timeSaving: 2,
        directlyUsable: 2,
        reduceRework: 2,
        sceneMatch: 2,
        reusable: 2,
      },
      totalScore: 10,
      recommendation: '已验证 — 建议将此能力组合沉淀为「供应链决策分析」能力模板',
    },
    knowledgeDeposit: {
      canDeposit: true,
      suggestedKnowledge: [
        { title: '供应链补货决策流程', type: '流程知识', applicableScenarios: ['库存管理', '补货决策', '供应商评估'] },
        { title: '补货优先级计算公式', type: '公式/规则', applicableScenarios: ['库存优化'] },
        { title: '供应商四维度评分标准', type: '评估框架', applicableScenarios: ['供应商管理', '采购决策'] },
      ],
      conflictCheck: '无冲突',
      suggestedAction: '待用户确认后写入知识库',
    },
  },
};
