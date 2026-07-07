import React, { useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { api } from '../../utils/api';
import { ConfirmButton } from '../shared/ConfirmButton';

export function Step01_CreateProject() {
  const { dispatch } = usePipeline();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const project = await api.createProject(name.trim(), description.trim());
      dispatch({ type: 'SET_PROJECT', project });
      dispatch({ type: 'SET_STEP', step: '02-upload-files' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">Step 1: 创建项目</h2>
      <p className="text-gray-500 text-sm mb-6">给项目起个名字，告诉系统你要做什么</p>

      <div className="space-y-4">
        <div>
          <label className="label">项目名称 *</label>
          <input
            type="text"
            className="input-field"
            placeholder="例如：产品PRD生成、竞品分析报告、自动化脚本..."
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
        </div>
        <div>
          <label className="label">项目描述</label>
          <textarea
            className="input-field"
            rows={3}
            placeholder="简要描述项目背景和目标（可选）"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <ConfirmButton
        onClick={handleCreate}
        disabled={!name.trim()}
        loading={loading}
        label="创建项目"
        variant="primary"
      />
    </div>
  );
}
