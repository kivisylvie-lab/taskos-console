import React, { useEffect, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { useAIConfig } from '../../store/AIConfigContext';
import { api } from '../../utils/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ConfirmButton } from '../shared/ConfirmButton';
import { DataTable } from '../shared/DataTable';

export function Step12_CapabilityRoute() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const { config: aiConfig } = useAIConfig();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!state.projectId) return;
    setLoading(true);
    api.getCapabilityRoute(state.projectId, aiConfig)
      .then(res => {
        setResult(res.result);
        dispatch({ type: 'SET_STEP_RESULT', step: '12-capability-route', result: res.result });
        if (res.project) dispatch({ type: 'SET_PROJECT', project: res.project });
      })
      .catch(err => dispatch({ type: 'SET_ERROR', error: `能力路由失败: ${err.message}` }))
      .finally(() => setLoading(false));
  }, [state.projectId]);

  const handleContinue = () => dispatch({ type: 'SET_STEP', step: '13-confirm-plan' });

  if (loading) return <LoadingSpinner message="AI 正在生成能力路由方案..." />;

  const routingTable = result?.routingTable || [];

  return (
    <div className="card animate-fade-in-up">
      <h2 className="text-xl font-bold mb-1">Step 12: 能力路由</h2>
      <p className="text-gray-500 text-sm mb-6">系统为每个步骤推荐了最合适的 AI 能力类型</p>

      {/* 返回上一步 */}
      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

      <DataTable
        columns={[
          { key: 'step', label: '步骤' },
          { key: 'capabilityType', label: '能力类型', render: (v: string) => (
            <span className="badge bg-blue-100 text-blue-700">{v}</span>
          )},
          { key: 'specificCapability', label: '具体能力' },
          { key: 'reason', label: '选择原因' },
          { key: 'claudeCanComplete', label: 'Claude 可完成', render: (v: boolean) => v ? '✅' : '⚠️ 需人工' },
          { key: 'needsVerification', label: '需验证', render: (v: boolean) => v ? '🔍' : '—' },
        ]}
        data={routingTable}
      />

      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
        <p>📌 能力类型：Prompt=一次性分析 · Skill=高频复用 · SubAgent=多角色 · Hook=自动触发 · MCP=外部连接 · Tool=脚本化</p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <ConfirmButton onClick={handleContinue} label="确认路由方案，进入执行方案" />
        <button onClick={goToPrevStep} className="btn-secondary">返回上一步</button>
      </div>
    </div>
  );
}
