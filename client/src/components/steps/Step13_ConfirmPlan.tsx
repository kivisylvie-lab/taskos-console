import React, { useEffect, useMemo, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { useAIConfig } from '../../store/AIConfigContext';
import { api } from '../../utils/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ConfirmButton } from '../shared/ConfirmButton';

function getSelectedCapabilities(step8Result: any) {
  const selections = Array.isArray(step8Result?.abilitySelections) ? step8Result.abilitySelections : [];
  const selectedFromSelections = selections.flatMap((selection: any) =>
    selection.selectedPlan?.length
      ? selection.selectedPlan
      : selection.selectedCapabilities || []
  );

  if (selectedFromSelections.length > 0) return selectedFromSelections;

  const plans = Array.isArray(step8Result?.capabilityAssemblyPlan) ? step8Result.capabilityAssemblyPlan : [];
  const selectedFromPlans = plans.flatMap((plan: any) =>
    plan.selectedPlan?.length
      ? plan.selectedPlan
      : plan.finalRecommendedCapabilities || []
  );

  if (selectedFromPlans.length > 0) return selectedFromPlans;
  return Array.isArray(step8Result?.finalRecommendedCapabilities) ? step8Result.finalRecommendedCapabilities : [];
}

function getInvocationMode(capability: any) {
  const status = capability.installStatus || capability.executionStatus || capability.status || '';
  if (status.includes('已选用') || status.includes('已真实安装')) return '真实调用';
  if (status.includes('已保存')) return 'Demo 模拟';
  if (status.includes('待安装')) return '待安装';
  if (status.includes('待接入')) return '待接入';
  if (status.includes('待用户确认') || status.includes('需用户确认') || status.includes('需人工审批')) return '需人工确认';
  if (capability.sourceType === '系统创建') return 'Demo 模拟';
  if (['GitHub', 'OpenClawAI', 'Claude Skill 社区', 'MCP Server 市场', '开源插件库', '工具官网'].includes(capability.sourceType)) return '需人工确认';
  return 'Demo 模拟';
}

function getRiskFallback(capability: any, action: any) {
  const risk = capability.riskLevel || capability.risk || '风险可控';
  if (getInvocationMode(capability) === '需人工确认') {
    return `${risk}；失败回退：暂不自动安装 / 接入，改用系统创建 Prompt 或人工执行「${action.actionName}」。`;
  }
  if (getInvocationMode(capability) === '待安装' || getInvocationMode(capability) === '待接入') {
    return `${risk}；失败回退：保留待安装状态，先用 Demo 模拟输出并进入人工确认。`;
  }
  return `${risk}；失败回退：调用失败时切换为人工处理或系统创建基础 Prompt。`;
}

function matchesAction(capability: any, action: any) {
  const relatedPainPoints = capability.relatedPainPoints || capability.matchedPainPoints || [];
  const text = `${capability.aiUsage || ''} ${capability.usageLocation || ''} ${capability.matchedPainPoint || ''} ${capability.purpose || ''}`;
  return relatedPainPoints.includes(action.painPoint) || text.includes(action.painPoint) || text.includes(action.actionName);
}

function buildToolExecutionPlan(capabilities: any[], businessActions: any[]) {
  const safeCapabilities = capabilities.length > 0 ? capabilities : [];

  return businessActions.flatMap((action: any, actionIndex: number) => {
    const matchedCapabilities = safeCapabilities.filter(capability => matchesAction(capability, action));
    const capabilitiesForAction = matchedCapabilities.length > 0 ? matchedCapabilities : safeCapabilities.slice(0, 1);

    if (capabilitiesForAction.length === 0) {
      return [{
        id: `tool-plan-${action.id || actionIndex + 1}-manual`,
        order: actionIndex + 1,
        businessAction: action.actionName,
        capabilityName: '待系统创建基础 Prompt / Agent / Hook',
        capabilityType: 'Prompt / Agent / Hook',
        sourceType: '系统创建',
        invocationMode: 'Demo 模拟',
        inputData: action.triggerCondition || action.painPoint || '业务动作上下文',
        outputResult: action.outputResult || action.output || '业务动作执行结果',
        riskFallback: `暂无可用能力；失败回退：返回 Step 8 生成系统创建能力，或由人工执行「${action.actionName}」。`,
      }];
    }

    return capabilitiesForAction.map((capability: any, capabilityIndex: number) => ({
      id: `tool-plan-${action.id || actionIndex + 1}-${capability.id || capabilityIndex + 1}`,
      order: actionIndex + 1,
      businessAction: action.actionName,
      capabilityName: capability.name,
      capabilityType: capability.capabilityType,
      sourceType: capability.sourceType || capability.sourcePlatform || capability.platform || '未知来源',
      invocationMode: getInvocationMode(capability),
      inputData: capability.input || action.triggerCondition || action.painPoint || '业务动作上下文',
      outputResult: capability.output || action.outputResult || action.output || '工具调用结果',
      riskFallback: getRiskFallback(capability, action),
    }));
  });
}

export function Step13_ConfirmPlan() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const { config: aiConfig } = useAIConfig();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const isBusinessSolutionMode = state.project?.sceneType === 'business-solution';
  const step8Result = state.stepResults?.['08-capability-precheck'];
  const step9Result = state.stepResults?.['11-multi-agent-judge'];
  const existingStep10Result = state.stepResults?.['10-github-search-judge'];

  const capabilityAssemblyPlan = useMemo(
    () => Array.isArray(step8Result?.capabilityAssemblyPlan) ? step8Result.capabilityAssemblyPlan : [],
    [step8Result]
  );
  const selectedCapabilities = useMemo(() => getSelectedCapabilities(step8Result), [step8Result]);
  const businessActions = useMemo(
    () => (Array.isArray(step9Result?.businessActions) ? step9Result.businessActions : step9Result?.actions || []).filter((action: any) => action.enabled !== false),
    [step9Result]
  );
  const toolExecutionPlan = useMemo(
    () => existingStep10Result?.toolExecutionPlan || buildToolExecutionPlan(selectedCapabilities, businessActions),
    [existingStep10Result, selectedCapabilities, businessActions]
  );

  useEffect(() => {
    if (isBusinessSolutionMode) {
      setLoading(false);
      return;
    }
    if (!state.projectId) return;
    setLoading(true);
    api.confirmPlan(state.projectId, aiConfig)
      .then(res => {
        setResult(res.result);
        dispatch({ type: 'SET_STEP_RESULT', step: '13-confirm-plan', result: res.result });
        if (res.project) dispatch({ type: 'SET_PROJECT', project: res.project });
      })
      .catch(err => dispatch({ type: 'SET_ERROR', error: `方案确认失败: ${err.message}` }))
      .finally(() => setLoading(false));
  }, [state.projectId, isBusinessSolutionMode]);

  useEffect(() => {
    if (!isBusinessSolutionMode || businessActions.length === 0) return;
    const nextResult = {
      capabilityAssemblyPlan,
      finalRecommendedCapabilities: step8Result?.finalRecommendedCapabilities || selectedCapabilities,
      abilitySelections: step8Result?.abilitySelections || [],
      businessActions,
      toolExecutionPlan,
      generatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'SET_STEP_RESULT', step: '10-github-search-judge', result: nextResult });
  }, [isBusinessSolutionMode, businessActions.length, capabilityAssemblyPlan, selectedCapabilities, toolExecutionPlan]);

  const handleExecute = () => {
    dispatch({ type: 'SET_STEP', step: isBusinessSolutionMode ? '14-execute-generate' : '10-github-search-judge' });
  };

  if (loading) return <LoadingSpinner message="正在汇总完整执行方案..." />;

  if (isBusinessSolutionMode) {
    if (capabilityAssemblyPlan.length === 0 && selectedCapabilities.length === 0) {
      return (
        <div className="card text-center py-10">
          <h2 className="text-xl font-bold mb-2">Step 10: 工具调用计划 / 自动化流程配置</h2>
          <p className="text-gray-500 mb-5">当前暂无能力装配数据，请返回 Step 8 完成 AI 能力装配与工具选择。</p>
          <button type="button" onClick={() => dispatch({ type: 'SET_STEP', step: '08-capability-precheck' })} className="btn-primary-uniform">
            返回 Step 8
          </button>
        </div>
      );
    }

    if (businessActions.length === 0) {
      return (
        <div className="card text-center py-10">
          <h2 className="text-xl font-bold mb-2">Step 10: 工具调用计划 / 自动化流程配置</h2>
          <p className="text-gray-500 mb-5">当前暂无业务动作数据，请返回 Step 9 完成业务动作定义。</p>
          <button type="button" onClick={() => dispatch({ type: 'SET_STEP', step: '11-multi-agent-judge' })} className="btn-primary-uniform">
            返回 Step 9
          </button>
        </div>
      );
    }

    return (
      <div className="card animate-fade-in-up">
        <h2 className="text-xl font-bold mb-1">Step 10: 工具调用计划 / 自动化流程配置</h2>
        <p className="text-gray-500 text-sm mb-6">
          系统根据 Step 8 的能力装配结果和 Step 9 的业务动作，自动生成工具 / Plugin / Skill / MCP / Agent / Hook / Workflow 调用计划。
        </p>

        <button
          onClick={goToPrevStep}
          className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
        >
          ← 返回上一步
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-500">已确认能力</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{selectedCapabilities.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-500">业务动作</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{businessActions.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-500">工具调用计划</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{toolExecutionPlan.length}</p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">已确认能力</h3>
          <div className="flex flex-wrap gap-2">
            {selectedCapabilities.map((capability: any) => (
              <span key={capability.id || capability.name} className="text-xs rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-blue-700">
                {capability.name} · {capability.capabilityType} · {getInvocationMode(capability)}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 mb-5">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">执行顺序</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">业务动作</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">工具 / 能力</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">调用方式</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">输入数据</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">输出结果</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">风险与失败回退</th>
              </tr>
            </thead>
            <tbody>
              {toolExecutionPlan.map((item: any) => (
                <tr key={item.id}>
                  <td className="border border-gray-200 px-3 py-2 font-semibold text-blue-700">{item.order}</td>
                  <td className="border border-gray-200 px-3 py-2">{item.businessAction}</td>
                  <td className="border border-gray-200 px-3 py-2">
                    <p className="font-medium text-gray-800">{item.capabilityName}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.capabilityType} / {item.sourceType}</p>
                  </td>
                  <td className="border border-gray-200 px-3 py-2">{item.invocationMode}</td>
                  <td className="border border-gray-200 px-3 py-2 text-gray-600">{item.inputData}</td>
                  <td className="border border-gray-200 px-3 py-2 text-gray-600">{item.outputResult}</td>
                  <td className="border border-gray-200 px-3 py-2 text-gray-600">{item.riskFallback}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-4 text-sm text-blue-700">
          已根据能力装配结果自动生成 toolExecutionPlan。外部能力保持待确认状态，不会在本步骤自动安装或接入。
        </div>

        <div className="flex items-center justify-center gap-3">
          <ConfirmButton onClick={handleExecute} label="确认工具调用计划，继续 →" variant="success" />
          <button onClick={goToPrevStep} className="btn-secondary">返回 Step 9</button>
        </div>
      </div>
    );
  }

  const plan = result?.plan;
  if (!plan) return <div className="card text-center py-8 text-gray-400">无方案数据</div>;

  const sections = [
    { key: 'goal', title: '🎯 任务目标', content: plan.goal },
    { key: 'taskType', title: '🔍 任务诊断', content: plan.taskType?.diagnosis },
    { key: 'deliveries', title: '📋 交付物清单', content: `${plan.deliveries?.deliveries?.length || 0} 个交付物` },
    { key: 'capabilities', title: '⚡ 能力路由', content: `${plan.capabilityRoute?.routingTable?.length || 0} 步路由` },
    { key: 'risks', title: '⚠️ 风险评估', content: `${plan.risks?.length || 0} 项风险` },
    { key: 'claudeCannotDo', title: '🚫 AI 无法完成', content: `${plan.claudeCannotDo?.length || 0} 项需人工` },
  ];

  return (
    <div className="card animate-fade-in-up">
      <h2 className="text-xl font-bold mb-1">⭐ Step 10: 工具调用计划 / 自动化流程配置</h2>
      <p className="text-gray-500 text-sm mb-6">
        这是关键确认点。请在执行前仔细审核完整方案。
      </p>

      {/* 返回上一步 */}
      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

      <div className="space-y-2 mb-6">
        {sections.map(s => (
          <div key={s.key} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setExpanded(expanded === s.key ? null : s.key)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="font-medium text-sm">{s.title}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{s.content}</span>
                <span className="text-gray-400">{expanded === s.key ? '▾' : '▸'}</span>
              </span>
            </button>
            {expanded === s.key && (
              <div className="px-4 pb-3 text-sm text-gray-600 border-t border-gray-100 pt-2">
                {s.key === 'risks' && plan.risks ? (
                  <ul className="space-y-1">
                    {plan.risks.map((r: any, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={r.probability === 'high' ? 'text-red-500' : r.probability === 'medium' ? 'text-yellow-500' : 'text-gray-400'}>●</span>
                        <span>{r.risk} — {r.mitigation}</span>
                      </li>
                    ))}
                  </ul>
                ) : s.key === 'claudeCannotDo' && plan.claudeCannotDo ? (
                  <ul className="list-disc pl-4 space-y-1">
                    {plan.claudeCannotDo.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(plan[s.key], null, 2)}</pre>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
        <p className="text-sm text-yellow-700 font-medium">⚠️ 重要提醒</p>
        <ul className="text-xs text-yellow-600 mt-1 space-y-1">
          <li>• 确认后将调用 Claude API 生成交付物（可能产生 API 费用）</li>
          <li>• 生成的交付物为 AI 初稿，建议人工审阅修改</li>
          <li>• 部分功能为 Demo 模拟状态</li>
        </ul>
      </div>

      <div className="flex items-center justify-center gap-3">
        <ConfirmButton
          onClick={handleExecute}
          label="✅ 确认并进入执行阶段"
          variant="success"
        />
        <button onClick={goToPrevStep} className="btn-secondary">返回上一步</button>
      </div>
    </div>
  );
}
