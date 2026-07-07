import React, { useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { api } from '../../utils/api';
import { ConfirmButton } from '../shared/ConfirmButton';
import type { InputURL } from '../../types/pipeline';

export function Step03_InputURLs() {
  const { state, dispatch } = usePipeline();
  const [urlText, setUrlText] = useState('');
  const [urls, setUrls] = useState<InputURL[]>(state.project?.urls || []);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!state.projectId || !urlText.trim()) return;
    setSubmitting(true);
    try {
      const urlList = urlText
        .split(/[\n,]+/)
        .map(u => u.trim())
        .filter(u => u.startsWith('http'));

      if (urlList.length > 0) {
        const result = await api.submitURLs(state.projectId, urlList);
        setUrls(prev => [...prev, ...result.urls]);
        if (result.project) {
          dispatch({ type: 'SET_PROJECT', project: result.project });
        }
        setUrlText('');
      }
    } catch (err: any) {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    dispatch({ type: 'SET_STEP', step: '04-task-objective' });
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = { webpage: '网页', video: '视频', github: 'GitHub', doc: '文档', other: '链接' };
    return map[type] || '链接';
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">Step 3: 输入链接</h2>
      <p className="text-gray-500 text-sm mb-6">粘贴与任务相关的网页链接或视频链接（可选）</p>

      <div className="flex gap-3">
        <input
          type="text"
          className="input-field flex-1"
          placeholder="https://example.com, https://youtube.com/..."
          value={urlText}
          onChange={e => setUrlText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        <button
          onClick={handleSubmit}
          disabled={!urlText.trim() || submitting}
          className="btn-primary whitespace-nowrap"
        >
          {submitting ? '添加中...' : '添加'}
        </button>
      </div>

      {urls.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-500">已添加 {urls.length} 个链接：</p>
          {urls.map((u, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <span>{u.type === 'video' ? '🎬' : u.type === 'github' ? '📂' : '🔗'}</span>
              <span className="text-sm truncate flex-1">{u.url}</span>
              <span className="badge badge-blue">{getTypeLabel(u.type)}</span>
            </div>
          ))}
        </div>
      )}

      <ConfirmButton onClick={handleContinue} label="继续（可跳过）" variant="secondary" />
    </div>
  );
}
