import React from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { ConfirmButton } from '../shared/ConfirmButton';

const LOCAL_SOURCES = [
  { name: 'KIVIDAILYLIFE/能力分类/', path: '能力分类/', type: 'Skill 记录' },
  { name: 'KIVIDAILYLIFE/常用Prompt.md', path: '常用Prompt.md', type: 'Prompt 模板' },
  { name: '当前项目 README.md', path: 'projects/kivi-taskos-console/README.md', type: '项目说明' },
  { name: '当前项目 CLAUDE.md', path: 'projects/kivi-taskos-console/CLAUDE.md', type: '项目规则' },
  { name: '当前项目 skills/', path: 'projects/kivi-taskos-console/skills/', type: '本地 Skill' },
  { name: '当前项目 hooks/', path: 'projects/kivi-taskos-console/hooks/', type: '本地 Hook' },
  { name: '当前项目 tools/', path: 'projects/kivi-taskos-console/tools/', type: '本地 Tool' },
  { name: '当前项目 MCP 配置', path: 'projects/kivi-taskos-console/mcp/', type: 'MCP 配置' },
];

export function Step09_LocalCapabilityScan() {
  const { state, dispatch, goToPrevStep } = usePipeline();

  const handleContinue = () => {
    dispatch({ type: 'SET_STEP', step: '10-github-search-judge' });
  };

  return (
    <div className="card animate-fade-in-up">
      <h2 className="text-xl font-bold mb-1">Step 9: 本地能力扫描</h2>
      <p className="text-gray-500 text-sm mb-6">
        根据规则 28.3，每次项目执行前必须扫描以下本地能力来源。
      </p>

      {/* 返回上一步 */}
      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">来源</th>
              <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">路径</th>
              <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">类型</th>
              <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-600">状态</th>
            </tr>
          </thead>
          <tbody>
            {LOCAL_SOURCES.map((source, i) => (
              <tr key={i}>
                <td className="border border-gray-200 px-3 py-2 font-medium">{source.name}</td>
                <td className="border border-gray-200 px-3 py-2 text-xs text-gray-500 font-mono">{source.path}</td>
                <td className="border border-gray-200 px-3 py-2 text-xs">{source.type}</td>
                <td className="border border-gray-200 px-3 py-2 text-center">
                  {source.path.includes('skills/') || source.path.includes('hooks/') || source.path.includes('tools/') || source.path.includes('mcp/')
                    ? <span className="text-yellow-600 text-xs">⚠️ 需创建</span>
                    : <span className="text-green-600">✅ 已就绪</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg mb-4 text-sm text-gray-600">
        <p><strong>说明：</strong>母库规则文件（KIVIDAILYLIFE/）已就绪，但当前项目缺少独立的 Skill/Hook/MCP 目录。</p>
        <p className="mt-1">这意味着系统可以调用母库中的 Prompt 和能力记录，但无法使用项目级自定义 Skill 或 Hook。</p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <ConfirmButton onClick={handleContinue} label="继续" />
        <button onClick={goToPrevStep} className="btn-secondary">返回上一步</button>
      </div>
    </div>
  );
}
