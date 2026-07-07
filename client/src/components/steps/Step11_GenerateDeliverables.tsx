import React, { useEffect, useState, useRef } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { api } from '../../utils/api';
import { ConfirmButton } from '../shared/ConfirmButton';

interface ProgressItem {
  fileName: string;
  status: 'generating' | 'done' | 'error';
}

export function Step11_GenerateDeliverables() {
  const { state, dispatch } = usePipeline();
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!state.projectId || startedRef.current) return;
    startedRef.current = true;

    api.generateDeliverablesSSE(
      state.projectId,
      (data: any) => {
        // progress
        setProgress(prev => {
          const existing = prev.find(p => p.fileName === data.fileName);
          if (existing) return prev.map(p => p.fileName === data.fileName ? { ...p, status: 'done' as const } : p);
          return [...prev, { fileName: data.fileName, status: 'generating' }];
        });
        if (data.current) setCurrent(data.current);
        if (data.total) setTotal(data.total);
      },
      (data: any) => {
        // complete
        setDone(true);
        setProgress(prev => prev.map(p => ({ ...p, status: 'done' as const })));
        if (data.files) {
          dispatch({ type: 'SET_STEP_RESULT', step: '11-generate-deliverables', result: { files: data.files } });
        }
      },
      (err: string) => {
        setError(err);
      }
    ).catch(err => {
      setError(err.message);
    });
  }, [state.projectId]);

  const handleContinue = () => dispatch({ type: 'SET_STEP', step: '12-download' });

  const doneCount = progress.filter(p => p.status === 'done').length;

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">Step 11: 生成交付物</h2>
      <p className="text-gray-500 text-sm mb-6">AI 正在逐一生成你的交付物</p>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>进度: {doneCount}/{progress.length || '...'}</span>
          {total > 0 && <span>{Math.round((current / total) * 100)}%</span>}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${done ? 'bg-green-500' : 'bg-blue-600'}`}
            style={{ width: total > 0 ? `${(current / total) * 100}%` : done ? '100%' : '10%' }}
          />
        </div>
      </div>

      {/* File list */}
      <div className="space-y-1 max-h-64 overflow-y-auto mb-4">
        {progress.map((item, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5 px-3 bg-gray-50 rounded animate-fade-in-up">
            <span>
              {item.status === 'done' ? '✅' : item.status === 'error' ? '❌' : '🔄'}
            </span>
            <span className="text-sm flex-1">{item.fileName}</span>
            <span className="text-xs text-gray-400">
              {item.status === 'done' ? '完成' : item.status === 'error' ? '失败' : '生成中...'}
            </span>
          </div>
        ))}
        {progress.length === 0 && !done && !error && (
          <div className="text-center py-8 text-gray-400">
            <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
            准备生成...
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
          {error}
        </div>
      )}

      {done && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
          <p className="text-green-700 font-medium">✅ 交付物生成完成！</p>
          <p className="text-green-600 text-sm mt-1">共生成 {progress.length} 个文件</p>
        </div>
      )}

      <ConfirmButton
        onClick={handleContinue}
        disabled={!done}
        loading={!done && !error}
        label={done ? '查看下载页面' : '生成中，请稍候...'}
        variant={done ? 'primary' : 'secondary'}
      />
    </div>
  );
}
