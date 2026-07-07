import React, { useEffect, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { useAIConfig } from '../../store/AIConfigContext';
import { api } from '../../utils/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ConfirmButton } from '../shared/ConfirmButton';
import { DataTable } from '../shared/DataTable';

export function Step14_SolutionPackageGen() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const { config: aiConfig } = useAIConfig();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!state.projectId) return;
    setLoading(true);

    // 模拟进度动画
    const steps = ['生成解决包方案...', '封装业务模块...', '编排能力组合...', '生成使用说明框架...', '完成封装'];
    let i = 0;
    const timer = setInterval(() => {
      if (i < steps.length) {
        setProgress(((i + 1) / steps.length) * 100);
        i++;
      }
    }, 600);

    api.getSolutionPackage(state.projectId, aiConfig)
      .then(res => {
        setResult(res.result);
        dispatch({ type: 'SET_STEP_RESULT', step: '14-execute-generate', result: res.result });
        if (res.project) dispatch({ type: 'SET_PROJECT', project: res.project });
      })
      .catch(err => dispatch({ type: 'SET_ERROR', error: `解决包生成失败: ${err.message}` }))
      .finally(() => {
        clearInterval(timer);
        setProgress(100);
        setLoading(false);
      });
  }, [state.projectId]);

  const handleContinue = () => {
    dispatch({ type: 'SET_STEP', step: '15-quality-check' });
  };

  if (loading) return (
    <LoadingSpinner
      message={`正在封装客户解决包... ${Math.round(progress)}%`}
    />
  );

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">Step 14: 解决包生成</h2>
      <p className="text-gray-500 text-sm mb-6">封装完整解决包——不只是文档，是客户能直接使用的业务应用</p>

      {/* 返回上一步 */}
      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

      <div className="space-y-4">
        {/* 解决包概览 */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-600 font-medium">📦 解决包已生成</p>
          <p className="text-lg font-semibold mt-1">{result?.plan?.goal || state.project?.name || '客户业务解决包'}</p>
          {result?.plan?.confirmed && <span className="badge badge-green mt-1">✅ 已确认</span>}
        </div>

        {/* 解决包模块 */}
        {result?.modules && result.modules.length > 0 && (
          <div>
            <p className="label">解决包模块清单</p>
            <DataTable
              columns={[
                { key: 'name', label: '模块名称' },
                { key: 'clientUsage', label: '客户使用方式' },
                { key: 'input', label: '输入' },
                { key: 'output', label: '输出' },
                { key: 'responsibleRole', label: '负责角色' },
                { key: 'acceptanceCriteria', label: '验收标准' },
              ]}
              data={result.modules}
            />
          </div>
        )}

        {/* 解决包内容预览 */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 font-medium mb-2">📋 解决包默认包含</p>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
            <span>✅ Web 页面 / 系统 Demo</span>
            <span>✅ 表格模板 / 数据模板</span>
            <span>✅ 自动化工作流</span>
            <span>✅ 知识库 / SOP</span>
            <span>✅ 报告模板</span>
            <span>✅ 提醒 / 预警机制</span>
            <span>✅ 人工审批流程</span>
            <span>✅ 指标看板</span>
            <span>✅ 使用说明</span>
            <span>✅ 管理层汇报材料</span>
            <span>✅ AI 能力调用记录</span>
            <span>✅ 风险与回退方案</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <ConfirmButton onClick={handleContinue} label="确认解决包，继续 →" />
        <button onClick={goToPrevStep} className="btn-secondary">返回上一步</button>
      </div>
    </div>
  );
}
