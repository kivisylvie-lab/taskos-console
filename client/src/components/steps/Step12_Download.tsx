import React, { useEffect, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { api } from '../../utils/api';
import { ConfirmButton } from '../shared/ConfirmButton';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  children?: FileNode[];
}

export function Step12_Download() {
  const { state, dispatch } = usePipeline();
  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);

  useEffect(() => {
    if (!state.projectId) return;
    api.getFiles(state.projectId)
      .then(data => setFileTree(data.tree))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [state.projectId]);

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

  const handleContinue = () => dispatch({ type: 'SET_STEP', step: '13-call-record' });

  const renderNode = (node: FileNode, depth: number = 0) => (
    <div key={node.path} className="flex items-center gap-2 py-1" style={{ paddingLeft: depth * 16 }}>
      <span>{node.type === 'directory' ? '📁' : '📄'}</span>
      <span className="text-sm flex-1">{node.name}</span>
      {node.size !== undefined && (
        <span className="text-xs text-gray-400">{(node.size / 1024).toFixed(1)} KB</span>
      )}
    </div>
  );

  const renderTree = (node: FileNode, depth: number = 0): React.ReactNode => {
    const items = [renderNode(node, depth)];
    if (node.children) {
      node.children.forEach(child => {
        items.push(...(Array.isArray(renderTree(child, depth + 1)) ? renderTree(child, depth + 1) as React.ReactNode[] : [renderTree(child, depth + 1)]));
      });
    }
    return items;
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">Step 12: 下载项目包</h2>
      <p className="text-gray-500 text-sm mb-6">预览生成的文件并下载完整项目包</p>

      {loading ? (
        <div className="text-center py-8 text-gray-400">加载文件列表...</div>
      ) : fileTree ? (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg max-h-80 overflow-y-auto">
          {renderTree(fileTree)}
        </div>
      ) : (
        <p className="text-gray-400">暂无文件</p>
      )}

      <div className="flex gap-3 justify-center mb-4">
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

      <ConfirmButton onClick={handleContinue} label="继续，生成能力调用记录" variant="secondary" />
    </div>
  );
}
