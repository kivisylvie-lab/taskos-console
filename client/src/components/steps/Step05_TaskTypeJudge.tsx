import React, { useEffect, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { useAIConfig } from '../../store/AIConfigContext';
import { api } from '../../utils/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ConfirmButton } from '../shared/ConfirmButton';
import { DataTable } from '../shared/DataTable';

export function Step05_TaskTypeJudge() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const { config: aiConfig } = useAIConfig();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!state.projectId) return;
    setLoading(true);
    api.judgeTaskType(state.projectId, aiConfig)
      .then(res => {
        setResult(res.result);
        dispatch({ type: 'SET_STEP_RESULT', step: '05-task-type-judge', result: res.result });
        if (res.project) dispatch({ type: 'SET_PROJECT', project: res.project });
      })
      .catch(err => dispatch({ type: 'SET_ERROR', error: `任务判断失败: ${err.message}` }))
      .finally(() => setLoading(false));
  }, [state.projectId]);

  const handleContinue = () => {
    dispatch({ type: 'SET_STEP', step: '06-knowledge-search' });
  };

  if (loading) return <LoadingSpinner message="AI 正在诊断任务类型..." />;

  const gapLabels: Record<string, string> = {
    knowledge: '知识缺口', process: '流程缺口', tool: '工具缺口',
    data: '数据缺口', experience: '经验缺口', execution: '执行缺口',
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">Step 5: 任务类型判断</h2>
      <p className="text-gray-500 text-sm mb-6">AI 已诊断你的任务类型和问题缺口</p>

      {/* 返回上一步 */}
      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">📋 诊断结果</p>
          <p className="text-lg font-semibold mt-1">{result?.diagnosis}</p>
        </div>

        <div>
          <p className="label">缺口类型</p>
          <div className="flex flex-wrap gap-2">
            {(result?.gapTypes || []).map((g: string) => (
              <span key={g} className="badge badge-yellow">{gapLabels[g] || g}</span>
            ))}
          </div>
        </div>

        <div>
          <p className="label">问题本质</p>
          <p className="text-sm text-gray-700">{result?.essence}</p>
        </div>

        {result?.recommendedSteps && result.recommendedSteps.length > 0 && (
          <div>
            <p className="label">推荐解决步骤</p>
            <DataTable
              columns={[
                { key: 'goal', label: '目标' },
                { key: 'action', label: '动作' },
                { key: 'output', label: '产出' },
              ]}
              data={result.recommendedSteps}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        <ConfirmButton onClick={handleContinue} label="确认诊断，继续" />
        <button onClick={goToPrevStep} className="btn-secondary">返回上一步</button>
      </div>
    </div>
  );
}
