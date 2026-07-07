import React, { useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { ConfirmButton } from '../shared/ConfirmButton';

export function Step14_ExecuteGenerate() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('准备执行...');

  const executionSteps = [
    '验证执行计划完整性',
    '检查必要输入材料',
    '调用 Claude API 生成交付物',
    '写入文件到 output/ 目录',
    '生成 README 和使用说明',
    '生成 AI 能力调用记录',
    '生成项目汇报材料',
  ];

  const handleStartExecution = async () => {
    setStarted(true);

    // 模拟执行进度
    for (let i = 0; i < executionSteps.length; i++) {
      setProgress(Math.round(((i + 1) / executionSteps.length) * 100));
      setStatusText(executionSteps[i]);
      await new Promise(r => setTimeout(r, 600));
    }

    // 完成后进入下一步（实际生成交付物）
    setTimeout(() => {
      dispatch({ type: 'SET_STEP', step: '15-quality-check' });
    }, 500);
  };

  return (
    <div className="card animate-fade-in-up">
      <h2 className="text-xl font-bold mb-1">Step 14: 执行生成</h2>
      <p className="text-gray-500 text-sm mb-6">
        根据确认的方案开始生成交付物。系统将按照计划逐步执行。
      </p>

      {/* 返回上一步 */}
      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

      {!started ? (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">🚀</div>
          <p className="text-gray-700 mb-2 font-medium">准备开始执行</p>
          <p className="text-sm text-gray-500 mb-6">
            系统已确认完整执行方案，共 {executionSteps.length} 个执行步骤。
          </p>
          <div className="flex items-center justify-center gap-3">
            <ConfirmButton
              onClick={handleStartExecution}
              label="开始执行"
              variant="success"
            />
            <button onClick={goToPrevStep} className="btn-secondary">返回上一步</button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-center">
            <p className="text-lg font-medium text-gray-700">{statusText}</p>
            <p className="text-sm text-gray-400">{progress}%</p>
          </div>

          {/* 步骤列表 */}
          <div className="space-y-2">
            {executionSteps.map((step, i) => {
              const stepProgress = Math.round(((i + 1) / executionSteps.length) * 100);
              const isDone = progress >= stepProgress;
              return (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className={isDone ? 'text-green-500' : 'text-gray-300'}>
                    {isDone ? '✅' : '⏳'}
                  </span>
                  <span className={isDone ? 'text-gray-700' : 'text-gray-400'}>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
