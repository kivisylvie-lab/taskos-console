/**
 * KIVI AI TaskOS Console — 通用意图路由器
 *
 * 从"关键词匹配 → 是/否"升级为"业务意图识别 + 主入口路由 + 辅助流程组合"。
 * 纯前端本地分析，不依赖大模型。
 */

import type { SceneType, FlowMatchResult, SceneMatchResult, RouteRole } from '../types/pipeline';
import { SCENE_LABELS } from '../types/pipeline';

// ============================================================
// 信号词库（7 大类）
// ============================================================

const SIGNALS = {
  /** 角色信号：谁在说话/谁是受众 */
  role: [
    '客户', '企业', '老板', '员工', 'HR', '采购', '销售', '供应商', '管理层',
    '甲方', '乙方', '投资人', '消费者', '用户', '团队', '部门', '公司',
    '领导', '上级', 'CEO', '总监', '经理', '业务方', '需求方',
  ],
  /** 场景信号：业务领域/行业 */
  scene: [
    '供应链', '库存', '采购', '客服', 'HR', '财务', '电商', '销售',
    '知识库', '量化', '运营', '物流', '仓储', '生产', '品控',
    '营销', '售后', '人事', '行政', '法务', '合规', '风控',
    '研发', '测试', '运维', '数据', 'BI', '报表',
  ],
  /** 任务信号：要做什么动作 */
  task: [
    '判断', '分析', '生成', '执行', '汇报', '审批', '通知', '沉淀', '复盘', '优化',
    '评估', '拆解', '设计', '规划', '开发', '部署', '测试', '监控', '预警',
    '决策', '推荐', '匹配', '搜索', '学习', '训练', '对比', '总结',
    '检查', '验证', '确认', '分配', '跟踪', '记录', '归档',
  ],
  /** 数据信号：涉及什么数据/资料 */
  data: [
    '表格', 'Excel', '资料', 'SOP', '合同', '数据库', 'API', '历史记录', '截图', '文档',
    'CSV', 'JSON', 'XML', 'PDF', 'Word', 'PPT', '报表', '日志',
    '指标', 'KPI', 'OKR', '数据', '文件', '附件', '上传',
  ],
  /** 交付物信号：最终要产出什么 */
  delivery: [
    '解决包', '系统', '页面', '报告', '方案', '流程', '看板', 'Demo', '应用',
    '原型', 'PRD', 'README', '文档', '汇报材料', '使用说明', '脚本',
    '视频', '图片', '海报', 'PPT', '架构图', '流程图', '原型图',
    '代码', 'API 文档', '测试报告', '部署方案', '配置文件',
  ],
  /** 风险信号：有什么问题/痛点 */
  risk: [
    '异常', '延迟', '缺货', '成本高', '效率低', '错误', '投诉', '风险', '不稳定',
    '积压', '断货', '超时', '超标', '下滑', '下降', '不足', '不够',
    '瓶颈', '卡点', '痛点', '困难', '复杂', '混乱', '重复', '手工',
    '漏', '错', '慢', '贵', '差', '烦', '难', '累',
  ],
  /** 长期化信号：是否需要持续/复用 */
  longrun: [
    '沉淀', '复用', '持续', '监控', '自动化', '指标', '培训',
    '知识库', '模板', 'SOP', '标准化', '流程化', '系统化',
    '可复制', '可扩展', '长期', '日常', '周期性', '定期',
    '预警', '看板', 'Dashboard', '复盘', '迭代',
  ],
};

// ============================================================
// 匹配工具函数
// ============================================================

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function matchSignals(input: string, signalList: string[]): string[] {
  const norm = normalize(input);
  return signalList.filter(s => norm.includes(normalize(s)));
}

interface SignalHits {
  role: string[];
  scene: string[];
  task: string[];
  data: string[];
  delivery: string[];
  risk: string[];
  longrun: string[];
}

function detectAllSignals(input: string): SignalHits {
  return {
    role: matchSignals(input, SIGNALS.role),
    scene: matchSignals(input, SIGNALS.scene),
    task: matchSignals(input, SIGNALS.task),
    data: matchSignals(input, SIGNALS.data),
    delivery: matchSignals(input, SIGNALS.delivery),
    risk: matchSignals(input, SIGNALS.risk),
    longrun: matchSignals(input, SIGNALS.longrun),
  };
}

function allKeywords(s: SignalHits): string[] {
  return [...s.role, ...s.scene, ...s.task, ...s.data, ...s.delivery, ...s.risk, ...s.longrun];
}

function hasAny(s: SignalHits, categories: (keyof SignalHits)[]): boolean {
  return categories.some(c => s[c].length > 0);
}

function countCategories(s: SignalHits, categories: (keyof SignalHits)[]): number {
  return categories.filter(c => s[c].length > 0).length;
}

// ============================================================
// 路由规则引擎（A–M）
// ============================================================

interface FlowRouteDecision {
  routeRole: RouteRole;
  matchedIntent: string;
  reason: string;
}

