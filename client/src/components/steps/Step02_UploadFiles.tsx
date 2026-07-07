import React, { useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { api } from '../../utils/api';
import { FileDropZone } from '../shared/FileDropZone';
import { ConfirmButton } from '../shared/ConfirmButton';
import type { UploadedFile } from '../../types/pipeline';

export function Step02_UploadFiles() {
  const { state, dispatch } = usePipeline();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(state.project?.files || []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (!state.projectId) return;
    setUploading(true);
    setError(null);
    try {
      const result = await api.uploadFiles(state.projectId, files);
      setUploadedFiles(prev => [...prev, ...result.files]);
      if (result.project) {
        dispatch({ type: 'SET_PROJECT', project: result.project });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (fileId: string) => {
    if (!state.projectId) return;
    try {
      await api.deleteFile(state.projectId, fileId);
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleContinue = () => {
    dispatch({ type: 'SET_STEP', step: '03-input-urls' });
  };

  const getTypeIcon = (type: string) => {
    const map: Record<string, string> = { image: '🖼️', table: '📊', document: '📄', code: '💻', archive: '📦', other: '📎' };
    return map[type] || '📎';
  };

  const getTypeBadge = (type: string) => {
    const map: Record<string, string> = { image: '图片', table: '表格', document: '文档', code: '代码', archive: '压缩包', other: '文件' };
    return map[type] || '文件';
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">Step 2: 上传文件</h2>
      <p className="text-gray-500 text-sm mb-6">上传与任务相关的文件、图片、表格或文档（可选）</p>

      <FileDropZone onFilesSelected={handleFilesSelected} disabled={uploading} />

      {uploading && (
        <div className="mt-3 text-center text-sm text-blue-600">
          <span className="inline-block w-4 h-4 border-2 border-blue-400 border-t-blue-600 rounded-full animate-spin mr-1" />
          上传中...
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-500">已上传 {uploadedFiles.length} 个文件：</p>
          {uploadedFiles.map(f => (
            <div key={f.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span>{getTypeIcon(f.recognizedType)}</span>
                <span className="text-sm font-medium">{f.name}</span>
                <span className="badge badge-blue">{getTypeBadge(f.recognizedType)}</span>
                <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(1)} KB</span>
              </div>
              <button
                onClick={() => handleRemove(f.id)}
                className="text-gray-400 hover:text-red-500 text-sm"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <ConfirmButton onClick={handleContinue} label="继续（可跳过）" variant="secondary" />
    </div>
  );
}
