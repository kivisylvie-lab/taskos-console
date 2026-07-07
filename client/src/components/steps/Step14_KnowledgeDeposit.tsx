import React, { useEffect, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { api } from '../../utils/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ConfirmButton } from '../shared/ConfirmButton';

export function Step14_KnowledgeDeposit() {
  const { state, dispatch } = usePipeline();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!state.projectId) return;
    setLoading(true);
    api.judgeKnowledgeDeposit(state.projectId)
      .then(res => {
        setResult(res.result);
        dispatch({ type: 'SET_STEP_RESULT', step: '14-knowledge-deposit', result: res.result });
      })
      .catch(err => dispatch({ type: 'SET_ERROR', error: `知识沉淀判断失败: ${err.message}` }))
      .finally(() => setLoading(false));
  }, [state.projectId]);

  const toggleCard = (index: number) => {
    const newSet = new Set(selectedCards);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedCards(newSet);
  };

  if (loading) return <LoadingSpinner message="AI 正在判断知识沉淀..." />;

  const suggestions = result?.suggestions || [];

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">Step 14: 知识库沉淀</h2>
      <p className="text-gray-500 text-sm mb-6">系统已判断本次任务中值得沉淀到知识库的内容</p>

      {suggestions.length === 0 ? (
        <div className="p-6 bg-gray-50 rounded-lg text-center mb-6">
          <p className="text-gray-500">📭 本次任务暂无可沉淀的新知识</p>
          <p className="text-xs text-gray-400 mt-1">项目已完成，可开始下一个任务</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {suggestions.map((s: any, i: number) => (
            <div
              key={i}
              onClick={() => toggleCard(i)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedCards.has(i)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedCards.has(i)}
                  onChange={() => toggleCard(i)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{s.cardTitle}</h4>
                  <div className="flex gap-2 mt-1">
                    <span className="badge badge-blue">{s.knowledgeType}</span>
                    {(s.tags || []).map((tag: string, ti: number) => (
                      <span key={ti} className="badge badge-blue">{tag}</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{s.summary}</p>
                  {s.needsConfirmation && (
                    <p className="text-xs text-yellow-600 mt-1">⚠️ 此卡片需要用户确认后才能入库</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
        <p className="text-green-700 font-medium">🎉 恭喜！项目「{state.project?.name}」已完成全部 14 步流程</p>
        <p className="text-green-600 text-sm mt-1">
          所有文件已保存在 output/{state.projectId}/ 目录下
        </p>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 mb-3">
          {selectedCards.size > 0
            ? `已选择 ${selectedCards.size} 个知识卡片待沉淀`
            : '未选择任何知识卡片'}
        </p>
        <p className="text-xs text-gray-400">
          💡 提示：你可以返回修改交付物，或创建新项目开始下一个任务
        </p>
      </div>
    </div>
  );
}