function decideRoute(
  flowName: SceneType,
  input: string,
  s: SignalHits,
): FlowRouteDecision {
  const hasBizContext = hasAny(s, ['role']) && hasAny(s, ['scene']);
  const hasRiskData = hasAny(s, ['risk', 'data']);
  const hasDelivery = hasAny(s, ['delivery']);
  const isBizProblem = hasAny(s, ['risk']) && (hasAny(s, ['role', 'scene']) || hasAny(s, ['data']));
  const allHits = allKeywords(s);

  // ── A. 客户解决包模式 ──
  if (flowName === 'business-solution') {
    const bizSignals = countCategories(s, ['role', 'scene', 'risk', 'data', 'delivery']);
    if (hasBizContext && bizSignals >= 2) {
      return {
        routeRole: 'primary-entry',
        matchedIntent: '企业客户业务问题 → 需完整解决包交付',
        reason: `同时命中角色/场景信号(${[...s.role, ...s.scene].slice(0, 3).join('、')})和业务信号(${[...s.risk, ...s.data, ...s.delivery].slice(0, 3).join('、')})，推荐为客户解决包模式主入口。`,
      };
    }
    if (hasBizContext) {
      return {
        routeRole: 'support-flow',
        matchedIntent: '企业相关输入 → 可能适合解决包模式',
        reason: `命中企业/客户相关信号(${[...s.role, ...s.scene].slice(0, 3).join('、')})，但业务信号不足，作为辅助流程推荐。`,
      };
    }
    return {
      routeRole: 'weak-related',
      matchedIntent: '无明显企业客户信号',
      reason: '未检测到企业客户或业务场景信号，与解决包模式弱相关。',
    };
  }

  // ── B. 任务分诊 ──
  if (flowName === 'task-triage') {
    const triageHits = hasAny(s, ['task']) && (
      s.task.some(t => ['判断', '诊断', '排查', '分析'].some(k => t.includes(k))) ||
      hasAny(s, ['risk'])
    );
    const isPersonal = !hasAny(s, ['role']) || s.role.every(r => ['我', '自己'].some(p => r.includes(p)));
    if (triageHits && isPersonal) {
      return {
        routeRole: 'primary-entry',
        matchedIntent: '个人任务诊断 → 需要分诊路线图',
        reason: `命中任务诊断信号(${s.task.filter(t => ['判断', '诊断', '分析'].some(k => t.includes(k))).join('、') || s.risk.join('、')})，且为个人任务，推荐为任务分诊主入口。`,
      };
    }
    if (triageHits && !isPersonal) {
      return {
        routeRole: 'support-flow',
        matchedIntent: '企业场景下的诊断需求 → 辅助分诊',
        reason: `命中诊断信号但存在企业/客户上下文(${s.role.join('、')})，作为企业项目的辅助分诊流程。`,
      };
    }
    if (hasAny(s, ['task']) || hasAny(s, ['risk'])) {
      return {
        routeRole: 'support-flow',
        matchedIntent: '有任务或风险信号 → 可能需分诊',
        reason: `存在任务/风险相关输入，可作为辅助分诊流程判断是否需要生成路线图。`,
      };
    }
    return {
      routeRole: 'weak-related',
      matchedIntent: '无明确诊断需求',
      reason: '未检测到明确的诊断、卡点或困难信号。',
    };
  }

  // ── C. 任务执行闭环 ──
  if (flowName === 'task-execution-loop') {
    const execHits = s.task.some(t =>
      ['执行', '交付', '完成', '落地', '生成', '开发', '部署', '做'].some(k => t.includes(k))
    );
    const hasProjectSignal = hasAny(s, ['delivery']) || hasAny(s, ['longrun']);
    if (execHits && (hasProjectSignal || hasBizContext)) {
      return {
        routeRole: 'primary-entry',
        matchedIntent: '完整交付任务 → 需22步执行闭环',
        reason: `命中执行/交付信号(${s.task.filter(t => ['执行', '交付', '完成', '落地', '生成', '做'].some(k => t.includes(k))).join('、')})，且涉及交付物/长期化需求，推荐为任务执行闭环主入口。`,
      };
    }
    if (execHits || hasProjectSignal) {
      return {
        routeRole: 'support-flow',
        matchedIntent: '有执行或交付需求 → 辅助闭环流程',
        reason: `命中执行/交付相关信号，可作为辅助任务执行闭环流程。`,
      };
    }
    if (allHits.length >= 5) {
      return {
        routeRole: 'support-flow',
        matchedIntent: '复杂多信号输入 → 可能需闭环流程',
        reason: '输入包含多种信号类型，任务可能较复杂，作为辅助流程推荐。',
      };
    }
    return {
      routeRole: 'weak-related',
      matchedIntent: '简单输入 → 不需要闭环流程',
      reason: '输入较简单，无需完整22步执行闭环。',
    };
  }

  // ── D. 项目接入模式 ──
  if (flowName === 'project-onboarding') {
    const projSignal = (
      s.role.some(r => ['项目'].some(k => r.includes(k))) ||
      s.delivery.some(d => ['项目'].some(k => d.includes(k))) ||
      s.scene.some(sc => ['项目'].some(k => sc.includes(k)))
    );
    const newProj = normalize(input).includes('新建项目') || normalize(input).includes('新项目') || normalize(input).includes('开始一个项目');
    if (newProj) {
      return {
        routeRole: 'primary-entry',
        matchedIntent: '明确要新建项目 → 项目接入模式',
        reason: '用户明确表示要新建/开始一个项目，推荐为项目接入模式主入口。',
      };
    }
    if (projSignal || (hasBizContext && hasDelivery)) {
      return {
        routeRole: 'support-flow',
        matchedIntent: '涉及项目/交付 → 辅助项目接入判断',
        reason: `命中项目/交付相关信号(${[...s.delivery].slice(0, 3).join('、')})，可能需要项目接入模式。`,
      };
    }
    return {
      routeRole: 'weak-related',
      matchedIntent: '无项目创建信号',
      reason: '未检测到明确的创建项目或项目接入需求。',
    };
  }

  // ── E. 知识库摄取 ──
  if (flowName === 'knowledge-ingestion') {
    const knowHits = s.data.some(d =>
      ['SOP', '合同', '制度', '手册', 'FAQ', '文档', '资料', '知识库'].some(k => d.includes(k))
    );
    const learnHits = s.task.some(t => ['学习', '提取', '摄取', '读取'].some(k => t.includes(k)));
    if (knowHits || learnHits) {
      return {
        routeRole: 'support-flow',
        matchedIntent: '有资料/学习需求 → 知识库摄取',
        reason: `命中知识/资料信号(${s.data.filter(d => ['SOP', '合同', '资料', '文档', '知识库'].some(k => d.includes(k))).join('、')})，推荐知识库摄取辅助流程。`,
      };
    }
    if (hasAny(s, ['data']) && !hasAny(s, ['delivery'])) {
      return {
        routeRole: 'weak-related',
        matchedIntent: '有数据但无明确交付物 → 可能需知识摄取',
        reason: '有数据/资料输入，但无明确交付物需求，知识摄取弱相关。',
      };
    }
    return {
      routeRole: 'not-recommended',
      matchedIntent: '无资料学习需求',
      reason: '未检测到上传资料、学习文档或知识提取的信号。',
    };
  }

  // ── F. 能力路由判断 ──
  if (flowName === 'capability-routing') {
    const capHits = s.task.some(t =>
      ['能力', 'Skill', 'Agent', 'MCP', 'Hook', 'Plugin', 'Tool', 'API', '自动化', '脚本'].some(k => t.includes(k) || normalize(input).includes(normalize(k)))
    );
    const implicitCap = hasAny(s, ['delivery']) && hasAny(s, ['data']) && hasAny(s, ['task']);
    if (capHits) {
      return {
        routeRole: 'support-flow',
        matchedIntent: '明确需要选择AI能力/工具',
        reason: '用户输入涉及AI能力类型或工具选择，推荐能力路由判断辅助流程。',
      };
    }
    if (implicitCap) {
      return {
        routeRole: 'support-flow',
        matchedIntent: '复杂任务隐含能力选择需求',
        reason: `命中交付物+数据+任务多类信号(${allHits.slice(0, 4).join('、')})，隐含能力路由需求。`,
      };
    }
    return {
      routeRole: 'weak-related',
      matchedIntent: '无明显能力选择需求',
      reason: '当前输入未明确涉及AI能力类型选择。',
    };
  }

  // ── G. 多 Agent 判断 ──
  if (flowName === 'multi-agent') {
    const agentHits = normalize(input).includes('agent') || normalize(input).includes('Agent') ||
      s.task.some(t => ['多角色', '多视角', '协同'].some(k => t.includes(k)));
    const multiDimension = countCategories(s, ['role', 'scene', 'data', 'risk', 'delivery']) >= 3;
    if (agentHits || multiDimension) {
      return {
        routeRole: 'support-flow',
        matchedIntent: '多角色/多维度 → 可能需要多Agent',
        reason: multiDimension
          ? `输入涉及多个维度(角色/场景/数据/风险/交付物)，推荐多Agent协同判断。`
          : `命中Agent相关信号，推荐多Agent判断辅助流程。`,
      };
    }
    return {
      routeRole: 'weak-related',
      matchedIntent: '单维度任务 → 不需要多Agent',
      reason: '任务维度较单一，不需要多Agent协同。',
    };
  }

  // ── H. 项目汇报材料生成 ──
  if (flowName === 'executive-brief') {
    const reportHits = s.role.some(r =>
      ['老板', '领导', '管理层', '投资人', '客户'].some(k => r.includes(k))
    ) && s.task.some(t => ['汇报', '报告', '展示', '总结'].some(k => t.includes(k)));
    if (reportHits) {
      return {
        routeRole: hasBizContext ? 'support-flow' : 'later-flow',
        matchedIntent: '需要向决策者汇报 → 生成汇报材料',
        reason: `命中汇报对象(${s.role.filter(r => ['老板', '领导', '管理层', '投资人', '客户'].some(k => r.includes(k))).join('、')})和汇报动作信号，推荐生成项目汇报材料。`,
      };
    }
    if (s.role.includes('老板') || s.role.includes('领导')) {
      return {
        routeRole: 'support-flow',
        matchedIntent: '涉及管理层 → 可能需要汇报材料',
        reason: '输入提及管理层/老板，项目可能需要汇报材料。',
      };
    }
    if (hasBizContext && hasDelivery) {
      return {
        routeRole: 'later-flow',
        matchedIntent: '企业交付项目 → 交付后可能需要汇报',
        reason: '企业客户交付项目，完成交付后可能需要生成汇报材料。',
      };
    }
    return {
      routeRole: 'weak-related',
      matchedIntent: '无汇报需求信号',
      reason: '未检测到汇报对象或汇报动作信号。',
    };
  }

  // ── I. 产品从0到1规划 ──
  if (flowName === 'product-planning') {
    const productHits = s.delivery.some(d =>
      ['产品', 'PRD', 'MVP', '原型'].some(k => d.includes(k))
    ) || s.task.some(t => ['产品化', '商业化', '上线'].some(k => t.includes(k)));
    if (productHits) {
      return {
        routeRole: hasBizContext ? 'later-flow' : 'support-flow',
        matchedIntent: '产品规划需求 → 从0到1规划',
        reason: `命中产品规划信号(${s.delivery.filter(d => ['产品', 'PRD', 'MVP', '原型'].some(k => d.includes(k))).join('、')})，推荐产品从0到1规划。`,
      };
    }
    if (hasAny(s, ['delivery']) && hasAny(s, ['longrun'])) {
      return {
        routeRole: 'later-flow',
        matchedIntent: '长期化交付 → 可能需要产品化',
        reason: '涉及交付物且长期化需求，可能需要产品化规划。',
      };
    }
    return {
      routeRole: 'weak-related',
      matchedIntent: '无产品规划信号',
      reason: '未检测到产品规划或从0到1相关信号。',
    };
  }

  // ── J. 使用后评估 ──
  if (flowName === 'post-use-assessment') {
    const evalHits = s.task.some(t =>
      ['复盘', '评估', '验证', '效果', '打分'].some(k => t.includes(k))
    ) && hasAny(s, ['longrun']);
    if (evalHits) {
      return {
        routeRole: 'later-flow',
        matchedIntent: '使用后复盘评估 → 使用后评估流程',
        reason: `命中复盘/评估+长期化信号(${s.task.filter(t => ['复盘', '评估', '验证'].some(k => t.includes(k))).join('、')})，推荐使用后评估流程。`,
      };
    }
    if (s.task.some(t => ['复盘', '评估', '验证'].some(k => t.includes(k)))) {
      return {
        routeRole: 'later-flow',
        matchedIntent: '有评估需求 → 后置使用后评估',
        reason: '输入包含复盘/评估信号，可后置使用后评估流程。',
      };
    }
    return {
      routeRole: 'weak-related',
      matchedIntent: '无评估需求',
      reason: '未检测到使用后复盘或效果评估信号。',
    };
  }

  // ── K. 新能力评估 ──
  if (flowName === 'capability-assessment') {
    const capAssessHits = s.task.some(t =>
      ['Skill', 'Plugin', 'MCP', '能力', '插件', '工具'].some(k => t.includes(k) || normalize(input).includes(normalize(k)))
    ) && s.task.some(t => ['评估', '能不能用', '好不好用', '试试', '收录'].some(k => t.includes(k)));
    if (capAssessHits) {
      return {
        routeRole: 'primary-entry',
        matchedIntent: '明确评估新AI能力/工具',
        reason: '用户明确表示要评估某个AI能力或工具，推荐为新能力评估主入口。',
      };
    }
    if (normalize(input).includes('skill') || normalize(input).includes('mcp') || normalize(input).includes('plugin')) {
      return {
        routeRole: 'support-flow',
        matchedIntent: '提及能力名称 → 可能需要评估',
        reason: '输入提及特定AI能力类型名称，可作为新能力评估辅助流程。',
      };
    }
    return {
      routeRole: 'not-recommended',
      matchedIntent: '无能力评估信号',
      reason: '未检测到评估AI能力/工具的信号（需要明确提及Skill/Plugin/MCP等能力名称+评估意图）。',
    };
  }

  // ── L. 系统维护 ──
  if (flowName === 'system-maintenance') {
    const sysHits = (
      normalize(input).includes('系统报错') || normalize(input).includes('系统错误') ||
      normalize(input).includes('样式乱') || normalize(input).includes('运行不了') ||
      normalize(input).includes('接口失败') || normalize(input).includes('bug') ||
      normalize(input).includes('配置') || normalize(input).includes('部署') ||
      normalize(input).includes('维护') || normalize(input).includes('整理系统') ||
      normalize(input).includes('检查能力库') || normalize(input).includes('检查重复')
    );
    if (sysHits) {
      return {
        routeRole: 'primary-entry',
        matchedIntent: '系统维护/配置/报错 → 系统维护入口',
        reason: '用户明确提出系统维护、配置、报错或能力库整理需求，推荐为系统维护主入口。',
      };
    }
    // 防止误判："系统帮我"不是系统维护
    if (normalize(input).includes('系统帮我') || normalize(input).includes('系统给') || normalize(input).includes('系统生成')) {
      return {
        routeRole: 'not-recommended',
        matchedIntent: '"系统"用作工具指代 → 非维护需求',
        reason: '"系统"在此上下文中是工具指代（如"系统帮我做XX"），不是系统维护需求。',
      };
    }
    return {
      routeRole: 'not-recommended',
      matchedIntent: '无系统维护信号',
      reason: '未检测到系统报错、维护、配置或能力库整理等明确信号。',
    };
  }

  // ── M. 普通一次性任务 ──
  if (flowName === 'simple-task') {
    const isSimple = allHits.length <= 2 && !hasAny(s, ['delivery']) && !hasAny(s, ['longrun']);
    const isQuickQ = normalize(input).length < 30 && !hasBizContext;
    if (isSimple || isQuickQ) {
      return {
        routeRole: 'primary-entry',
        matchedIntent: '简单问答/一次性任务 → 直接对话',
        reason: '输入简短、无复杂交付物需求、无企业上下文，推荐为普通一次性任务。',
      };
    }
    // 如果有客户/业务/数据/系统/流程/交付/复盘信号，不推荐为普通一次性任务
    if (hasBizContext || hasAny(s, ['data', 'delivery', 'longrun']) || hasAny(s, ['risk'])) {
      return {
        routeRole: 'not-recommended',
        matchedIntent: '复杂任务 → 不建议用普通一次性模式',
        reason: `输入包含${hasBizContext ? '企业/客户上下文' : ''}${hasAny(s, ['delivery']) ? '交付物需求' : ''}${hasAny(s, ['risk']) ? '风险/痛点信号' : ''}，不适合用普通一次性任务处理。`,
      };
    }
    return {
      routeRole: 'weak-related',
      matchedIntent: '中等复杂度 → 可能适合直接对话',
      reason: '输入有一定复杂度但不涉及企业上下文或复杂交付物，可酌情使用一次性对话。',
    };
  }

  // 默认（不应到达）
  return {
    routeRole: 'weak-related',
    matchedIntent: '未分类',
    reason: '未能明确判断路由角色，标记为弱相关。',
  };
}

