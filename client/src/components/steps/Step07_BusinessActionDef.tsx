import React, { useEffect, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { useAIConfig } from '../../store/AIConfigContext';
import { api } from '../../utils/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';

type Priority = 'high' | 'medium' | 'low';

interface BusinessAction {
  id: string;
  actionName: string;
  painPoint: string;
  triggerCondition: string;
  executor: string;
  outputResult: string;
  output: string;
  needsHumanConfirm: boolean;
  needApproval: boolean;
  priority: Priority;
  enabled: boolean;
}

const EMPTY_ACTION: BusinessAction = {
  id: '',
  actionName: '',
  painPoint: '',
  triggerCondition: '',
  executor: '',
  outputResult: '',
  output: '',
  needsHumanConfirm: false,
  needApproval: false,
  priority: 'medium',
  enabled: true,
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const ACTION_TYPE_REFERENCES = [
  { type: '问答 / 查询', description: '根据用户问题或业务数据返回结构化答案。' },
  { type: '推荐 / 方案生成', description: '基于痛点、约束和目标生成可执行方案。' },
  { type: '提醒 / 预警', description: '当指标、风险或状态触发条件时提示相关人员。' },
  { type: '审批 / 确认', description: '需要人工复核、授权或决策后才能进入下一环节。' },
  { type: '生成报告', description: '把分析结果整理成报告、汇报稿或客户可读材料。' },
  { type: '创建任务', description: '把业务结论拆成待办、负责人、截止时间和验收标准。' },
  { type: '自动流转', description: '在条件满足后自动进入后续系统、流程或工具。' },
  { type: '预测 / 异常识别', description: '识别趋势、异常、风险等级或未来可能结果。' },
  { type: '风险提示', description: '提示合规、质量、数据、承诺边界等风险。' },
  { type: '人工介入', description: '标记 AI 不应独立完成、必须交给人工处理的环节。' },
];

function normalizeAction(raw: any, index: number): BusinessAction {
  const output = raw.outputResult || raw.output || '';
  const needApproval = Boolean(raw.needsHumanConfirm ?? raw.needsApproval ?? raw.needApproval);

  return {
    id: raw.id || `ba-${index + 1}`,
    actionName: raw.actionName || raw.name || '',
    painPoint: raw.painPoint || '',
    triggerCondition: raw.triggerCondition || raw.trigger || '',
    executor: raw.executor || raw.target || '',
    outputResult: output,
    output,
    needsHumanConfirm: needApproval,
    needApproval,
    priority: (raw.priority === 'high' || raw.priority === 'medium' || raw.priority === 'low')
      ? raw.priority
      : 'medium',
    enabled: raw.enabled !== false,
  };
}

function toStepAction(action: BusinessAction) {
  return {
    id: action.id,
    painPoint: action.painPoint,
    actionName: action.actionName,
    triggerCondition: action.triggerCondition,
    outputResult: action.outputResult,
    output: action.output || action.outputResult,
    executor: action.executor,
    needsHumanConfirm: action.needsHumanConfirm,
    needApproval: action.needApproval,
    priority: action.priority,
    enabled: action.enabled,
  };
}

function isSupplyChainReplenishmentContext(context: string) {
  const normalized = context.toLowerCase();
  return (
    (normalized.includes('供应链') || normalized.includes('supply chain')) &&
    (normalized.includes('补货') || normalized.includes('库存') || normalized.includes('sku')) &&
    (normalized.includes('供应商') || normalized.includes('采购'))
  );
}

function createBusinessAction(
  index: number,
  action: Omit<BusinessAction, 'id' | 'enabled' | 'outputResult' | 'needsHumanConfirm'> & {
    output: string;
    needApproval: boolean;
  }
): BusinessAction {
  return {
    ...action,
    id: `ba-default-${index + 1}`,
    enabled: true,
    outputResult: action.output,
    needsHumanConfirm: action.needApproval,
  };
}

function generateSupplyChainBusinessActions(): BusinessAction[] {
  return [
    createBusinessAction(0, {
      actionName: '识别高风险 SKU',
      painPoint: '库存周转慢、部分 SKU 积压或即将缺货，人工难以及时识别风险。',
      triggerCondition: '上传库存表、销售预测或库存周转天数异常时触发。',
      executor: '系统自动分析库存数据，供应链经理复核重点 SKU。',
      output: '高风险 SKU 清单 + 风险等级 + 风险原因。',
      needApproval: false,
      priority: 'high',
    }),
    createBusinessAction(1, {
      actionName: '生成缺货预警',
      painPoint: '缺少实时预警机制，销售部门担心断货但无法提前行动。',
      triggerCondition: '库存量低于安全库存、预计可售天数低于阈值或销售预测上升时触发。',
      executor: '系统自动监控库存阈值并通知供应链经理。',
      output: '缺货预警列表 + 预警等级 + 预计影响。',
      needApproval: false,
      priority: 'high',
    }),
    createBusinessAction(2, {
      actionName: '生成建议补货数量',
      painPoint: '补货决策依赖经验，容易出现补多积压或补少断货。',
      triggerCondition: '确认高风险 SKU 后，根据安全库存、销售预测和采购提前期触发。',
      executor: '系统按补货公式计算，采购员核对异常项。',
      output: '建议补货数量表 + 补货优先级 + 预计成本。',
      needApproval: true,
      priority: 'high',
    }),
    createBusinessAction(3, {
      actionName: '判断供应商交付风险',
      painPoint: '供应商交付表现不透明，延期风险无法提前识别。',
      triggerCondition: '采购订单创建、供应商延期记录更新或准时率低于阈值时触发。',
      executor: '系统计算交付风险，采购经理确认重点供应商。',
      output: '供应商交付风险评分 + 异常原因 + 风险等级。',
      needApproval: false,
      priority: 'high',
    }),
    createBusinessAction(4, {
      actionName: '推荐供应商选择方案',
      painPoint: '缺乏价格、交期、质量、配合度的综合评估模型。',
      triggerCondition: '需要为补货 SKU 选择供应商，或现有供应商风险升高时触发。',
      executor: '系统生成推荐方案，采购经理/采购总监审批。',
      output: '推荐供应商方案 + 成本比较 + 切换风险说明。',
      needApproval: true,
      priority: 'high',
    }),
    createBusinessAction(5, {
      actionName: '生成采购任务',
      painPoint: '分析结论没有转化为明确采购动作，执行跟进容易断档。',
      triggerCondition: '补货数量和供应商方案确认后触发。',
      executor: '系统生成采购任务，采购员执行。',
      output: '采购任务清单 + SKU + 数量 + 推荐供应商 + 截止时间。',
      needApproval: true,
      priority: 'medium',
    }),
    createBusinessAction(6, {
      actionName: '触发人工审批',
      painPoint: '高金额、紧急补货或供应商切换需要人工把关，避免 AI 直接越权。',
      triggerCondition: '补货金额超过阈值、涉及核心供应商切换或风险等级为高时触发。',
      executor: '供应链经理、采购总监或 CEO 按审批规则处理。',
      output: '审批事项 + 审批人 + 审批原因 + 决策记录。',
      needApproval: true,
      priority: 'high',
    }),
    createBusinessAction(7, {
      actionName: '生成老板汇报材料',
      painPoint: '数据分析无法快速转化为管理层能决策的汇报内容。',
      triggerCondition: '补货方案、供应商方案和风险清单确认后触发。',
      executor: '系统生成汇报材料，供应链总监确认后汇报。',
      output: '1 分钟/3 分钟/10 分钟汇报稿 + 关键决策建议。',
      needApproval: true,
      priority: 'medium',
    }),
    createBusinessAction(8, {
      actionName: '沉淀供应链补货预警解决包',
      painPoint: '一次性分析无法复用，后续同类补货预警仍需重复搭建。',
      triggerCondition: '本次业务动作完成并通过复盘后触发。',
      executor: '系统整理解决包，业务负责人确认复用边界。',
      output: '供应链补货预警解决包 + 使用说明 + 复用条件。',
      needApproval: true,
      priority: 'medium',
    }),
  ];
}

function generateGenericBusinessActions(context: string): BusinessAction[] {
  const hasBossReport = context.includes('老板') || context.includes('汇报') || context.includes('管理层');

  const actions = [
    createBusinessAction(0, {
      actionName: '梳理业务痛点',
      painPoint: '用户输入包含业务问题，但需要先拆成可执行动作。',
      triggerCondition: '用户提交任务目标或补充资料后触发。',
      executor: '系统自动梳理，用户确认。',
      output: '结构化痛点清单。',
      needApproval: false,
      priority: 'high',
    }),
    createBusinessAction(1, {
      actionName: '生成解决方案',
      painPoint: '痛点需要转化为可执行方案，而不是只停留在分析文字。',
      triggerCondition: '业务痛点确认后触发。',
      executor: '系统生成方案，用户审核修改。',
      output: '业务解决方案草案。',
      needApproval: true,
      priority: 'high',
    }),
    createBusinessAction(2, {
      actionName: '生成执行任务清单',
      painPoint: '方案如果没有任务化，后续执行容易断档。',
      triggerCondition: '解决方案确认后触发。',
      executor: '系统生成任务，用户分配负责人。',
      output: '执行任务清单。',
      needApproval: true,
      priority: 'medium',
    }),
  ];

  if (hasBossReport) {
    actions.push(createBusinessAction(actions.length, {
      actionName: '生成老板汇报材料',
      painPoint: '项目结果需要给决策者快速理解价值和风险。',
      triggerCondition: '方案和任务清单确认后触发。',
      executor: '系统生成，用户确认。',
      output: '老板汇报材料。',
      needApproval: true,
      priority: 'medium',
    }));
  }

  return actions;
}

function generateDefaultBusinessActions(context: string): BusinessAction[] {
  if (isSupplyChainReplenishmentContext(context)) {
    return generateSupplyChainBusinessActions();
  }

  return generateGenericBusinessActions(context);
}

function BusinessActionModal({
  action,
  onSave,
  onClose,
}: {
  action: BusinessAction;
  onSave: (action: BusinessAction) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<BusinessAction>({ ...action });
  const isNew = !action.id;

  const updateField = <K extends keyof BusinessAction>(field: K, value: BusinessAction[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateOutput = (value: string) => {
    setForm(prev => ({ ...prev, outputResult: value, output: value }));
  };

  const updateApproval = (value: boolean) => {
    setForm(prev => ({ ...prev, needsHumanConfirm: value, needApproval: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.actionName.trim()) return;
    onSave({
      ...form,
      id: form.id || `ba-${Date.now()}`,
      actionName: form.actionName.trim(),
    });
  };

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div className="ba-modal" onClick={event => event.stopPropagation()}>
        <div className="ba-modal-header">
          <h3 className="ba-modal-title">{isNew ? '新增业务动作' : '编辑业务动作'}</h3>
          <button type="button" onClick={onClose} className="ba-modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="ba-modal-body">
          <div className="ba-form-group">
            <label className="ba-form-label">业务动作 <span className="ba-required">*</span></label>
            <input
              className="input-field"
              value={form.actionName}
              onChange={event => updateField('actionName', event.target.value)}
              placeholder="例如：生成库存风险等级分析"
              autoFocus
            />
          </div>

          <div className="ba-form-group">
            <label className="ba-form-label">对应痛点</label>
            <input
              className="input-field"
              value={form.painPoint}
              onChange={event => updateField('painPoint', event.target.value)}
              placeholder="该动作要解决的业务痛点"
            />
          </div>

          <div className="ba-form-row">
            <div className="ba-form-group ba-form-half">
              <label className="ba-form-label">触发条件</label>
              <input
                className="input-field"
                value={form.triggerCondition}
                onChange={event => updateField('triggerCondition', event.target.value)}
                placeholder="什么情况下触发"
              />
            </div>
            <div className="ba-form-group ba-form-half">
              <label className="ba-form-label">执行对象</label>
              <input
                className="input-field"
                value={form.executor}
                onChange={event => updateField('executor', event.target.value)}
                placeholder="系统、岗位、人员或业务对象"
              />
            </div>
          </div>

          <div className="ba-form-group">
            <label className="ba-form-label">输出物</label>
            <input
              className="input-field"
              value={form.outputResult}
              onChange={event => updateOutput(event.target.value)}
              placeholder="执行后产出的表格、报告、任务或方案"
            />
          </div>

          <div className="ba-form-row">
            <div className="ba-form-group ba-form-half">
              <label className="ba-form-label">是否需要人工审批</label>
              <div className="ba-toggle-row">
                <button
                  type="button"
                  className={`ba-toggle ${form.needsHumanConfirm ? 'active-yes' : ''}`}
                  onClick={() => updateApproval(true)}
                >
                  需要
                </button>
                <button
                  type="button"
                  className={`ba-toggle ${!form.needsHumanConfirm ? 'active-no' : ''}`}
                  onClick={() => updateApproval(false)}
                >
                  不需要
                </button>
              </div>
            </div>
            <div className="ba-form-group ba-form-half">
              <label className="ba-form-label">优先级</label>
              <div className="ba-toggle-row">
                {(['high', 'medium', 'low'] as Priority[]).map(priority => (
                  <button
                    key={priority}
                    type="button"
                    className={`ba-toggle ${form.priority === priority ? 'active-priority' : ''}`}
                    onClick={() => updateField('priority', priority)}
                  >
                    {PRIORITY_LABELS[priority]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="ba-form-group">
            <label className="ba-checkbox-label">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={event => updateField('enabled', event.target.checked)}
              />
              <span>启用该业务动作（停用后不会传入下一步）</span>
            </label>
          </div>

          <div className="ba-form-actions">
            <button type="button" onClick={onClose} className="btn-secondary-uniform">取消</button>
            <button type="submit" disabled={!form.actionName.trim()} className="btn-primary-uniform">
              {isNew ? '新增' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Step07_BusinessActionDef() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const { config: aiConfig } = useAIConfig();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [businessActions, setBusinessActions] = useState<BusinessAction[]>([]);
  const [editingAction, setEditingAction] = useState<BusinessAction>(EMPTY_ACTION);
  const [showModal, setShowModal] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);

  useEffect(() => {
    if (!state.projectId) return;
    setLoading(true);
    api.judgeDeliveryType(state.projectId, aiConfig)
      .then(res => {
        const stepResult = res.result;
        const context = [
          state.taskInput,
          state.project?.taskObjective,
          state.project?.description,
          stepResult ? JSON.stringify(stepResult) : '',
        ].filter(Boolean).join('\n');
        const sourceActions = Array.isArray(stepResult?.businessActions)
          ? stepResult.businessActions
          : Array.isArray(stepResult?.actions)
            ? stepResult.actions
            : [];
        const initialActions = isSupplyChainReplenishmentContext(context) || sourceActions.length === 0
          ? generateDefaultBusinessActions(context)
          : sourceActions.map((action: any, index: number) => normalizeAction(action, index));

        setResult(stepResult);
        setBusinessActions(initialActions);
        setValidationError('');
        dispatch({ type: 'SET_STEP_RESULT', step: state.currentStep, result: stepResult });
        if (res.project) dispatch({ type: 'SET_PROJECT', project: res.project });
      })
      .catch(err => dispatch({ type: 'SET_ERROR', error: `业务动作定义失败: ${err.message}` }))
      .finally(() => setLoading(false));
  }, [state.projectId]);

  const handleAdd = () => {
    setEditingAction({ ...EMPTY_ACTION });
    setShowModal(true);
    setDraftSaved(false);
  };

  const handleEdit = (action: BusinessAction) => {
    setEditingAction({ ...action });
    setShowModal(true);
    setDraftSaved(false);
  };

  const handleSave = (action: BusinessAction) => {
    setBusinessActions(prev => {
      const next = prev.some(item => item.id === action.id)
        ? prev.map(item => item.id === action.id ? action : item)
        : [...prev, action];

      setValidationError(next.some(item => item.enabled)
        ? ''
        : '请至少保留一个业务动作，后续 AI 能力组合需要基于业务动作生成。');
      return next;
    });
    setShowModal(false);
    setDraftSaved(false);
  };

  const handleDelete = (id: string) => {
    setBusinessActions(prev => {
      const next = prev.filter(action => action.id !== id);
      setValidationError(next.some(action => action.enabled)
        ? ''
        : '请至少保留一个业务动作，后续 AI 能力组合需要基于业务动作生成。');
      return next;
    });
    setDraftSaved(false);
  };

  const handleToggle = (id: string) => {
    setBusinessActions(prev => {
      const next = prev.map(action => (
        action.id === id ? { ...action, enabled: !action.enabled } : action
      ));
      setValidationError(next.some(action => action.enabled)
        ? ''
        : '请至少保留一个业务动作，后续 AI 能力组合需要基于业务动作生成。');
      return next;
    });
    setDraftSaved(false);
  };

  const handleSaveDraft = () => {
    dispatch({
      type: 'SET_STEP_RESULT',
      step: state.currentStep,
      result: {
        ...result,
        actions: businessActions.map(toStepAction),
        businessActions: businessActions.map(toStepAction),
      },
    });
    setDraftSaved(true);
  };

  const handleContinue = () => {
    const enabledActions = businessActions.filter(action => action.enabled);

    if (enabledActions.length === 0) {
      setValidationError('请至少保留一个业务动作，后续 AI 能力组合需要基于业务动作生成。');
      return;
    }

    const nextResult = {
      ...result,
      actions: enabledActions.map(toStepAction),
      businessActions: enabledActions.map(toStepAction),
    };

    setValidationError('');
    dispatch({
      type: 'SET_STEP_RESULT',
      step: state.currentStep,
      result: nextResult,
    });
    dispatch({
      type: 'SET_CONFIRMED_ACTIONS',
      actions: enabledActions.map(action => action.actionName),
    });
    dispatch({ type: 'SET_STEP', step: state.currentStep === '11-multi-agent-judge' ? '10-github-search-judge' : '08-capability-precheck' });
  };

  if (loading) return <LoadingSpinner message="AI 正在定义业务动作..." />;

  const enabledCount = businessActions.filter(action => action.enabled).length;

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold mb-1">{state.currentStep === '11-multi-agent-judge' ? 'Step 9' : 'Step 7'}: 业务动作定义</h2>
          <p className="text-gray-500 text-sm">
            业务动作类型作为内置参考只读；本项目业务动作清单支持审核、修改和取舍。
          </p>
        </div>
        <span className="badge badge-green">{enabledCount} 个已启用</span>
      </div>

      <div className="step7-clean-grid">
        <section className="step7-soft-section">
          <div className="step7-section-header">
            <div>
              <h3>业务动作类型参考</h3>
              <p>系统内置参考库，只用于辅助判断，不等同于本项目动作。</p>
            </div>
            <span className="badge badge-gray">只读</span>
          </div>

          <div className="ba-reference-section step7-clean-reference-list">
            {ACTION_TYPE_REFERENCES.map(item => (
              <div key={item.type} className="step7-clean-reference-item">
                <p>{item.type}</p>
                <span>{item.description}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="step7-soft-section">
          <div className="step7-section-header">
            <div>
              <h3>本项目业务动作清单</h3>
              <p>只把启用动作传入下一步 AI 能力组合。</p>
            </div>
            <button type="button" onClick={handleAdd} className="ba-add-btn">
              新增业务动作
            </button>
          </div>

          {businessActions.length === 0 ? (
            <div className="step7-clean-empty">
              <p>暂无业务动作</p>
              <span>点击“新增业务动作”添加本项目动作。</span>
            </div>
          ) : (
            <div className="ba-table-wrapper step7-clean-table-wrapper">
              <table className="ba-table">
                <thead>
                  <tr>
                    <th style={{ width: 72 }}>状态</th>
                    <th style={{ width: 150 }}>业务动作</th>
                    <th style={{ width: 150 }}>对应痛点</th>
                    <th style={{ width: 150 }}>触发条件</th>
                    <th style={{ width: 130 }}>执行对象</th>
                    <th style={{ width: 160 }}>输出物</th>
                    <th style={{ width: 100 }}>人工审批</th>
                    <th style={{ width: 80 }}>优先级</th>
                    <th style={{ width: 110 }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {businessActions.map(action => (
                    <tr key={action.id} className={!action.enabled ? 'ba-row-disabled' : ''}>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggle(action.id)}
                          className={`ba-toggle-badge ${action.enabled ? 'enabled' : 'disabled'}`}
                        >
                          {action.enabled ? '已启用' : '已停用'}
                        </button>
                      </td>
                      <td className="ba-cell-name" title={action.actionName}>{action.actionName || '—'}</td>
                      <td className="ba-cell-text" title={action.painPoint}>{action.painPoint || '—'}</td>
                      <td className="ba-cell-text" title={action.triggerCondition}>{action.triggerCondition || '—'}</td>
                      <td className="ba-cell-text" title={action.executor}>{action.executor || '—'}</td>
                      <td className="ba-cell-text" title={action.outputResult}>{action.outputResult || '—'}</td>
                      <td>
                        <span className={`badge ${action.needsHumanConfirm ? 'badge-yellow' : 'badge-gray'}`}>
                          {action.needsHumanConfirm ? '需要' : '不需要'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          action.priority === 'high' ? 'badge-yellow' :
                          action.priority === 'medium' ? 'badge-blue' :
                          'badge-gray'
                        }`}>
                          {PRIORITY_LABELS[action.priority]}
                        </span>
                      </td>
                      <td>
                        <div className="ba-action-btns">
                          <button
                            type="button"
                            onClick={() => handleEdit(action)}
                            className="ba-edit-btn"
                            title="编辑"
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(action.id)}
                            className="ba-delete-btn"
                            title="删除"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {validationError && (
            <div className="ba-validation-error">
              {validationError}
            </div>
          )}

          {draftSaved && (
            <div className="step7-draft-saved">草稿已保存到当前流程上下文。</div>
          )}
        </section>
      </div>

      <div className="flex items-center justify-end gap-3 pt-5 mt-6 border-t border-gray-100">
        <button type="button" onClick={goToPrevStep} className="btn-secondary-uniform">
          返回上一步
        </button>
        <button type="button" onClick={handleSaveDraft} className="btn-secondary-uniform">
          保存草稿
        </button>
        <button type="button" onClick={handleContinue} className="btn-primary-uniform">
          确认并继续
        </button>
      </div>

      {showModal && (
        <BusinessActionModal
          action={editingAction}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
