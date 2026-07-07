import React from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { ConfirmButton } from '../shared/ConfirmButton';

const QUALITY_CHECKS = [
  { item: '交付物是否完整生成', standard: '所有必须交付物已生成', weight: '必须' },
  { item: '是否区分真实执行和 Demo 模拟', standard: 'README 中已标注', weight: '必须' },
  { item: '是否说明未使用某些能力的原因', standard: '能力调用记录中已说明', weight: '必须' },
  { item: '是否正确标注 AI 生成内容', standard: '生成文件包含 AI 标注', weight: '建议' },
  { item: '是否包含 Hook 质量检查清单', standard: '如有 Hook 相关产出', weight: '建议' },
  { item: '是否有风险提示和安全说明', standard: '高风险操作已标注', weight: '建议' },
  { item: 'README 是否记录能力使用', standard: '包含 AI 能力使用说明表', weight: '必须' },
  { item: '是否生成了 AI能力调用记录.md', standard: '文件存在于 output/ 目录', weight: '必须' },
  { item: '交付物是否可直接使用', standard: '不需要额外解析或转换', weight: '建议' },
  { item: '是否正确标注项目边界', standard: 'Demo vs 商用明确区分', weight: '必须' },
];

export function Step15_QualityCheck() {
  const { state, dispatch, goToPrevStep } = usePipeline();

  const handleContinue = () => {
    dispatch({ type: 'SET_STEP', step: '16-generate-deliverables' });
  };

  return (
    <div className="card animate-fade-in-up">
      <h2 className="text-xl font-bold mb-1">Step 15: 质量检查</h2>
      <p className="text-gray-500 text-sm mb-6">
        Hook 质量门禁 — 根据规则 28.8 验收标准，检查交付物质量。
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
              <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">检查项</th>
              <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">标准</th>
              <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-600">权重</th>
              <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-600">状态</th>
            </tr>
          </thead>
          <tbody>
            {QUALITY_CHECKS.map((check, i) => (
              <tr key={i}>
                <td className="border border-gray-200 px-3 py-2">{check.item}</td>
                <td className="border border-gray-200 px-3 py-2 text-xs text-gray-600">{check.standard}</td>
                <td className="border border-gray-200 px-3 py-2 text-center">
                  <span className={`badge ${check.weight === '必须' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {check.weight}
                  </span>
                </td>
                <td className="border border-gray-200 px-3 py-2 text-center">
                  <span className="text-yellow-500">⏳ 待验证</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
        <p className="text-sm text-yellow-700 font-medium">⚠️ 当前为 Demo 模式</p>
        <p className="text-xs text-yellow-600 mt-1">
          质量检查项目在实际生成交付物后会自动验证。当前 Demo 中，所有检查项均标注为"待验证"。
          在真实项目执行中，系统会在生成交付物后自动运行这些检查。
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <ConfirmButton onClick={handleContinue} label="确认检查，进入交付物" />
        <button onClick={goToPrevStep} className="btn-secondary">返回上一步</button>
      </div>
    </div>
  );
}
