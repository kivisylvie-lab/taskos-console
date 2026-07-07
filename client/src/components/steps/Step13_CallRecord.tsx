import React, { useEffect, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { api } from '../../utils/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { MarkdownViewer } from '../shared/MarkdownViewer';
import { ConfirmButton } from '../shared/ConfirmButton';

export function Step13_CallRecord() {
  const { state, dispatch } = usePipeline();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!state.projectId) return;
    setLoading(true);
    api.getCallRecord(state.projectId)
      .then(res => {
        setResult(res.result);
        dispatch({ type: 'SET_STEP_RESULT', step: '13-call-record', result: res.result });
      })
      .catch(err => dispatch({ type: 'SET_ERROR', error: `记录生成失败: ${err.message}` }))
      .finally(() => setLoading(false));
  }, [state.projectId]);

  const handleContinue = () => dispatch({ type: 'SET_STEP', step: '14-knowledge-deposit' });

  if (loading) return <LoadingSpinner message="正在生成 AI 能力调用记录..." />;

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">Step 13: AI 能力调用记录</h2>
      <p className="text-gray-500 text-sm mb-6">系统已自动生成能力执行证据记录（对应 KIVIDAILYLIFE 规则 28）</p>

      <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto mb-4">
        {result?.recordMarkdown ? (
          <MarkdownViewer content={result.recordMarkdown} />
        ) : (
          <p className="text-gray-400 text-sm">记录生成中...</p>
        )}
      </div>

      <div className="text-xs text-gray-400 mb-4">
        📁 文件路径：{result?.recordPath || 'output/' + state.projectId + '/AI能力调用记录.md'}
      </div>

      <ConfirmButton onClick={handleContinue} label="确认记录，进入最后一步" />
    </div>
  );
}
