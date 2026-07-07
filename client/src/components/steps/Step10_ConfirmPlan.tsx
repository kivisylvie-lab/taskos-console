import React, { useEffect, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { useAIConfig } from '../../store/AIConfigContext';
import { api } from '../../utils/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ConfirmButton } from '../shared/ConfirmButton';

export function Step10_ConfirmPlan() {
  const { state, dispatch } = usePipeline();
  const { config: aiConfig } = useAIConfig();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!state.projectId) return;
    setLoading(true);
    api.confirmPlan(state.projectId, aiConfig)
      .then(res => {
        setResult(res.result);
        dispatch({ type: 'SET_STEP_RESULT', step: '10-confirm-plan', result: res.result });
        if (res.project) dispatch({ type: 'SET_PROJECT', project: res.project });
      })
      .catch(err => dispatch({ type: 'SET_ERROR', error: `方案确认失败: ${err.message}` }))
      .finally(() => setLoading(false));
  }, [state.projectId]);

  const handleExecute = () => {
    dispatch({ type: 'SET_STEP', step: '11-generate-deliverables' });
  };

  if (loading) return <LoadingSpinner message="正在汇总完整执行方案..." />;

  const plan = result?.plan;
  if (!plan) return <div>无方案数据</div>;

  const sections = [
    { key: 'goal', title: '🎯 任务目标', content: plan.goal },
    { key: 'taskType', title: '🔍 任务诊断', content: plan.taskType?.diagnosis },
    { key: 'deliveries', title: '📋 交付物清单', content: `${plan.deliveries?.deliveries?.length || 0} 个交付物` },
    { key: 'capabilities', title: '⚡ 能力路由', content: `${plan.capabilityRoute?.routingTable?.length || 0} 步路由` },
    { key: 'risks', title: '⚠️ 风险评估', content: `${plan.risks?.length || 0} 项风险` },
    { key: 'claudeCannotDo', title: '🚫 AI 无法完成', content: `${plan.claudeCannotDo?.length || 0} 项需人工` },
  ];

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">⭐ Step 10: 确认执行方案</h2>
      <p className="text-gray-500 text-sm mb-6">
        这是关键确认点。请仔细审核以下完整方案，确认无误后点击「确认并执行」
      </p>

      <div className="space-y-2 mb-6">
        {sections.map(s => (
          <div key={s.key} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setExpanded(expanded === s.key ? null : s.key)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="font-medium text-sm">{s.title}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{s.content}</span>
                <span className="text-gray-400">{expanded === s.key ? '▾' : '▸'}</span>
              </span>
            </button>
            {expanded === s.key && (
              <div className="px-4 pb-3 text-sm text-gray-600 border-t border-gray-100 pt-2">
                {s.key === 'risks' && plan.risks ? (
                  <ul className="space-y-1">
                    {plan.risks.map((r: any, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={r.probability === 'high' ? 'text-red-500' : r.probability === 'medium' ? 'text-yellow-500' : 'text-gray-400'}>●</span>
                        <span>{r.risk} — {r.mitigation}</span>
                      </li>
                    ))}
                  </ul>
                ) : s.key === 'claudeCannotDo' && plan.claudeCannotDo ? (
                  <ul className="list-disc pl-4 space-y-1">
                    {plan.claudeCannotDo.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(plan[s.key], null, 2)}</pre>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
        <p className="text-sm text-yellow-700 font-medium">⚠️ 重要提醒</p>
        <ul className="text-xs text-yellow-600 mt-1 space-y-1">
          <li>• 确认后将调用 AI API（DeepSeek）生成交付物（可能产生 API 费用）</li>
          <li>• 生成的交付物为 AI 初稿，建议人工审阅修改</li>
          <li>• 部分功能为 Demo 模拟状态</li>
        </ul>
      </div>

      <ConfirmButton
        onClick={handleExecute}
        label="✅ 确认并执行 — 开始生成交付物"
        variant="success"
      />
    </div>
  );
}
