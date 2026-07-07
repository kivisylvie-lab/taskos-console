import React, { useState, useCallback } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { api } from '../../utils/api';
import { ConfirmButton } from '../shared/ConfirmButton';
import { FileDropZone } from '../shared/FileDropZone';
import { getFlowMeta } from '../../data/scenarioMatcher';

export function Step03_SupplementaryInfo() {
  const { state, dispatch, goToPrevStep } = usePipeline();

  // 从路由结果中计算 needsProject
  const sceneResult = state.stepResults['02-scene-match'];
  const primaryMeta = sceneResult?.primaryEntry
    ? getFlowMeta(sceneResult.primaryEntry.flowName)
    : null;
  const needsProject = primaryMeta?.needsProject ?? true;
  const [taskObjective, setTaskObjective] = useState(state.taskInput || '');
  const [urlInput, setUrlInput] = useState('');
  const [urlList, setUrlList] = useState<string[]>(state.inputURLs);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>(state.uploadedFiles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddURL = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!urlList.includes(trimmed)) {
      setUrlList(prev => [...prev, trimmed]);
    }
    setUrlInput('');
  };

  const handleRemoveURL = (index: number) => {
    setUrlList(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    setLoading(true);
    setError(null);

    dispatch({ type: 'SET_UPLOADED_FILES', files: uploadedFiles });
    dispatch({ type: 'SET_INPUT_URLS', urls: urlList });

    try {
      // 上传文件到服务器
      if (uploadedFiles.length > 0 && state.projectId) {
        await api.uploadFiles(state.projectId, uploadedFiles);
      }

      // 提交 URL
      if (urlList.length > 0 && state.projectId) {
        await api.submitURLs(state.projectId, urlList);
      }

      // 设置任务目标
      if (taskObjective.trim() && state.projectId) {
        await api.setObjective(state.projectId, taskObjective.trim());
      }

      // 保存到状态
      dispatch({ type: 'SET_TASK_INPUT', taskInput: taskObjective.trim() || state.taskInput });

      // 判断下一步：是否需要项目设置
      const sceneResult = state.stepResults['02-scene-match'];
      if (needsProject) {
        dispatch({ type: 'SET_STEP', step: '04-project-setup' });
      } else {
        // 非项目型任务 → 直接进入判断阶段
        dispatch({ type: 'SET_STEP', step: '05-task-type-judge' });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* 标题 */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          <span className="text-blue-600">Step 3</span>：资料补充
        </h2>
        <p className="text-gray-500">
          补充更多信息，帮助系统更好地理解和执行任务。
        </p>
      </div>

      {/* 返回上一步 */}
      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

      {/* 任务目标 */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-3">🎯 任务目标（可修改）</h3>
        <p className="text-sm text-gray-500 mb-3">
          你在 Step 1 输入的描述，可以在此处补充更多细节。
        </p>
        <textarea
          className="input-field min-h-[100px] resize-y"
          placeholder="详细描述你的任务目标、背景、期望结果..."
          value={taskObjective}
          onChange={e => setTaskObjective(e.target.value)}
        />
      </div>

      {/* 上传更多文件 */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-3">📎 补充上传文件</h3>
        <p className="text-sm text-gray-500 mb-3">
          {uploadedFiles.length > 0
            ? `已有 ${uploadedFiles.length} 个文件，可继续添加。`
            : '还没有上传文件，可以在此处添加。'}
        </p>
        <FileDropZone onFilesSelected={handleFilesSelected} disabled={loading} />

        {uploadedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploadedFiles.map((file, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📁</span>
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-400">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveFile(i)}
                  className="text-red-400 hover:text-red-600 text-sm"
                  disabled={loading}
                >
                  移除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 补充链接 */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-3">🔗 补充链接</h3>
        <div className="flex gap-2">
          <input
            type="url"
            className="input-field flex-1"
            placeholder="https://..."
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddURL())}
            disabled={loading}
          />
          <button
            onClick={handleAddURL}
            className="btn-primary"
            disabled={!urlInput.trim() || loading}
          >
            添加
          </button>
        </div>

        {urlList.length > 0 && (
          <div className="mt-4 space-y-2">
            {urlList.map((url, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                <span className="text-sm text-gray-700 truncate max-w-md">{url}</span>
                <button
                  onClick={() => handleRemoveURL(i)}
                  className="text-red-400 hover:text-red-600 text-sm"
                  disabled={loading}
                >
                  移除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 错误 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* 提交 */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3">
          <ConfirmButton
            onClick={handleContinue}
            loading={loading}
            label="继续"
            variant="primary"
          />
          <button onClick={goToPrevStep} className="btn-secondary" disabled={loading}>
            返回上一步
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {needsProject
            ? '下一步将进行项目设置。'
            : '下一步将进入任务判断阶段。'}
        </p>
      </div>
    </div>
  );
}
