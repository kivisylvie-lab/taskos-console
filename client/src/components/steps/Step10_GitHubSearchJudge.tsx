import React from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { ConfirmButton } from '../shared/ConfirmButton';

export function Step10_GitHubSearchJudge() {
  const { state, dispatch, goToPrevStep } = usePipeline();

  const detailResult = state.stepResults['11-multi-agent-judge']; // may be populated from combined step
  const needsGitHubSearch = detailResult?.githubSearchNeeded || false;
  const keywords = detailResult?.githubKeywords || [];

  const handleContinue = () => {
    dispatch({ type: 'SET_STEP', step: '14-execute-generate' });
  };

  return (
    <div className="card animate-fade-in-up">
      <h2 className="text-xl font-bold mb-1">Step 10: GitHub 外部能力搜索判断</h2>
      <p className="text-gray-500 text-sm mb-6">
        根据规则 28.2，当本地能力库无匹配时，必须判断是否需要 GitHub 外部搜索。
      </p>

      {/* 返回上一步 */}
      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

      {needsGitHubSearch ? (
        <div className="space-y-4 mb-6">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700 font-medium">⚠️ 需要 GitHub 外部搜索</p>
            <p className="text-xs text-yellow-600 mt-1">
              本地能力库未找到高匹配能力，建议搜索 GitHub 寻找候选能力。
            </p>
          </div>

          <div>
            <p className="label">建议搜索关键词</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {keywords.map((kw: string, i: number) => (
                <span key={i} className="badge bg-blue-100 text-blue-700">{kw}</span>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">搜索关键词</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">候选能力/仓库</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">类型</th>
                  <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-600">是否适用</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 text-xs" colSpan={4}>
                    <span className="text-gray-400">
                      ⚠️ GitHub 搜索需要配置 gh CLI 或联网搜索 API（当前 MVP 未接入）。
                      <br />建议手动在 github.com 搜索上述关键词，找到候选后返回系统继续。
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg mb-6 text-center">
          <p className="text-green-700 font-medium">✅ 本地能力库已覆盖，无需 GitHub 外部搜索</p>
          <p className="text-sm text-green-600 mt-1">当前任务的本地能力已经足够。</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <ConfirmButton onClick={handleContinue} label="继续" />
        <button onClick={goToPrevStep} className="btn-secondary">返回上一步</button>
      </div>
    </div>
  );
}
