import React, { useEffect, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { useAIConfig } from '../../store/AIConfigContext';
import { api } from '../../utils/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { DataTable } from '../shared/DataTable';

/* ===== 类型定义 ===== */
interface BusinessAction {
  id: string;
  name: string;
  painPoint: string;
  trigger: string;
  target: string;
  output: string;
  needsApproval: boolean;
  priority: 'high' | 'medium' | 'low';
  enabled: boolean;
}

const EMPTY_ACTION: BusinessAction = {
  id: '',
  name: '',
  painPoint: '',
  trigger: '',
  target: '',
  output: '',
  needsApproval: false,
  priority: 'medium',
  enabled: true,
};

const PRIORITY_LABELS: Record<string, string> = {
  high: '🔴 高',
  medium: '🟡 中',
  low: '🟢 低',
};

/* ===== 业务动作编辑弹窗 ===== */
function BusinessActionModal({
  action,
  onSave,
  onClose,
}: {
  action: BusinessAction;
  onSave: (a: BusinessAction) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<BusinessAction>({ ...action });

  const handleChange = (field: keyof BusinessAction, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, id: form.id || `ba-${Date.now()}` });
  };

  const isNew = !action.id;

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div className="ba-modal" onClick={e => e.stopPropagation()}>
        <div className="ba-modal-header">
          <h3 className="ba-modal-title">{isNew ? '＋ 新增业务动作' : '✏️ 编辑业务动作'}</h3>
          <button onClick={onClose} className="ba-modal-close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="ba-modal-body">
          {/* 业务动作名称 */}
          <div className="ba-form-group">
            <label className="ba-form-label">
              业务动作 <span className="ba-required">*</span>
            </label>
            <input
              className="input-field"
              placeholder="例如：客户需求分析、竞品调研、原型设计"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              autoFocus
            />
          </div>

          {/* 对应痛点 */}
          <div className="ba-form-group">
            <label className="ba-form-label">对应痛点</label>
            <input
              className="input-field"
              placeholder="该动作解决什么业务痛点"
              value={form.painPoint}
              onChange={e => handleChange('painPoint', e.target.value)}
            />
          </div>

          {/* 触发条件 + 执行对象 */}
          <div className="ba-form-row">
            <div className="ba-form-group ba-form-half">
              <label className="ba-form-label">触发条件</label>
              <input
                className="input-field"
                placeholder="什么情况下触发该动作"
                value={form.trigger}
                onChange={e => handleChange('trigger', e.target.value)}
              />
            </div>
            <div className="ba-form-group ba-form-half">
              <label className="ba-form-label">执行对象</label>
              <input
                className="input-field"
                placeholder="对谁/什么执行（客户/系统/数据）"
                value={form.target}
                onChange={e => handleChange('target', e.target.value)}
              />
            </div>
          </div>

          {/* 输出物 */}
          <div className="ba-form-group">
            <label className="ba-form-label">输出物</label>
            <input
              className="input-field"
              placeholder="执行后产出什么（报告/原型/方案/代码）"
              value={form.output}
              onChange={e => handleChange('output', e.target.value)}
            />
          </div>

          {/* 是否需要人工审批 + 优先级 */}
          <div className="ba-form-row">
            <div className="ba-form-group ba-form-half">
              <label className="ba-form-label">是否需要人工审批</label>
              <div className="ba-toggle-row">
                <button
                  type="button"
                  className={`ba-toggle ${form.needsApproval ? 'active-yes' : ''}`}
                  onClick={() => handleChange('needsApproval', true)}
                >
                  需要
                </button>
                <button
                  type="button"
                  className={`ba-toggle ${!form.needsApproval ? 'active-no' : ''}`}
                  onClick={() => handleChange('needsApproval', false)}
                >
                  不需要
                </button>
              </div>
            </div>
            <div className="ba-form-group ba-form-half">
              <label className="ba-form-label">优先级</label>
              <div className="ba-toggle-row">
                {(['high', 'medium', 'low'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`ba-toggle ${form.priority === p ? 'active-priority' : ''}`}
                    onClick={() => handleChange('priority', p)}
                  >
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 启用状态 */}
          <div className="ba-form-group">
            <label className="ba-form-label">启用状态</label>
            <label className="ba-checkbox-label">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={e => handleChange('enabled', e.target.checked)}
              />
              <span>启用该业务动作（停用后不会传入下一步）</span>
            </label>
          </div>

          {/* 按钮 */}
          <div className="ba-form-actions">
            <button type="button" onClick={onClose} className="btn-secondary-uniform">
              取消
            </button>
            <button type="submit" disabled={!form.name.trim()} className="btn-primary-uniform">
              {isNew ? '新增' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===== Step 7 主组件 ===== */
export function Step07_DeliveryType() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const { config: aiConfig } = useAIConfig();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  // 业务动作状态
  const [businessActions, setBusinessActions] = useState<BusinessAction[]>([]);
  const [showBAModal, setShowBAModal] = useState(false);
  const [editingAction, setEditingAction] = useState<BusinessAction>(EMPTY_ACTION);
  const [showValidationError, setShowValidationError] = useState(false);

  useEffect(() => {
    if (!state.projectId) return;
    setLoading(true);
    api.judgeDeliveryType(state.projectId, aiConfig)
      .then(res => {
        setResult(res.result);
        dispatch({ type: 'SET_STEP_RESULT', step: '07-delivery-type', result: res.result });
        if (res.project) dispatch({ type: 'SET_PROJECT', project: res.project });

        // 初始化业务动作：优先使用 API 返回的，否则使用默认样例
        if (res.result?.businessActions && res.result.businessActions.length > 0) {
          setBusinessActions(res.result.businessActions);
        } else {
          setBusinessActions(generateDefaultActions(res.result));
        }
      })
      .catch(err => dispatch({ type: 'SET_ERROR', error: `交付物判断失败: ${err.message}` }))
      .finally(() => setLoading(false));
  }, [state.projectId]);

  const handleContinue = () => {
    const enabledActions = businessActions.filter(a => a.enabled);
    if (enabledActions.length === 0) {
      setShowValidationError(true);
      return;
    }
    setShowValidationError(false);
    // 只将已启用的业务动作传入下一步
    dispatch({
      type: 'SET_STEP_RESULT',
      step: '07-delivery-type',
      result: { ...result, businessActions: enabledActions },
    });
    dispatch({ type: 'SET_STEP', step: '08-capability-precheck' });
  };

  // 新增
  const handleAdd = () => {
    setEditingAction({ ...EMPTY_ACTION });
    setShowBAModal(true);
  };

  // 编辑
  const handleEdit = (action: BusinessAction) => {
    setEditingAction({ ...action });
    setShowBAModal(true);
  };

  // 保存（新增或编辑）
  const handleSave = (action: BusinessAction) => {
    if (editingAction.id) {
      setBusinessActions(prev => prev.map(a => a.id === action.id ? action : a));
    } else {
      setBusinessActions(prev => [...prev, { ...action, id: `ba-${Date.now()}` }]);
    }
    setShowBAModal(false);
  };

  // 删除
  const handleDelete = (id: string) => {
    setBusinessActions(prev => prev.filter(a => a.id !== id));
  };

  // 切换启用/停用
  const handleToggle = (id: string) => {
    setBusinessActions(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
    setShowValidationError(false);
  };

  if (loading) return <LoadingSpinner message="AI 正在判断交付物类型..." />;

  const deliveries = result?.deliveries || [];
  const missingData = result?.missingData || [];

  const typeLabels: Record<string, string> = {
    text: '文本文档', office: '办公文件', image: '图片视觉',
    video: '视频', system: '系统代码', data: '数据', combo: '组合交付',
  };

  const enabledCount = businessActions.filter(a => a.enabled).length;

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">Step 7: 业务动作定义</h2>
      <p className="text-gray-500 text-sm mb-6">确认交付物类型，审核并管理本项目的业务动作清单</p>

      {/* ===== 业务动作类型参考（只读） ===== */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-gray-700">📋 业务动作类型参考</span>
          <span className="badge badge-gray">系统内置 · 只读</span>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          以下为系统根据你的任务自动判断的交付物类型和产出要求，供配置业务动作时参考。
        </p>

        <div className="ba-reference-section">
          <DataTable
            columns={[
              { key: 'name', label: '交付物' },
              { key: 'type', label: '类型', render: (v: string) => typeLabels[v] || v },
              { key: 'required', label: '必须/可选', render: (v: string) => (
                <span className={v === 'must' ? 'badge badge-yellow' : 'badge badge-blue'}>
                  {v === 'must' ? '必须' : '可选'}
                </span>
              )},
              { key: 'format', label: '格式' },
              { key: 'canProduce', label: '可产出', render: (v: boolean) => v ? '✅' : '⚠️ 需人工' },
            ]}
            data={deliveries}
          />
        </div>

        {missingData.length > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mt-3">
            <p className="text-sm font-medium text-yellow-700 mb-2">⚠️ 缺少的必要资料</p>
            <DataTable
              columns={[
                { key: 'item', label: '缺少资料' },
                { key: 'purpose', label: '用途' },
                { key: 'alternative', label: '替代方案' },
              ]}
              data={missingData}
            />
          </div>
        )}

        <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-500 mt-3">
          <p>📌 红线提醒：原型图不能只出文字说明 · 流程图不能只出文字描述 · 视频不能只出文案 · 不能产出的必须说明原因</p>
        </div>
      </div>

      {/* ===== 本项目业务动作清单（可编辑） ===== */}
      <div className="border-t border-gray-200 pt-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">📝 本项目业务动作清单</span>
            <span className="badge badge-green">{enabledCount} 个已启用</span>
          </div>
          <button onClick={handleAdd} className="ba-add-btn">
            ＋ 新增业务动作
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          以下业务动作将用于后续 AI 能力组合匹配。你可以审核、修改、新增或删除。点击「确认业务动作，继续」时只传入已启用的动作。
        </p>

        {businessActions.length === 0 ? (
          <div className="p-8 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-500 text-sm">暂无业务动作</p>
            <p className="text-xs text-gray-400 mt-1">点击「＋ 新增业务动作」添加</p>
          </div>
        ) : (
          <div className="ba-table-wrapper">
            <table className="ba-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>状态</th>
                  <th style={{ width: 140 }}>业务动作</th>
                  <th style={{ width: 120 }}>对应痛点</th>
                  <th style={{ width: 110 }}>触发条件</th>
                  <th style={{ width: 100 }}>执行对象</th>
                  <th style={{ width: 110 }}>输出物</th>
                  <th style={{ width: 80 }}>人工审批</th>
                  <th style={{ width: 70 }}>优先级</th>
                  <th style={{ width: 100 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {businessActions.map(action => (
                  <tr key={action.id} className={!action.enabled ? 'ba-row-disabled' : ''}>
                    <td>
                      <button
                        onClick={() => handleToggle(action.id)}
                        className={`ba-toggle-badge ${action.enabled ? 'enabled' : 'disabled'}`}
                      >
                        {action.enabled ? '已启用' : '已停用'}
                      </button>
                    </td>
                    <td className="ba-cell-name">{action.name}</td>
                    <td className="ba-cell-text" title={action.painPoint}>{action.painPoint || '—'}</td>
                    <td className="ba-cell-text" title={action.trigger}>{action.trigger || '—'}</td>
                    <td className="ba-cell-text">{action.target || '—'}</td>
                    <td className="ba-cell-text" title={action.output}>{action.output || '—'}</td>
                    <td>
                      <span className={`badge ${action.needsApproval ? 'badge-yellow' : 'badge-gray'}`}>
                        {action.needsApproval ? '需要' : '不需'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        action.priority === 'high' ? 'badge-yellow' :
                        action.priority === 'medium' ? 'badge-blue' :
                        'badge-gray'
                      }`}>
                        {action.priority === 'high' ? '高' :
                         action.priority === 'medium' ? '中' : '低'}
                      </span>
                    </td>
                    <td>
                      <div className="ba-action-btns">
                        <button onClick={() => handleEdit(action)} className="ba-edit-btn" title="编辑">
                          ✏️
                        </button>
                        <button onClick={() => handleDelete(action.id)} className="ba-delete-btn" title="删除">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 验证错误提示 */}
      {showValidationError && (
        <div className="ba-validation-error">
          ⚠️ 请至少保留一个业务动作，后续 AI 能力组合需要基于业务动作生成。
        </div>
      )}

      {/* 底部按钮 */}
      <div className="flex items-center justify-center gap-3 pt-4 mt-4 border-t border-gray-100">
        <button onClick={goToPrevStep} className="btn-secondary-uniform">
          ← 返回上一步
        </button>
        <button onClick={handleContinue} className="btn-primary-uniform">
          确认业务动作，继续
        </button>
      </div>

      {/* 业务动作编辑弹窗 */}
      {showBAModal && (
        <BusinessActionModal
          action={editingAction}
          onSave={handleSave}
          onClose={() => setShowBAModal(false)}
        />
      )}
    </div>
  );
}

/* ===== 根据交付物类型生成默认业务动作 ===== */
function generateDefaultActions(result: any): BusinessAction[] {
  const deliveries = result?.deliveries || [];

  const defaultActions: BusinessAction[] = [
    {
      id: 'ba-default-1',
      name: '客户需求分析',
      painPoint: '客户需求不明确，缺少结构化梳理',
      trigger: '客户输入需求后自动触发',
      target: '客户需求文档 / 会议纪要',
      output: '结构化需求分析报告',
      needsApproval: false,
      priority: 'high',
      enabled: true,
    },
    {
      id: 'ba-default-2',
      name: '交付方案设计',
      painPoint: '多类型交付物需要统一规划',
      trigger: '需求分析完成后触发',
      target: '交付物类型判断结果',
      output: '交付方案设计文档 + 产出清单',
      needsApproval: true,
      priority: 'high',
      enabled: true,
    },
    {
      id: 'ba-default-3',
      name: 'AI 能力匹配',
      painPoint: '不知道用什么 AI 能力解决当前问题',
      trigger: '交付方案确定后触发',
      target: '本地能力库 + 外部候选能力',
      output: 'AI 能力路由表',
      needsApproval: false,
      priority: 'medium',
      enabled: true,
    },
  ];

  // 如果有交付物需要人工产出，新增一条审批动作
  const hasManual = deliveries.some((d: any) => !d.canProduce);
  if (hasManual) {
    defaultActions.push({
      id: 'ba-default-4',
      name: '人工产出协调',
      painPoint: '部分交付物无法 AI 自动生成，需人工介入',
      trigger: 'AI 能力无法覆盖的交付物出现时触发',
      target: '人工设计 / 开发团队',
      output: '人工产出交付物 + 审核记录',
      needsApproval: true,
      priority: 'high',
      enabled: true,
    });
  }

  return defaultActions;
}
