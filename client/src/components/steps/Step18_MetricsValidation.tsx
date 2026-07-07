import React, { useEffect, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { useAIConfig } from '../../store/AIConfigContext';
import { api } from '../../utils/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ConfirmButton } from '../shared/ConfirmButton';
import { DataTable } from '../shared/DataTable';

export function Step18_MetricsValidation() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const { config: aiConfig } = useAIConfig();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!state.projectId) return;
    setLoading(true);
    api.judgeKnowledgeDeposit(state.projectId, aiConfig)
      .then(res => {
        setResult(res.result);
        dispatch({ type: 'SET_STEP_RESULT', step: '18-assessment-deposit', result: res.result });
        if (res.project) dispatch({ type: 'SET_PROJECT', project: res.project });
      })
      .catch(err => dispatch({ type: 'SET_ERROR', error: `指标验证失败: ${err.message}` }))
      .finally(() => setLoading(false));
  }, [state.projectId]);

  const handleContinue = () => {
    dispatch({ type: 'RESET' });
    dispatch({ type: 'SET_STEP', step: '01-task-input' });
  };

  if (loading) return <LoadingSpinner message="AI 正在验证指标与评估知识沉淀..." />;

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">Step 18: 指标验证与沉淀建议</h2>
      <p className="text-gray-500 text-sm mb-6">用指标判断是否真的解决问题 + 沉淀可复用能力</p>

      {/* 返回上一步 */}
      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

      <div className="space-y-4">
        {/* 指标验证 */}
        {result?.validations && result.validations.length > 0 && (
          <div>
            <p className="label">📊 指标验证结果</p>
            <DataTable
              columns={[
                { key: 'metric', label: '指标' },
                { key: 'currentBaseline', label: '当前基线' },
                { key: 'targetValue', label: '目标值' },
                { key: 'dataSource', label: '数据来源' },
                { key: 'measurementPeriod', label: '统计周期' },
                { key: 'verified', label: '验证状态', render: (v: boolean) => v ? '✅ 已验证' : '⏳ 待验证' },
              ]}
              data={result.validations}
            />
          </div>
        )}

        {/* 沉淀建议表 */}
        {result?.depositSuggestions && result.depositSuggestions.length > 0 && (
          <div>
            <p className="label mt-4">💾 知识沉淀建议</p>
            <DataTable
              columns={[
                { key: 'content', label: '可沉淀内容' },
                { key: 'suggestedType', label: '建议沉淀类型' },
                { key: 'reuseScenario', label: '可复用场景' },
                { key: 'status', label: '状态' },
                { key: 'needsUserConfirm', label: '需确认', render: (v: boolean) => v ? '⚠️ 是' : '否' },
              ]}
              data={result.depositSuggestions}
            />
          </div>
        )}

        {/* 兼容原有格式 */}
        {!result?.depositSuggestions && result?.suggestions && result.suggestions.length > 0 && (
          <div>
            <p className="label">💾 知识沉淀建议</p>
            <DataTable
              columns={[
                { key: 'cardTitle', label: '知识卡片' },
                { key: 'knowledgeType', label: '类型' },
                { key: 'tags', label: '标签', render: (v: string[]) => v?.join(', ') || '' },
                { key: 'summary', label: '摘要' },
                { key: 'needsConfirmation', label: '需确认', render: (v: boolean) => v ? '是' : '否' },
              ]}
              data={result.suggestions}
            />
          </div>
        )}

        {/* 解决包模式专属沉淀参考 */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
          <p className="text-sm text-purple-600 font-medium mb-2">📦 客户解决包模式可沉淀类型</p>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
            <span>🏭 行业模板</span>
            <span>⚡ Skill</span>
            <span>🤖 Agent</span>
            <span>🪝 Hook</span>
            <span>💬 Prompt</span>
            <span>🔧 Tool</span>
            <span>📚 知识卡片</span>
            <span>📋 SOP</span>
            <span>📦 解决包模板</span>
            <span>📊 指标模板</span>
            <span>🎬 Demo 案例</span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-lg font-semibold text-green-800">🎉 客户解决包流程完成！</p>
        <p className="text-sm text-green-600 mt-1">
          系统已完成：痛点拆解 → 业务动作 → AI 组合方案 → 解决包封装 → 客户使用说明 → 指标验证 → 知识沉淀
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <ConfirmButton onClick={handleContinue} label="完成并返回首页 →" />
        <button onClick={goToPrevStep} className="btn-secondary">返回上一步</button>
      </div>
    </div>
  );
}
