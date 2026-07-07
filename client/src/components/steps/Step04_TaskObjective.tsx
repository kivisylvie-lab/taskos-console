import React, { useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { api } from '../../utils/api';
import { ConfirmButton } from '../shared/ConfirmButton';

export function Step04_TaskObjective() {
  const { state, dispatch } = usePipeline();
  const [objective, setObjective] = useState(state.project?.taskObjective || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!state.projectId || !objective.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.setObjective(state.projectId, objective.trim());
      dispatch({ type: 'SET_PROJECT', project: result.project });
      dispatch({ type: 'SET_STEP', step: '05-task-type-judge' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    '帮我写一份产品的 PRD 文档，包含功能规划、用户路径和原型说明',
    '分析这三份竞品的定价策略，生成对比报告',
    '帮我搭建一个产品展示 Landing Page',
    '从这份 Excel 中提取关键数据，生成可视化分析报告',
  ];

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">Step 4: 描述任务目标</h2>
      <p className="text-gray-500 text-sm mb-6">详细描述你想完成什么任务，越具体越好</p>

      <div>
        <label className="label">任务目标 *</label>
        <textarea
          className="input-field"
          rows={5}
          placeholder="例如：帮我分析这三个竞品的功能差异，输出对比表格和我的产品改进建议..."
          value={objective}
          onChange={e => setObjective(e.target.value)}
          autoFocus
        />
      </div>

      <div className="mt-4">
        <p className="text-xs text-gray-400 mb-2">💡 示例：</p>
        <div className="grid grid-cols-2 gap-2">
          {examples.map((ex, i) => (
            <button
              key={i}
              className="text-left text-xs p-2 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-gray-600"
              onClick={() => setObjective(ex)}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <ConfirmButton
        onClick={handleSubmit}
        disabled={!objective.trim()}
        loading={loading}
        label="提交任务，开始 AI 分析"
        variant="primary"
      />
    </div>
  );
}
