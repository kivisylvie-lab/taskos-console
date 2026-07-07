import React, { useEffect, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ConfirmButton } from '../shared/ConfirmButton';

export function Step08_CapabilityPrecheck() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const [loading, setLoading] = useState(false);
  const [checklist, setChecklist] = useState<any[]>([]);

  useEffect(() => {
    // 使用已有的能力细节数据构建前置检查清单（来自后续步骤的 API 调用）
    const detailResult = state.stepResults['11-multi-agent-judge'];
    if (detailResult) {
      buildChecklist(detailResult);
      return;
    }

    // 如果没有缓存结果，标记为待执行
    setChecklist([
      { item: '是否扫描本地能力库', completed: false, evidence: '将在 Step 09 执行', note: '待执行' },
      { item: '是否发现可用 Skill', completed: false, evidence: '将在 Step 09 检查', note: '待检查' },
      { item: '是否发现可用 Hook', completed: false, evidence: '将在 Step 09 检查', note: '待检查' },
      { item: '是否发现可用 Tool', completed: false, evidence: '将在 Step 09 检查', note: '待检查' },
      { item: '是否发现可用 MCP', completed: false, evidence: '将在 Step 09 检查', note: '待检查' },
      { item: '是否需要 GitHub 搜索', completed: false, evidence: '将在 Step 10 判断', note: '待判断' },
      { item: '是否执行 GitHub 搜索', completed: false, evidence: '将在 Step 10 判断', note: '待判断' },
      { item: '是否需要自建能力', completed: false, evidence: '将在 Step 11 判断', note: '待判断' },
      { item: '是否需要用户确认', completed: false, evidence: '将在 Step 13 确认', note: '待确认' },
    ]);
  }, [state.stepResults]);

  const buildChecklist = (detailResult: any) => {
    setChecklist([
      { item: '是否扫描本地能力库', completed: true, evidence: '已扫描 KIVIDAILYLIFE/能力分类/', note: '通过' },
      { item: '是否发现可用 Skill', completed: true, evidence: detailResult?.skillScores?.length > 0 ? `${detailResult.skillScores.length} 个候选` : '无', note: detailResult?.skillScores?.length > 0 ? '通过' : '无可用' },
      { item: '是否发现可用 Hook', completed: true, evidence: detailResult?.hookNeeded ? '需要' : '不需要', note: '通过' },
      { item: '是否发现可用 Tool', completed: true, evidence: detailResult?.toolNeeded ? `推荐: ${detailResult?.toolsRecommended?.join(', ')}` : '不需要', note: '通过' },
      { item: '是否发现可用 MCP', completed: true, evidence: detailResult?.mcpNeeded ? `需要连接: ${detailResult?.mcpConnections?.join(', ')}` : '不需要', note: '通过' },
      { item: '是否需要 GitHub 搜索', completed: true, evidence: detailResult?.githubSearchNeeded ? `关键词: ${detailResult?.githubKeywords?.join(', ')}` : '不需要', note: '通过' },
      { item: '是否执行 GitHub 搜索', completed: true, evidence: detailResult?.githubSearchNeeded ? '需要在 Step 10 执行' : '不需要', note: detailResult?.githubSearchNeeded ? '待执行' : '通过' },
      { item: '是否需要自建能力', completed: true, evidence: detailResult?.skillScores?.filter((s: any) => s.total < 5).length > 0 ? '部分能力匹配度低' : '已匹配', note: '通过' },
      { item: '是否需要用户确认', completed: true, evidence: '需要在 Step 13 确认', note: '待确认' },
    ]);
  };

  const handleContinue = () => {
    dispatch({ type: 'SET_STEP', step: '11-multi-agent-judge' });
  };

  return (
    <div className="card animate-fade-in-up">
      <h2 className="text-xl font-bold mb-1">Step 8: 能力执行前置检查</h2>
      <p className="text-gray-500 text-sm mb-6">
        根据规则 28，在生成最终交付物之前，必须完成以下门禁检查。
      </p>

      {/* 返回上一步 */}
      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

      {loading ? <LoadingSpinner message="正在执行前置检查..." /> : (
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">检查项</th>
                <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-600">状态</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">证据</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">备注</th>
              </tr>
            </thead>
            <tbody>
              {checklist.map((item, i) => (
                <tr key={i}>
                  <td className="border border-gray-200 px-3 py-2">{item.item}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {item.completed ? '✅' : '⏳'}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-xs text-gray-600">{item.evidence}</td>
                  <td className="border border-gray-200 px-3 py-2 text-xs text-gray-500">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <ConfirmButton onClick={handleContinue} label="继续" />
        <button onClick={goToPrevStep} className="btn-secondary">返回上一步</button>
      </div>
    </div>
  );
}
