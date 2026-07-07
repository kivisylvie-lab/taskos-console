import React, { useEffect, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { useAIConfig } from '../../store/AIConfigContext';
import { api } from '../../utils/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ConfirmButton } from '../shared/ConfirmButton';
import { DataTable } from '../shared/DataTable';

export function Step10_MultiAgentApproval() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const { config: aiConfig } = useAIConfig();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!state.projectId) return;
    setLoading(true);
    api.getMultiAgentApproval(state.projectId, aiConfig)
      .then(res => {
        setResult(res.result);
        dispatch({ type: 'SET_STEP_RESULT', step: '10-github-search-judge', result: res.result });
        if (res.project) dispatch({ type: 'SET_PROJECT', project: res.project });
      })
      .catch(err => dispatch({ type: 'SET_ERROR', error: `多Agent审批判断失败: ${err.message}` }))
      .finally(() => setLoading(false));
  }, [state.projectId]);

  const handleContinue = () => {
    dispatch({ type: 'SET_STEP', step: '14-execute-generate' });
  };

  if (loading) return <LoadingSpinner message="AI 正在进行多 Agent 审查..." />;

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">Step 11: 人工审批与风险确认</h2>
      <p className="text-gray-500 text-sm mb-6">多专业角色独立审查方案 + 人工审批流程定义</p>

      {/* 返回上一步 */}
      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

      <div className="space-y-4">
        {/* 多 Agent 审查结果 */}
        {result?.agents && result.agents.length > 0 && (
          <div>
            <p className="label">🤖 Agent 审查结果</p>
            {result.agents.map((agent: any, i: number) => (
              <div key={i} className={`p-3 rounded-lg mt-2 border ${agent.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{agent.role} — {agent.agentName}</p>
                  <span className={`badge ${agent.passed ? 'badge-green' : 'badge-red'}`}>
                    {agent.passed ? '✅ 通过' : '❌ 不通过'}
                  </span>
                </div>
                <p className="text-sm mt-1 text-gray-700">{agent.verdict}</p>
                {agent.issuesFound && agent.issuesFound.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">发现问题：</p>
                    <ul className="list-disc list-inside text-sm text-red-700">
                      {agent.issuesFound.map((issue: string, j: number) => (
                        <li key={j}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {agent.suggestions && agent.suggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">建议：</p>
                    <ul className="list-disc list-inside text-sm text-green-700">
                      {agent.suggestions.map((s: string, j: number) => (
                        <li key={j}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 兼容多 Agent 格式 */}
        {!result?.agents && result?.multiAgentNeeded !== undefined && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="font-semibold">
              多 Agent 需求判断: {result.multiAgentNeeded ? '✅ 需要多 Agent' : '✅ 不需要多 Agent'}
            </p>
            {result.agents && result.agents.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">推荐 Agent：</p>
                {result.agents.map((a: any, i: number) => (
                  <span key={i} className="badge badge-purple mr-1">{a.role}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 人工审批步骤 */}
        {result?.humanApprovalSteps && result.humanApprovalSteps.length > 0 && (
          <div>
            <p className="label mt-4">👤 人工审批流程</p>
            <DataTable
              columns={[
                { key: 'step', label: '审批步骤' },
                { key: 'approver', label: '审批人' },
                { key: 'whatToCheck', label: '检查什么' },
                { key: 'whenToEscalate', label: '何时升级' },
              ]}
              data={result.humanApprovalSteps}
            />
          </div>
        )}

        {/* Agent 冲突处理 */}
        {result?.conflicts && result.conflicts.length > 0 && (
          <div>
            <p className="label mt-4">⚠️ Agent 冲突处理</p>
            <DataTable
              columns={[
                { key: 'conflictPoint', label: '冲突点' },
                { key: 'agentAOpinion', label: 'Agent A 意见' },
                { key: 'agentBOpinion', label: 'Agent B 意见' },
                { key: 'resolution', label: '解决方案' },
              ]}
              data={result.conflicts}
            />
          </div>
        )}

        {/* 多 Agent 说明 */}
        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          多 Agent 不是替代 Skill/Hook/MCP，而是与它们协作：Skill 执行固定流程，Agent 代表专业角色做判断，
          Hook 做强制质量检查，MCP 连接外部系统或真实数据。
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <ConfirmButton onClick={handleContinue} label="确认多 Agent 审批方案，继续 →" />
        <button onClick={goToPrevStep} className="btn-secondary">返回上一步</button>
      </div>
    </div>
  );
}
