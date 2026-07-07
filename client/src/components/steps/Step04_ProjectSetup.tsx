import React, { useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { api } from '../../utils/api';
import { ConfirmButton } from '../shared/ConfirmButton';

const PROJECT_TYPE_LABELS: Record<string, string> = {
  'business-solution': '客户解决包项目',
  'enterprise-solution': '企业业务解决包',
  'personal-long-term': '个人长期项目',
  'personal-short-term': '个人短期项目',
  'study-practice': '学习练习项目',
  portfolio: '作品集项目',
  client: '客户/外包项目',
  enterprise: '企业/公司项目',
};

const CURRENT_KNOWN_DELIVERABLE_TYPES = [
  '文档',
  'PPT',
  '表格',
  '图片',
  '视频',
  '流程图',
  '原型图',
  '页面',
  'Dashboard',
  'Demo',
  '数据模板',
  '自动化流程',
  'API 配置',
  'Agent 配置',
  '知识库',
  '培训材料',
  '汇报材料',
  '其他',
];

const SYSTEM_INTERNAL_PROJECT_FILES = [
  'README.md',
  '使用说明.md',
  '项目汇报材料.md',
];

export function Step04_ProjectSetup() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const [name, setName] = useState(state.project?.name || '');
  const [description, setDescription] = useState(state.project?.description || '');
  const [projectType, setProjectType] = useState('business-solution');
  const [currentKnownDeliverables, setCurrentKnownDeliverables] = useState<string[]>([]);
  const [customDeliveryItem, setCustomDeliveryItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDeliverable = (deliverable: string) => {
    setCurrentKnownDeliverables(prev =>
      prev.includes(deliverable)
        ? prev.filter(item => item !== deliverable)
        : [...prev, deliverable]
    );
    if (deliverable === '其他' && currentKnownDeliverables.includes('其他')) {
      setCustomDeliveryItem('');
    }
  };

  const handleSetup = async () => {
    if (!name.trim()) return;
    const customDeliveryItemValue = customDeliveryItem.trim();
    const hasCustomDeliveryItem = currentKnownDeliverables.includes('其他');
    if (hasCustomDeliveryItem && !customDeliveryItemValue) {
      setError('请填写“其他”交付物内容，或取消勾选“其他”。');
      return;
    }

    const deliveryItems = currentKnownDeliverables
      .filter(item => item !== '其他')
      .concat(hasCustomDeliveryItem ? [customDeliveryItemValue] : []);

    setLoading(true);
    setError(null);

    try {
      if (state.projectId) {
        await api.setObjective(
          state.projectId,
          `[项目名称] ${name.trim()}\n[项目描述] ${description.trim()}\n[任务目标] ${state.taskInput}`
        );
      }

      dispatch({
        type: 'SET_STEP_RESULT',
        step: '04-project-setup',
        result: {
          projectName: name.trim(),
          description: description.trim(),
          projectType,
          currentKnownDeliverables,
          deliveryItems,
          customDeliveryItem: customDeliveryItemValue,
          systemInternalProjectFiles: SYSTEM_INTERNAL_PROJECT_FILES,
          laterRecommendedDeliverables: {
            status: 'pending',
            label: '待系统推荐',
            description: '系统将在后续步骤中，根据客户痛点、数据情况、业务动作和 AI 能力组合，自动推荐完整交付物清单。',
          },
        },
      });

      dispatch({ type: 'SET_STEP', step: '05-task-type-judge' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          <span className="text-blue-600">Step 4</span>：项目设置
        </h2>
        <p className="text-gray-500">
          系统判断你的任务需要创建项目，请完成以下设置。
        </p>
      </div>

      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">📁 项目基本信息</h3>
        <div className="space-y-4">
          <div>
            <label className="label">项目名称 *</label>
            <input
              type="text"
              className="input-field"
              placeholder="例如：供应链补货与供应商异常决策解决包"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label">项目描述</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="简要描述项目背景和目标（可选）"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="label">项目类型</label>
            <select
              className="input-field"
              value={projectType}
              onChange={e => setProjectType(e.target.value)}
            >
              <option value="business-solution">客户解决包项目</option>
              <option value="enterprise-solution">企业业务解决包</option>
              <option value="personal-long-term">个人长期项目</option>
              <option value="personal-short-term">个人短期项目</option>
              <option value="study-practice">学习练习项目</option>
              <option value="portfolio">作品集项目</option>
              <option value="client">客户/外包项目</option>
              <option value="enterprise">企业/公司项目</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">📋 用户当前已知交付物</h3>
        <p className="text-sm text-gray-500 mb-4">
          你可以先填写目前明确需要的交付物。最终交付物会在系统完成痛点拆解、业务动作定义和 AI 能力组合后自动推荐并补全。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CURRENT_KNOWN_DELIVERABLE_TYPES.map(deliverable => (
            <label key={deliverable} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={currentKnownDeliverables.includes(deliverable)}
                onChange={() => toggleDeliverable(deliverable)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">{deliverable}</span>
            </label>
          ))}
        </div>
        {currentKnownDeliverables.includes('其他') && (
          <div className="mt-4">
            <input
              type="text"
              className="input-field"
              placeholder="请输入其他交付物，例如：小程序、海报、培训视频、Excel模板"
              value={customDeliveryItem}
              onChange={e => setCustomDeliveryItem(e.target.value)}
            />
          </div>
        )}
        <div className="mt-4 rounded-lg bg-gray-50 border border-gray-100 p-3">
          <p className="text-xs font-medium text-gray-500 mb-1">系统内部项目文件</p>
          <p className="text-xs text-gray-500 leading-5">
            README.md、使用说明.md、项目汇报材料.md 会作为项目管理与说明文件使用，也可在后续流程中被推荐为可选文档交付物；当前不作为默认必选最终交付物。
          </p>
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">系统后续推荐交付物</h3>
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">待系统推荐</p>
          <p className="text-sm text-gray-500 leading-6">
            系统将在后续步骤中，根据客户痛点、数据情况、业务动作和 AI 能力组合，自动推荐完整交付物清单。
          </p>
        </div>
      </div>

      <div className="card mb-6 bg-blue-50/50 border border-blue-100">
        <h3 className="text-sm font-semibold text-blue-700 mb-2">💡 项目设置摘要</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          {currentKnownDeliverables.length > 0 ? (
            <li>
              ✅ 当前已知交付物：{
                currentKnownDeliverables
                  .filter(item => item !== '其他')
                  .concat(
                    currentKnownDeliverables.includes('其他') && customDeliveryItem.trim()
                      ? [customDeliveryItem.trim()]
                      : currentKnownDeliverables.includes('其他')
                        ? ['其他']
                        : []
                  )
                  .join('、')
              }
            </li>
          ) : (
            <li>✅ 当前暂未填写明确交付物，后续由系统推荐补全</li>
          )}
          <li>✅ 系统后续推荐交付物：待系统推荐</li>
          <li className="text-blue-600 mt-2">
            项目类型：{PROJECT_TYPE_LABELS[projectType] || projectType}
          </li>
        </ul>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="text-center">
        <div className="flex items-center justify-center gap-3">
          <ConfirmButton
            onClick={handleSetup}
            disabled={!name.trim()}
            loading={loading}
            label="确认项目设置，进入判断阶段"
            variant="primary"
          />
          <button onClick={goToPrevStep} className="btn-secondary" disabled={loading}>
            返回上一步
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          确认后系统将对任务进行类型判断、能力路由和交付物分析。
        </p>
      </div>
    </div>
  );
}
