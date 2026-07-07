import React, { useEffect, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { useAIConfig } from '../../store/AIConfigContext';
import { api } from '../../utils/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ConfirmButton } from '../shared/ConfirmButton';
import { DataTable } from '../shared/DataTable';

export function Step12_RiskMetricsJudge() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const { config: aiConfig } = useAIConfig();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!state.projectId) return;
    setLoading(true);
    api.getRiskMetrics(state.projectId, aiConfig)
      .then(res => {
        setResult(res.result);
        dispatch({ type: 'SET_STEP_RESULT', step: '12-capability-route', result: res.result });
        if (res.project) dispatch({ type: 'SET_PROJECT', project: res.project });
      })
      .catch(err => dispatch({ type: 'SET_ERROR', error: `风险指标判断失败: ${err.message}` }))
      .finally(() => setLoading(false));
  }, [state.projectId]);

  const handleContinue = () => {
    dispatch({ type: 'SET_STEP', step: '13-confirm-plan' });
  };

  if (loading) return <LoadingSpinner message="AI 正在评估风险与定义指标..." />;

  const probabilityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700',
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">Step 12: 风险与指标判断</h2>
      <p className="text-gray-500 text-sm mb-6">识别交付风险 + 定义验证指标——用数据判断是否真的解决了问题</p>

      {/* 返回上一步 */}
      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

      <div className="space-y-4">
        {/* 风险评估矩阵 */}
        {result?.risks && result.risks.length > 0 && (
          <div>
            <p className="label">⚠️ 风险评估矩阵</p>
            <div className="space-y-2">
              {result.risks.map((risk: any, i: number) => (
                <div key={i} className={`p-3 rounded-lg border ${risk.probability === 'high' ? 'border-red-300 bg-red-50' : risk.probability === 'medium' ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50'}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{risk.risk}</p>
                    <span className={`badge text-xs ${probabilityColors[risk.probability] || 'bg-gray-100'}`}>
                      概率: {risk.probability === 'high' ? '高' : risk.probability === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                  <p className="text-sm mt-1 text-gray-600">影响: {risk.impact}</p>
                  <p className="text-sm text-green-700">缓解: {risk.mitigation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI 指标表 */}
        {result?.metrics && result.metrics.length > 0 && (
          <div>
            <p className="label mt-4">📊 验证指标定义</p>
            <DataTable
              columns={[
                { key: 'kpiName', label: '指标名称' },
                { key: 'currentBaseline', label: '当前基线' },
                { key: 'targetValue', label: '目标值' },
                { key: 'dataSource', label: '数据来源' },
                { key: 'measurementPeriod', label: '统计周期' },
              ]}
              data={result.metrics}
            />
          </div>
        )}

        {/* 指标类型参考 */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
          <p className="text-sm text-purple-600 font-medium mb-2">📈 常用验证指标参考</p>
          <div className="grid grid-cols-2 gap-1 text-sm text-gray-700">
            <span>⏱ 响应时间</span>
            <span>👤 人工处理时长</span>
            <span>🔄 重复任务减少量</span>
            <span>🎯 准确率 / 命中率</span>
            <span>📦 交付准时率</span>
            <span>⚠️ 缺货率</span>
            <span>💰 转化率 / 复购率</span>
            <span>💵 客单价 / 成本</span>
            <span>🔁 返工次数</span>
            <span>😊 用户满意度</span>
            <span>📋 老板决策时间</span>
            <span>🏭 业务处理周期</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <ConfirmButton onClick={handleContinue} label="确认风险与指标，继续 →" />
        <button onClick={goToPrevStep} className="btn-secondary">返回上一步</button>
      </div>
    </div>
  );
}