// ============================================================
// 流程定义（用于 needsProject 等元数据）
// ============================================================

interface FlowMeta {
  needsProject: boolean;
  needsKnowledgeBase: boolean;
  needsUpload: boolean;
  needsCapabilityRouting: boolean;
  needsUserConfirm: boolean;
  recommendedEntry: string;
}

const FLOW_META: Record<SceneType, FlowMeta> = {
  'business-solution': {
    needsProject: true, needsKnowledgeBase: true, needsUpload: true,
    needsCapabilityRouting: true, needsUserConfirm: true,
    recommendedEntry: '客户解决包模式 → 痛点拆解 → 能力组合 → 解决包生成',
  },
  'task-triage': {
    needsProject: false, needsKnowledgeBase: false, needsUpload: false,
    needsCapabilityRouting: true, needsUserConfirm: true,
    recommendedEntry: '任务分诊 → 问题诊断 → 生成解决路线图',
  },
  'task-execution-loop': {
    needsProject: true, needsKnowledgeBase: true, needsUpload: true,
    needsCapabilityRouting: true, needsUserConfirm: true,
    recommendedEntry: '任务执行闭环 → 目标优化 → 22步完整交付',
  },
  'project-onboarding': {
    needsProject: true, needsKnowledgeBase: false, needsUpload: false,
    needsCapabilityRouting: true, needsUserConfirm: true,
    recommendedEntry: '项目接入模式 → 项目类型判断 → 接入方案',
  },
  'knowledge-ingestion': {
    needsProject: false, needsKnowledgeBase: true, needsUpload: true,
    needsCapabilityRouting: false, needsUserConfirm: true,
    recommendedEntry: '知识库摄取 → 文件识别 → 知识卡片 → 待确认入库',
  },
  'capability-routing': {
    needsProject: false, needsKnowledgeBase: false, needsUpload: false,
    needsCapabilityRouting: true, needsUserConfirm: true,
    recommendedEntry: '能力路由判断 → 任务特征匹配 → 能力类型推荐',
  },
  'multi-agent': {
    needsProject: true, needsKnowledgeBase: false, needsUpload: false,
    needsCapabilityRouting: true, needsUserConfirm: true,
    recommendedEntry: '多Agent判断 → 候选Agent → 协同方案',
  },
  'executive-brief': {
    needsProject: true, needsKnowledgeBase: true, needsUpload: false,
    needsCapabilityRouting: false, needsUserConfirm: true,
    recommendedEntry: '项目汇报材料 → 13项结构 → 多版本汇报',
  },
  'product-planning': {
    needsProject: true, needsKnowledgeBase: true, needsUpload: false,
    needsCapabilityRouting: true, needsUserConfirm: true,
    recommendedEntry: '产品从0到1规划 → 产品定位 → MVP → PRD → 原型图',
  },
  'post-use-assessment': {
    needsProject: false, needsKnowledgeBase: false, needsUpload: false,
    needsCapabilityRouting: false, needsUserConfirm: true,
    recommendedEntry: '使用后评估 → 5项评分 → 更新能力库状态',
  },
  'system-maintenance': {
    needsProject: false, needsKnowledgeBase: false, needsUpload: false,
    needsCapabilityRouting: false, needsUserConfirm: true,
    recommendedEntry: '系统维护 → 10项检查 → 整理方案',
  },
  'simple-task': {
    needsProject: false, needsKnowledgeBase: false, needsUpload: false,
    needsCapabilityRouting: false, needsUserConfirm: false,
    recommendedEntry: '直接对话 → 简单的Prompt对话 → 快速完成',
  },
  'capability-assessment': {
    needsProject: false, needsKnowledgeBase: false, needsUpload: false,
    needsCapabilityRouting: false, needsUserConfirm: true,
    recommendedEntry: '新能力评估 → 能力类型识别 → 综合建议',
  },
};

