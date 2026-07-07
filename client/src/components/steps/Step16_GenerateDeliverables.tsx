import React, { useEffect, useState, useRef } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { api } from '../../utils/api';
import { ConfirmButton } from '../shared/ConfirmButton';

interface ProgressItem {
  fileName: string;
  status: 'generating' | 'done' | 'error';
}

export function Step16_GenerateDeliverables() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<any>(null);
  const [building, setBuilding] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!state.projectId || startedRef.current) return;
    startedRef.current = true;

    api.generateDeliverablesSSE(
      state.projectId,
      (data: any) => {
        setProgress(prev => {
          const existing = prev.find(p => p.fileName === data.fileName);
          if (existing) return prev.map(p => p.fileName === data.fileName ? { ...p, status: 'done' as const } : p);
          return [...prev, { fileName: data.fileName, status: 'generating' }];
        });
        if (data.current) setCurrent(data.current);
        if (data.total) setTotal(data.total);
      },
      (data: any) => {
        setDone(true);
        setProgress(prev => prev.map(p => ({ ...p, status: 'done' as const })));
        if (data.files) {
          dispatch({ type: 'SET_STEP_RESULT', step: '16-generate-deliverables', result: { files: data.files } });
        }
      },
      (err: string) => setError(err)
    ).catch(err => setError(err.message));
  }, [state.projectId]);

  useEffect(() => {
    if (!done || !state.projectId) return;
    api.getFiles(state.projectId)
      .then(data => setFileTree(data.tree))
      .catch(() => {});
  }, [done, state.projectId]);

  const handleBuild = async () => {
    if (!state.projectId) return;
    setBuilding(true);
    try {
      await api.buildPackage(state.projectId);
      setDownloadReady(true);
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: `打包失败: ${err.message}` });
    } finally {
      setBuilding(false);
    }
  };

  const handleDownload = () => {
    if (!state.projectId) return;
    window.open(api.getDownloadURL(state.projectId), '_blank');
  };

  const handleContinue = () => dispatch({ type: 'SET_STEP', step: '17-call-record-materials' });

  const doneCount = progress.filter(p => p.status === 'done').length;

  const renderTree = (node: any, depth: number = 0): React.ReactNode[] => {
    const items: React.ReactNode[] = [
      <div key={node.path} className="flex items-center gap-2 py-1" style={{ paddingLeft: depth * 16 }}>
        <span>{node.type === 'directory' ? '📁' : '📄'}</span>
        <span className="text-sm flex-1">{node.name}</span>
        {node.size !== undefined && (
          <span className="text-xs text-gray-400">{(node.size / 1024).toFixed(1)} KB</span>
        )}
      </div>
    ];
    if (node.children) {
      node.children.forEach((child: any) => {
        items.push(...renderTree(child, depth + 1));
      });
    }
    return items;
  };

  return (
    <div className="card animate-fade-in-up">
      <h2 className="text-xl font-bold mb-1">Step 16: 生成交付物</h2>
      <p className="text-gray-500 text-sm mb-6">AI 正在逐一生成你的交付物，生成完成后可下载项目包。</p>

      {/* 返回上一步 */}
      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

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
          <div key={i} className="flex items-center gap-2 py-1.5 px-3 bg-gray-50 rounded">
            <span>{item.status === 'done' ? '✅' : item.status === 'error' ? '❌' : '🔄'}</span>
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
          <p className="text-green-700 font-medium">✅ 交付物生成完成！共生成 {progress.length} 个文件</p>
        </div>
      )}

      {/* 下载区（生成完成后显示） */}
      {done && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-sm mb-3">📦 下载项目包</h3>
          {fileTree && (
            <div className="max-h-48 overflow-y-auto mb-3">
              {renderTree(fileTree)}
            </div>
          )}
          <div className="flex gap-3 justify-center">
            {!downloadReady ? (
              <button onClick={handleBuild} disabled={building} className="btn-primary">
                {building ? '打包中...' : '📦 构建项目包'}
              </button>
            ) : (
              <button onClick={handleDownload} className="btn-success">
                ⬇️ 下载 ZIP
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <ConfirmButton
          onClick={handleContinue}
          disabled={!done}
          loading={!done && !error}
          label={done ? '继续，生成调用记录' : '生成中，请稍候...'}
          variant={done ? 'primary' : 'secondary'}
        />
        <button onClick={goToPrevStep} className="btn-secondary">返回上一步</button>
      </div>
    </div>
  );
}
