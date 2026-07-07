import React, { useEffect, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { useAIConfig } from '../../store/AIConfigContext';
import { api } from '../../utils/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ConfirmButton } from '../shared/ConfirmButton';

export function Step11_MultiAgentJudge() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const { config: aiConfig } = useAIConfig();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!state.projectId) return;
    setLoading(true);
    // 调用旧 Step09 的能力细节 API（合并了 Skill/Multi-Agent/Hook/Tool/MCP/GitHub 判断）
    api.getCapabilityDetail(state.projectId, aiConfig)
      .then(res => {
        setResult(res.result);
        dispatch({ type: 'SET_STEP_RESULT', step: '11-multi-agent-judge', result: res.result });
        if (res.project) dispatch({ type: 'SET_PROJECT', project: res.project });
      })
      .catch(err => dispatch({ type: 'SET_ERROR', error: `多 Agent 判断失败: ${err.message}` }))
      .finally(() => setLoading(false));
  }, [state.projectId]);

  const handleContinue = () => {
    dispatch({ type: 'SET_STEP', step: '13-confirm-plan' });
  };

  if (loading) return <LoadingSpinner message="AI 正在判断能力方案和多 Agent 需求..." />;

  return (
    <div className="card animate-fade-in-up">
      <h2 className="text-xl font-bold mb-1">Step 11: 多 Agent 需求判断</h2>
      <p className="text-gray-500 text-sm mb-6">
        根据规则 29，判断当前任务是否需要多 Agent 协同，以及需要哪些角色。
      </p>

      {/* 返回上一步 */}
      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

      {/* Multi-Agent 判断 */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">🤖 多 Agent 需求</h3>
        <div className={`p-4 rounded-lg ${result?.multiAgentNeeded ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
          <p className="font-medium text-sm">
            {result?.multiAgentNeeded ? '✅ 需要多 Agent 协同' : '❌ 不需要多 Agent'}
          </p>
          {result?.multiAgentNeeded && (
            <p className="text-xs text-gray-600 mt-1">
              原因：当前任务涉及多角色判断、专业分工或高风险决策。
            </p>
          )}
        </div>

        {result?.agents && result.agents.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">推荐 Agent 角色</p>
            <div className="space-y-2">
              {result.agents.map((agent: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg">🤖</span>
                  <div>
                    <p className="font-medium text-sm">{agent.role}</p>
                    <p className="text-xs text-gray-600">{agent.purpose}</p>
                    <p className="text-xs text-gray-400 mt-1">输入：{agent.inputMaterials}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hook/Tool/MCP 判断 */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">🔧 Hook / Tool / MCP 判断</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className={`p-3 rounded-lg text-center ${result?.hookNeeded ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'}`}>
            <p className="font-medium text-sm">Hook</p>
            <p className="text-xs text-gray-600 mt-1">
              {result?.hookNeeded
                ? `需要 (${result?.hookTriggers?.join(', ')})`
                : '不需要'}
            </p>
          </div>
          <div className={`p-3 rounded-lg text-center ${result?.toolNeeded ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'}`}>
            <p className="font-medium text-sm">Tool</p>
            <p className="text-xs text-gray-600 mt-1">
              {result?.toolNeeded
                ? `推荐: ${result?.toolsRecommended?.join(', ')}`
                : '不需要'}
            </p>
          </div>
          <div className={`p-3 rounded-lg text-center ${result?.mcpNeeded ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'}`}>
            <p className="font-medium text-sm">MCP</p>
            <p className="text-xs text-gray-600 mt-1">
              {result?.mcpNeeded
                ? `需要: ${result?.mcpConnections?.join(', ')}`
                : '不需要'}
            </p>
          </div>
        </div>
      </div>

      {/* 能力评分摘要 */}
      {result?.skillScores && result.skillScores.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">⭐ 能力评分</h3>
          <div className="space-y-2">
            {result.skillScores.filter((s: any) => s.total >= 5).map((score: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-sm">{score.capabilityName}</span>
                  <span className="text-xs text-gray-500 ml-2">{score.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    场景:{score.scores.scene} I/O:{score.scores.io} 状态:{score.scores.status} 历史:{score.scores.history} 风险:{score.scores.risk}
                  </span>
                  <span className={`font-bold text-sm ${score.total >= 8 ? 'text-green-600' : score.total >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {score.total}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <ConfirmButton onClick={handleContinue} label="确认能力方案，继续" />
        <button onClick={goToPrevStep} className="btn-secondary">返回上一步</button>
      </div>
    </div>
  );
}