// ============================================================
// 置信度计算
// ============================================================

function calcConfidence(s: SignalHits, routeRole: RouteRole): 'high' | 'medium' | 'low' {
  const total = allKeywords(s).length;
  if (routeRole === 'primary-entry' && total >= 4) return 'high';
  if (routeRole === 'primary-entry' && total >= 2) return 'medium';
  if (routeRole === 'support-flow' && total >= 3) return 'high';
  if (routeRole === 'support-flow' && total >= 2) return 'medium';
  if (routeRole === 'later-flow' && total >= 2) return 'medium';
  if (routeRole === 'weak-related' && total >= 1) return 'low';
  if (routeRole === 'not-recommended') return 'low';
  return 'low';
}

// ============================================================
// 公共 API
// ============================================================

/**
 * 分析用户输入，生成入口与流程路由判断。
 * 这是新的主入口函数，替代旧的 matchScenarios()。
 */
export function analyzeUserIntent(input: string): SceneMatchResult {
  const s = detectAllSignals(input);
  const allFlowTypes: SceneType[] = [
    'business-solution',
    'task-triage',
    'task-execution-loop',
    'project-onboarding',
    'knowledge-ingestion',
    'capability-routing',
    'multi-agent',
    'executive-brief',
    'product-planning',
    'post-use-assessment',
    'capability-assessment',
    'system-maintenance',
    'simple-task',
  ];

  const flowResults: FlowMatchResult[] = allFlowTypes.map(flowName => {
    const decision = decideRoute(flowName, input, s);
    const meta = FLOW_META[flowName];
    const conf = calcConfidence(s, decision.routeRole);

    return {
      flowName,
      flowLabel: SCENE_LABELS[flowName],
      routeRole: decision.routeRole,
      confidence: conf,
      matchedKeywords: allKeywords(s),
      matchedIntent: decision.matchedIntent,
      reason: decision.reason,
      recommendedEntry: meta.recommendedEntry,
    };
  });

  // 按路由角色分组
  const primaryEntry = flowResults.find(f => f.routeRole === 'primary-entry') || null;
  const supportFlows = flowResults.filter(f => f.routeRole === 'support-flow');
  const laterFlows = flowResults.filter(f => f.routeRole === 'later-flow');
  const weakRelatedFlows = flowResults.filter(f => f.routeRole === 'weak-related');
  const notRecommendedFlows = flowResults.filter(f => f.routeRole === 'not-recommended');

  // 按优先级排序（用于表格展示）：主入口 → 辅助 → 后置 → 弱相关 → 不推荐
  const roleOrder: Record<RouteRole, number> = {
    'primary-entry': 0,
    'support-flow': 1,
    'later-flow': 2,
    'weak-related': 3,
    'not-recommended': 4,
  };
  flowResults.sort((a, b) => {
    const orderDiff = roleOrder[a.routeRole] - roleOrder[b.routeRole];
    if (orderDiff !== 0) return orderDiff;
    // 同角色内按置信度排序：高 → 中 → 低
    const confOrder = { high: 0, medium: 1, low: 2 };
    return confOrder[a.confidence] - confOrder[b.confidence];
  });

  // 生成证据清单
  const evidence: string[] = [];
  if (s.role.length > 0) evidence.push(`🎭 角色信号: ${s.role.join('、')}`);
  if (s.scene.length > 0) evidence.push(`🏭 场景信号: ${s.scene.join('、')}`);
  if (s.task.length > 0) evidence.push(`📋 任务信号: ${s.task.join('、')}`);
  if (s.data.length > 0) evidence.push(`📊 数据信号: ${s.data.join('、')}`);
  if (s.delivery.length > 0) evidence.push(`📦 交付物信号: ${s.delivery.join('、')}`);
  if (s.risk.length > 0) evidence.push(`⚠️ 风险信号: ${s.risk.join('、')}`);
  if (s.longrun.length > 0) evidence.push(`🔄 长期化信号: ${s.longrun.join('、')}`);
  if (evidence.length === 0) evidence.push('未命中明确信号，请提供更多信息。');

  return {
    flowResults,
    primaryEntry,
    supportFlows,
    laterFlows,
    weakRelatedFlows,
    notRecommendedFlows,
    evidence,
  };
}

