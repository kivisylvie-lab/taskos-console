import React, { useEffect, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { api } from '../../utils/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ConfirmButton } from '../shared/ConfirmButton';
import { DataTable } from '../shared/DataTable';

export function Step09_CapabilityDetail() {
  const { state, dispatch } = usePipeline();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'skill' | 'agent' | 'other'>('skill');

  useEffect(() => {
    if (!state.projectId) return;
    setLoading(true);
    api.getCapabilityDetail(state.projectId)
      .then(res => {
        setResult(res.result);
        dispatch({ type: 'SET_STEP_RESULT', step: '09-capability-detail', result: res.result });
        if (res.project) dispatch({ type: 'SET_PROJECT', project: res.project });
      })
      .catch(err => dispatch({ type: 'SET_ERROR', error: `能力详情判断失败: ${err.message}` }))
      .finally(() => setLoading(false));
  }, [state.projectId]);

  const handleContinue = () => dispatch({ type: 'SET_STEP', step: '10-confirm-plan' });

  if (loading) return <LoadingSpinner message="AI 正在进行 5 维度能力打分..." />;

  const skillScores = result?.skillScores || [];
  const agents = result?.agents || [];

  const recLabel = (r: string) => {
    if (r === 'recommended') return { text: '推荐', cls: 'badge-green' };
    if (r === 'candidate') return { text: '候选', cls: 'badge-yellow' };
    return { text: '不建议', cls: 'badge-red' };
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">Step 9: 具体能力判断</h2>
      <p className="text-gray-500 text-sm mb-4">系统完成了 5 维度能力打分和多 Agent/Hook/Tool/MCP 判断</p>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {([
          ['skill', `能力打分 (${skillScores.length})`],
          ['agent', `多 Agent (${result?.multiAgentNeeded ? '需要' : '不需要'})`],
          ['other', 'Hook/Tool/MCP'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Skill Scores */}
      {activeTab === 'skill' && (
        <div>
          <DataTable
            columns={[
              { key: 'capabilityName', label: '能力名称' },
              { key: 'category', label: '分类' },
              { key: 'total', label: '总分', render: (v: number) => (
                <span className={`font-bold ${v >= 8 ? 'text-green-600' : v >= 5 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {v}/10
                </span>
              )},
              { key: 'recommendation', label: '推荐', render: (v: string) => {
                const r = recLabel(v);
                return <span className={`badge ${r.cls}`}>{r.text}</span>;
              }},
              { key: 'reason', label: '原因' },
            ]}
            data={skillScores.slice(0, 10)}
          />
          <p className="text-xs text-gray-400 mt-2">打分维度：场景匹配(0-3) + 输入输出(0-2) + 状态(0-2) + 历史效果(0-2) + 风险(0-1) = 总分 10</p>
        </div>
      )}

      {/* Tab: Multi-Agent */}
      {activeTab === 'agent' && (
        <div>
          <div className="mb-4">
            <span className={`badge ${result?.multiAgentNeeded ? 'badge-yellow' : 'badge-blue'}`}>
              {result?.multiAgentNeeded ? '需要多 Agent' : '不需要多 Agent'}
            </span>
          </div>
          {agents.length > 0 ? (
            <DataTable
              columns={[
                { key: 'role', label: 'Agent 角色' },
                { key: 'purpose', label: '为什么需要' },
                { key: 'inputMaterials', label: '需要输入' },
              ]}
              data={agents}
            />
          ) : (
            <p className="text-sm text-gray-500">当前任务不需要多 Agent 协作</p>
          )}
        </div>
      )}

      {/* Tab: Hook/Tool/MCP */}
      {activeTab === 'other' && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">🔧 Hook</span>
              <span className={`badge ${result?.hookNeeded ? 'badge-yellow' : 'badge-blue'}`}>
                {result?.hookNeeded ? '需要' : '不需要'}
              </span>
            </div>
            {result?.hookTriggers?.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">触发条件：{result.hookTriggers.join(', ')}</p>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">🛠️ Tool</span>
              <span className={`badge ${result?.toolNeeded ? 'badge-yellow' : 'badge-blue'}`}>
                {result?.toolNeeded ? '需要' : '不需要'}
              </span>
            </div>
            {result?.toolsRecommended?.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">推荐工具：{result.toolsRecommended.join(', ')}</p>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">🔌 MCP</span>
              <span className={`badge ${result?.mcpNeeded ? 'badge-yellow' : 'badge-blue'}`}>
                {result?.mcpNeeded ? '需要' : '不需要'}
              </span>
            </div>
            {result?.mcpConnections?.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">MCP 连接：{result.mcpConnections.join(', ')}</p>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">🔍 GitHub 外部搜索</span>
              <span className={`badge ${result?.githubSearchNeeded ? 'badge-yellow' : 'badge-blue'}`}>
                {result?.githubSearchNeeded ? '建议搜索' : '暂不需要'}
              </span>
            </div>
            {result?.githubKeywords?.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">关键词：{result.githubKeywords.join(', ')}</p>
            )}
          </div>
        </div>
      )}

      <ConfirmButton onClick={handleContinue} label="确认能力方案，进入执行方案" />
    </div>
  );
}
