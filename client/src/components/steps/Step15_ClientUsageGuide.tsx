import React, { useEffect, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { useAIConfig } from '../../store/AIConfigContext';
import { api } from '../../utils/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ConfirmButton } from '../shared/ConfirmButton';
import { DataTable } from '../shared/DataTable';

export function Step15_ClientUsageGuide() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const { config: aiConfig } = useAIConfig();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!state.projectId) return;
    setLoading(true);
    // 复用 quality-check 步骤 API
    api.getClientUsageGuide(state.projectId, aiConfig)
      .then(res => {
        setResult(res.result);
        dispatch({ type: 'SET_STEP_RESULT', step: '15-quality-check', result: res.result });
        if (res.project) dispatch({ type: 'SET_PROJECT', project: res.project });
      })
      .catch(err => dispatch({ type: 'SET_ERROR', error: `使用说明生成失败: ${err.message}` }))
      .finally(() => setLoading(false));
  }, [state.projectId]);

  const handleContinue = () => {
    dispatch({ type: 'SET_STEP', step: '16-generate-deliverables' });
  };

  if (loading) return <LoadingSpinner message="正在生成客户使用说明..." />;

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">Step 15: 客户使用说明生成</h2>
      <p className="text-gray-500 text-sm mb-6">让客户按业务流程使用——不需要理解底层 Prompt / Skill / MCP / Agent</p>

      {/* 返回上一步 */}
      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

      <div className="space-y-4">
        {/* 使用步骤表 */}
        {result?.steps && result.steps.length > 0 && (
          <div>
            <p className="label">📖 客户使用步骤</p>
            <DataTable
              columns={[
                { key: 'stepNumber', label: '步骤' },
                { key: 'clientAction', label: '客户要做什么' },
                { key: 'systemAction', label: '系统会做什么' },
                { key: 'output', label: '输出结果' },
                { key: 'attention', label: '⚠️ 注意事项' },
              ]}
              data={result.steps}
            />
          </div>
        )}

        {/* 使用说明核心原则 */}
        {!result?.steps && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-600 font-medium mb-2">📌 客户只需知道</p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>第一步做什么</li>
                <li>上传什么资料</li>
                <li>看哪个结果</li>
                <li>谁确认、谁执行</li>
                <li>出问题找谁</li>
                <li>多久复盘一次</li>
                <li>哪些情况必须人工介入</li>
              </ul>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-sm text-yellow-600 font-medium mb-2">🔒 客户不需要理解</p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>底层 Prompt 模板</li>
                <li>Skill / Agent / Hook / MCP 机制</li>
                <li>能力路由逻辑</li>
                <li>AI 模型选择</li>
                <li>自动化脚本细节</li>
              </ul>
            </div>
          </div>
        )}

        {/* 注意事项 */}
        {result?.notes && result.notes.length > 0 && (
          <div>
            <p className="label">⚠️ 重要注意事项</p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {result.notes.map((note: string, i: number) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        <ConfirmButton onClick={handleContinue} label="确认使用说明，继续 →" />
        <button onClick={goToPrevStep} className="btn-secondary">返回上一步</button>
      </div>
    </div>
  );
}