/**
 * 根据 SceneType 查找流程元数据
 */
export function getFlowMeta(flowName: SceneType): FlowMeta {
  return FLOW_META[flowName];
}

// ============================================================
// 旧版实时匹配（Step01 输入建议用，保持兼容）
// ============================================================

export interface ScenarioDefinition {
  id: string;
  sceneType: SceneType;
  label: string;
  description: string;
  recommendedEntry: string;
  keywords: string[];
  synonyms: string[];
  triggerPhrases: string[];
  deliveryTypes: string[];
  audiences: string[];
  capabilityWords: string[];
  needsProject: boolean;
  needsKnowledgeBase: boolean;
  needsUpload: boolean;
  needsCapabilityRouting: boolean;
  needsUserConfirm: boolean;
  nextStep: string;
}

export interface ScenarioMatchSuggestion {
  scenario: ScenarioDefinition;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  matchedDetails: string[];
}

const SCENARIO_LIBRARY: ScenarioDefinition[] = [
  {
    id: 'business-solution', sceneType: 'business-solution',
    label: '客户解决包模式',
    description: '面向企业客户的完整业务解决方案包：痛点拆解、能力组合、解决包交付、客户培训、指标验证',
    recommendedEntry: '客户解决包模式 → 痛点拆解 → 能力组合 → 解决包生成',
    keywords: ['客户', '企业', '业务', '解决方案', '解决包', '交付包', '客户需求', '业务需求', '商业方案', '供应链', '库存', '采购', '供应商', '客户项目'],
    synonyms: ['客户项目', '外部项目', '商业项目', '业务项目', '服务客户', '打包交付', '整体方案', '企业定制', '定制方案'],
    triggerPhrases: ['客户要一个方案', '给客户做方案', '帮客户解决', '客户项目', '给客户交付', '客户汇报', '客户想提高效率', '帮企业解决', '业务上有个痛点'],
    deliveryTypes: ['解决包', '业务方案', '客户汇报材料', '使用说明', '交付物清单', '指标报告'],
    audiences: ['client', 'boss', 'team'],
    capabilityWords: ['Prompt', 'Skill', 'Agent', 'MCP', 'Tool', 'Hook', '知识库', 'RAG', '多Agent', '自动化', '解决包'],
    needsProject: true, needsKnowledgeBase: true, needsUpload: true,
    needsCapabilityRouting: true, needsUserConfirm: true,
    nextStep: '进入客户解决包模式 → 10 步核心流程 → 解决包交付',
  },
  {
    id: 'task-triage', sceneType: 'task-triage',
    label: '任务分诊',
    description: '诊断你的问题类型和卡点，生成完整解决路线图',
    recommendedEntry: '任务分诊 → 问题诊断 → 解决路线图',
    keywords: ['任务分诊', '卡住了', '不知道怎么做', '遇到困难', '诊断', '问题诊断', '困难', '搞不定', '瓶颈', '卡点'],
    synonyms: ['阻塞', '困难模式', '难点', '分析问题', '排查', '死胡同', '走不通', '找不到方向', '停滞', '困住', '怎么办', '求助', '求救'],
    triggerPhrases: ['我卡住了', '遇到困难', '不知道怎么做', '做不下去了', '帮我看看问题在哪', '这个怎么办', '不知道从哪下手'],
    deliveryTypes: ['问题诊断报告', '解决路线图', '能力路由表'],
    audiences: [],
    capabilityWords: ['Prompt', '分诊'],
    needsProject: false, needsKnowledgeBase: false, needsUpload: false,
    needsCapabilityRouting: true, needsUserConfirm: true,
    nextStep: '进入任务分诊 → 输出 8 项诊断结果 → 生成解决路线图',
  },
  {
    id: 'task-execution-loop', sceneType: 'task-execution-loop',
    label: '任务执行闭环',
    description: '从目标到交付，22 步完整工作流，不跳过任何环节',
    recommendedEntry: '任务执行闭环 → 目标优化 → 完整交付',
    keywords: ['任务执行闭环', '完整做一件事', '完整工作流', '从目标到交付', '做一个项目', '完整项目', '从0开始', '从0到1', '交付', '交付物', '全流程', '端到端', '可复用', '任务记录', '归档'],
    synonyms: ['做完', '全做完', '从头到尾', '全部完成', '整个流程', '一步到位', '出结果', '完整方案', '项目交付', '产出', '做到底'],
    triggerPhrases: ['我想从0到1', '从零开始做', '完整做完这件事', '帮我把这个任务完整做完', '按完整工作流做', '从目标到交付', '做成可复用任务记录'],
    deliveryTypes: ['项目交付物', 'README', '使用说明', '汇报材料', 'AI能力调用记录'],
    audiences: [],
    capabilityWords: ['Skill', 'SubAgent', 'Hook', 'MCP', 'Tool', 'Prompt'],
    needsProject: true, needsKnowledgeBase: true, needsUpload: true,
    needsCapabilityRouting: true, needsUserConfirm: true,
    nextStep: '进入任务执行闭环 → 22 步流程 → 项目文件夹',
  },
  {
    id: 'project-onboarding', sceneType: 'project-onboarding',
    label: '项目接入模式',
    description: '判断项目类型，给出 KIVIDAILYLIFE 接入方案',
    recommendedEntry: '项目接入判断 → 项目类型 → 接入方案',
    keywords: ['项目接入', '新项目', '接入模式', '项目怎么用', '怎么接入', '开始一个新项目', '项目初始化'],
    synonyms: ['接入KIVI', '挂接', '项目开始', '项目启动', '初始设置', '项目配置', '项目设置'],
    triggerPhrases: ['我要开始一个新项目', '新项目怎么接入', '这个项目怎么用 KIVIDAILYLIFE', '帮我初始化项目'],
    deliveryTypes: ['项目 CLAUDE.md', 'README.md', '使用说明.md'],
    audiences: [],
    capabilityWords: ['CLAUDE.md', 'README'],
    needsProject: true, needsKnowledgeBase: false, needsUpload: false,
    needsCapabilityRouting: true, needsUserConfirm: true,
    nextStep: '判断项目类型 → 生成接入方案 → 初始化项目文件',
  },
  {
    id: 'knowledge-ingestion', sceneType: 'knowledge-ingestion',
    label: '知识库摄取',
    description: '上传资料/链接/视频，系统自动提取知识、生成卡片',
    recommendedEntry: '知识库摄取 → 文件识别 → 知识卡片 → 待确认入库',
    keywords: ['知识库', '摄取', '上传资料', '资料学习', '文件学习', '学资料', '学习', '资料', '知识卡片', '入库'],
    synonyms: ['消化资料', '吸收知识', '读取文件', '文档学习', '内容提取', '资料分析', '材料学习', '信息提取'],
    triggerPhrases: ['上传资料', '我想让系统学习', '帮我学习这些文件', '资料学习', '文件学习', '学习这个文档'],
    deliveryTypes: ['知识卡片', '摘要', '提取结果', '知识库索引'],
    audiences: [],
    capabilityWords: ['知识库', '卡片'],
    needsProject: false, needsKnowledgeBase: true, needsUpload: true,
    needsCapabilityRouting: false, needsUserConfirm: true,
    nextStep: '扫描输入区 → 识别文件类型 → 提取知识 → 生成卡片',
  },
  {
    id: 'capability-routing', sceneType: 'capability-routing',
    label: '能力路由判断',
    description: '判断当前任务最适合 Prompt / Skill / Agent / Hook / MCP / Tool 中的哪一种',
    recommendedEntry: '能力路由判断 → 任务特征匹配 → 能力类型推荐',
    keywords: ['能力路由', '选什么能力', '哪种能力', '什么类型', '能力类型', '应该用什么', '用什么能力'],
    synonyms: ['选择能力', '能力选择', '选哪个', '哪个合适', '类型判断', '分类'],
    triggerPhrases: ['我应该用什么能力', 'Skill还是Prompt', '用Agent还是Skill', '能力路由', '帮我判断用什么'],
    deliveryTypes: ['能力路由表', '类型推荐'],
    audiences: [],
    capabilityWords: ['Prompt', 'Skill', 'Agent', 'Hook', 'MCP', 'Tool', 'Plugin'],
    needsProject: false, needsKnowledgeBase: false, needsUpload: false,
    needsCapabilityRouting: true, needsUserConfirm: true,
    nextStep: '分析任务特征 → 匹配能力类型 → 输出路由表',
  },
  {
    id: 'multi-agent', sceneType: 'multi-agent',
    label: '多 Agent 判断',
    description: '判断是否需要多角色协同，选择产品/技术/商业/法务等 Agent',
    recommendedEntry: '多 Agent 判断 → 候选 Agent → 协同方案',
    keywords: ['多Agent', 'Agent', '多角色', '多视角', '协同', '并行', '多个角色', '多方判断', '子Agent', 'SubAgent'],
    synonyms: ['多方评估', '多维度', '角色分工', '专家团', '多方视角', '交叉验证', '多角度'],
    triggerPhrases: ['多Agent判断', '需要多个Agent', '找Agent帮忙', '用Agent', '调用Agent', '多角色判断'],
    deliveryTypes: ['Agent 组合方案', 'Agent 文件', '协同输出'],
    audiences: [],
    capabilityWords: ['Agent', 'SubAgent', '多Agent'],
    needsProject: true, needsKnowledgeBase: false, needsUpload: false,
    needsCapabilityRouting: true, needsUserConfirm: true,
    nextStep: '判断是否需要 → 候选Agent列表 → 确认组合 → 分别输出',
  },
  {
    id: 'executive-brief', sceneType: 'executive-brief',
    label: '项目汇报材料生成',
    description: '生成 1分钟/3分钟/10分钟汇报稿 + 老板一页纸总结 + PPT版',
    recommendedEntry: '项目汇报材料 → 13项结构 → 多版本汇报',
    keywords: ['汇报', '老板汇报', '汇报材料', '汇报稿', '总结', '一页纸', 'PPT汇报', '给老板看', '给投资人看', '给客户看', '展示'],
    synonyms: ['报告', '周报', '月报', '述职', '分享', '讲给', 'presentation', '简报', '摘要', '上去讲', '开会'],
    triggerPhrases: ['老板汇报', '给老板看', '生成汇报材料', '帮我做汇报', '一页纸总结', 'PPT版', '1分钟汇报', '3分钟汇报'],
    deliveryTypes: ['项目汇报材料.md', 'PPT汇报版', '老板一页纸', '1/3/10分钟稿'],
    audiences: ['boss', 'client', 'investor', 'hr', 'team'],
    capabilityWords: ['汇报', 'PPT'],
    needsProject: true, needsKnowledgeBase: true, needsUpload: false,
    needsCapabilityRouting: false, needsUserConfirm: true,
    nextStep: '判断汇报对象 → 生成 13 项汇报材料 → 多版本输出',
  },
  {
    id: 'product-planning', sceneType: 'product-planning',
    label: '产品从0到1规划',
    description: '产品定位 → 用户需求 → MVP → PRD → 原型图 → 商业分析',
    recommendedEntry: '产品规划 → 产品定位 → MVP → PRD → 原型图',
    keywords: ['产品', '从0到1', '产品规划', '产品设计', 'MVP', '产品想法', '产品方案', '产品经理', '创业', '新产品'],
    synonyms: ['商业模式', '市场分析', '用户需求', '产品定位', '功能设计', '竞品分析', '产品策略'],
    triggerPhrases: ['我想做一个产品', '我有一个产品想法', '从0到1做产品', '产品规划', '帮我设计产品'],
    deliveryTypes: ['PRD', '产品原型图', '流程图', '商业分析', 'MVP方案'],
    audiences: ['boss', 'investor', 'client'],
    capabilityWords: ['PRD', '原型图', '流程图', 'MVP'],
    needsProject: true, needsKnowledgeBase: true, needsUpload: false,
    needsCapabilityRouting: true, needsUserConfirm: true,
    nextStep: '产品定位 → 用户分析 → MVP范围 → PRD → 原型图',
  },
  {
    id: 'post-use-assessment', sceneType: 'post-use-assessment',
    label: '使用后评估',
    description: '5 项评分（省时/可用/减少返工/匹配/可复用），更新能力库状态',
    recommendedEntry: '使用后评估 → 5 项评分 → 更新能力库',
    keywords: ['评估', '使用后', '评价', '打分', '好不好用', '复盘', '回顾', '总结', '反思', '使用体验', '效果', '评分'],
    synonyms: ['复盘评估', '回顾总结', '用后评价', '效果评估', '使用反馈', '体验反馈'],
    triggerPhrases: ['使用后评估', '给这个能力打分', '评估这个能力', '复盘', '这个能力好不好用', '记录使用效果'],
    deliveryTypes: ['评估报告', '能力库更新'],
    audiences: [],
    capabilityWords: ['评估'],
    needsProject: false, needsKnowledgeBase: false, needsUpload: false,
    needsCapabilityRouting: false, needsUserConfirm: true,
    nextStep: '选择要评估的能力 → 5 项评分 → 更新能力库状态',
  },
  {
    id: 'system-maintenance', sceneType: 'system-maintenance',
    label: '系统维护',
    description: '检查 10 项：重复/分类/过期/冲突/入口/命名/类型/沉淀/安全',
    recommendedEntry: '系统维护 → 10 项检查 → 整理方案',
    keywords: ['系统维护', '整理', '整理系统', '检查', '清理', '维护', '能力库整理', '检查能力库', '重复', '冲突', '过期'],
    synonyms: ['打扫', '梳理', '大扫除', '清理库', '检查库', '优化系统', '能力库维护'],
    triggerPhrases: ['系统维护', '能力库整理', '检查能力库', '整理系统', '检查重复能力', '检查规则冲突'],
    deliveryTypes: ['系统健康报告', '整理方案', '问题列表'],
    audiences: [],
    capabilityWords: ['系统', '维护'],
    needsProject: false, needsKnowledgeBase: false, needsUpload: false,
    needsCapabilityRouting: false, needsUserConfirm: true,
    nextStep: '10 项检查 → 输出健康报告 → 整理方案 → 用户确认',
  },
  {
    id: 'simple-task', sceneType: 'simple-task',
    label: '普通一次性任务',
    description: '简单对话问答、单文件处理、快速分析，不需要项目流程',
    recommendedEntry: '直接对话 → 简单的 Prompt 对话 → 快速完成',
    keywords: ['简单', '快速', '问一下', '一个问题', '帮我看看', '帮我查', '帮忙', '小问题', '翻译', '解释', '什么意思', '一次性'],
    synonyms: ['随便问问', '问个问题', '帮我确认', '查一下', '小任务', '临时', '随便'],
    triggerPhrases: ['帮我翻译', '这个什么意思', '帮我看看这个', '帮我解释', '问个问题', '快速问一下', '简单问题'],
    deliveryTypes: ['对话回复', '简单文本'],
    audiences: [],
    capabilityWords: ['Prompt'],
    needsProject: false, needsKnowledgeBase: false, needsUpload: false,
    needsCapabilityRouting: false, needsUserConfirm: false,
    nextStep: '直接进入对话 → 快速回答 → 不创建项目',
  },
  {
    id: 'capability-assessment', sceneType: 'capability-assessment',
    label: '新能力评估',
    description: '评估 Prompt / Skill / SubAgent / Hook / Plugin / MCP 是否值得收录',
    recommendedEntry: '新能力评估 → 能力类型识别 → 综合建议',
    keywords: ['新能力', '能力评估', '评估', 'Skill评估', '新Skill', '新Prompt', '新Plugin', '新Hook', '新MCP', '新SubAgent', '是否收录'],
    synonyms: ['评价能力', '审查能力', '能力审查', '检查能力', '试用', '试试看', '能不用', '好不好用'],
    triggerPhrases: ['新能力评估', '帮我评估这个能力', '这个Skill好不好用', '这个Plugin能用吗', '能不能用'],
    deliveryTypes: ['能力评估报告', '收录建议'],
    audiences: [],
    capabilityWords: ['Skill', 'Plugin', 'Hook', 'MCP', 'SubAgent', 'Prompt', 'Agent'],
    needsProject: false, needsKnowledgeBase: false, needsUpload: false,
    needsCapabilityRouting: false, needsUserConfirm: true,
    nextStep: '识别能力类型 → 匹配场景 → 检查重复 → 输出评估报告',
  },
];

