import React, { useEffect, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { useAIConfig } from '../../store/AIConfigContext';
import { api } from '../../utils/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { MarkdownViewer } from '../shared/MarkdownViewer';
import { ConfirmButton } from '../shared/ConfirmButton';

export function Step17_CallRecordMaterials() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const { config: aiConfig } = useAIConfig();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!state.projectId) return;
    setLoading(true);
    api.getCallRecord(state.projectId, aiConfig)
      .then(res => {
        setResult(res.result);
        dispatch({ type: 'SET_STEP_RESULT', step: '17-call-record-materials', result: res.result });
      })
      .catch(err => dispatch({ type: 'SET_ERROR', error: `记录生成失败: ${err.message}` }))
      .finally(() => setLoading(false));
  }, [state.projectId]);

  const handleContinue = () => dispatch({ type: 'SET_STEP', step: '18-assessment-deposit' });

  if (loading) return <LoadingSpinner message="正在生成 AI 能力调用记录和汇报材料..." />;

  return (
    <div className="card animate-fade-in-up">
      <h2 className="text-xl font-bold mb-1">Step 17: 调用记录与汇报材料</h2>
      <p className="text-gray-500 text-sm mb-6">
        系统已自动生成 AI 能力调用记录（规则 28）和项目汇报材料（规则 27）。
      </p>

      {/* 返回上一步 */}
      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

      <div className="mb-4">
        <h3 className="font-semibold text-sm mb-2">📝 AI 能力调用记录</h3>
        <div className="p-4 bg-gray-50 rounded-lg max-h-80 overflow-y-auto mb-2">
          {result?.recordMarkdown ? (
            <MarkdownViewer content={result.recordMarkdown} />
          ) : (
            <p className="text-gray-400 text-sm">记录生成中...</p>
          )}
        </div>
        <div className="text-xs text-gray-400 mb-4">
          📁 文件路径：{result?.recordPath || 'output/' + state.projectId + '/AI能力调用记录.md'}
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
        <p className="text-sm text-blue-700 font-medium">📋 项目汇报材料</p>
        <p className="text-xs text-blue-600 mt-1">
          汇报材料包含：一句话汇报、汇报对象判断、交付物清单、1/3/10 分钟汇报版本、决策请求和下一步行动。
        </p>
        <p className="text-xs text-blue-500 mt-1">
          📁 文件路径：output/{state.projectId}/deliverables/项目汇报材料.md
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <ConfirmButton onClick={handleContinue} label="确认记录，进入评估与沉淀" />
        <button onClick={goToPrevStep} className="btn-secondary">返回上一步</button>
      </div>
    </div>
  );
}