const TYPO_MAP: Record<string, string[]> = {
  '老板': ['老版', '劳板', 'laoban', 'boss', '领导', '上头', '上级'],
  '汇报': ['会报', '报告', 'presentation', '展示'],
  '卡住': ['卡主', '卡了', '卡顿'],
  '视频': ['视屏', '视讯', '录像', '录屏'],
  '资料': ['资科', '材料', '素材', '文件'],
  '产品': ['产物', '成品', '制品'],
  '客户': ['客胡', 'client', '甲方', '顾客', '用户方'],
  '企业': ['企也', '公司', 'enterprise', 'business', '厂商'],
  '方案': ['方按', 'solution', 'plan', '提案', '对策'],
  '解决包': ['解诀包', 'solution package', '方案包', '交付包'],
  '供应链': ['供因链', '供应连', 'supply chain', '供货链'],
  '项目': ['向目', '项日', '工程'],
  '系统': ['系通', '平台', '框架'],
};

function containsAny(input: string, words: string[]): string[] {
  const norm = input.toLowerCase().replace(/\s+/g, ' ').trim();
  return words.filter(w => norm.includes(w.toLowerCase()));
}

function scoreScenario(input: string, scenario: ScenarioDefinition): ScenarioMatchSuggestion {
  const details: string[] = [];
  let score = 0;
  const kw = containsAny(input, scenario.keywords);
  if (kw.length > 0) { score += kw.length * 3; details.push(`命中关键词: ${kw.join(', ')}`); }
  const syn = containsAny(input, scenario.synonyms);
  if (syn.length > 0) { score += syn.length * 2; details.push(`命中同义词: ${syn.join(', ')}`); }
  const trg = containsAny(input, scenario.triggerPhrases);
  if (trg.length > 0) { score += trg.length * 3; details.push(`命中触发表达: ${trg.join(', ')}`); }
  const del = containsAny(input, scenario.deliveryTypes);
  if (del.length > 0) { score += del.length * 2; details.push(`命中交付物: ${del.join(', ')}`); }
  const aud = containsAny(input, scenario.audiences);
  if (aud.length > 0) { score += aud.length * 2; details.push(`命中汇报对象: ${aud.join(', ')}`); }
  const cap = containsAny(input, scenario.capabilityWords);
  if (cap.length > 0) { score += cap.length * 2; details.push(`命中能力词: ${cap.join(', ')}`); }

  const conf = score >= 8 ? 'high' : score >= 4 ? 'medium' : 'low';
  return { scenario, score, confidence: conf as 'high' | 'medium' | 'low', matchedDetails: details };
}

/**
 * 旧版关键词匹配（用于 Step01 实时输入建议）。
 * 保持返回 ScenarioMatchSuggestion[] 以兼容 Step01 UI。
 */
export function matchScenarios(input: string, topN: number = 5): ScenarioMatchSuggestion[] {
  if (!input || input.trim().length < 1) return [];
  return SCENARIO_LIBRARY
    .map(s => scoreScenario(input, s))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
