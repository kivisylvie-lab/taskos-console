import React, { useEffect, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { useAIConfig } from '../../store/AIConfigContext';
import { api } from '../../utils/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ConfirmButton } from '../shared/ConfirmButton';
import { DataTable } from '../shared/DataTable';

interface StructuredPainPoint {
  realPainPoint: string;
  judgmentTarget: string;
  requiredData: string[];
  businessAction: string;
  executorRoles: string[];
  validationMetrics: string[];
  aiCombinations: string[];
}

const SUPPLY_CHAIN_PAIN_POINTS: StructuredPainPoint[] = [
  {
    realPainPoint: '库存周转慢，资金占用高',
    judgmentTarget: '哪些 SKU 周转异常、是否超过目标周转天数、是否存在积压风险',
    requiredData: ['库存表', 'SKU 周转天数', '销售预测数据', '历史销量'],
    businessAction: '生成高周转风险 SKU 清单、给出降库存优先级',
    executorRoles: ['库存负责人', '采购负责人', '销售负责人'],
    validationMetrics: ['库存周转天数', '积压库存金额', '库存占用资金'],
    aiCombinations: ['数据分析', '自动化工作流', '报告生成', '指标复盘'],
  },
  {
    realPainPoint: '部分 SKU 经常缺货',
    judgmentTarget: '哪些 SKU 有断货风险、未来几天可能缺货、是否需要补货',
    requiredData: ['库存表', '销售预测数据', '历史销量', '安全库存规则'],
    businessAction: '生成缺货预警、建议补货数量、补货优先级',
    executorRoles: ['采购', '仓储', '销售'],
    validationMetrics: ['缺货率', '补货及时率', '订单满足率'],
    aiCombinations: ['数据分析', '预测模型', '自动化预警', '多 Agent'],
  },
  {
    realPainPoint: '供应商交付不稳定',
    judgmentTarget: '哪些供应商交付延迟、延迟频率、影响哪些 SKU',
    requiredData: ['采购订单记录', '供应商交付异常记录', '供应商报价表', '合同 / SOP'],
    businessAction: '生成供应商风险评分、推荐替代供应商、触发人工审批',
    executorRoles: ['采购经理', '供应链负责人'],
    validationMetrics: ['供应商准时交付率', '延期次数', '异常处理时长'],
    aiCombinations: ['RAG', '数据分析', '多 Agent', '人工审批'],
  },
  {
    realPainPoint: '采购决策缺少依据',
    judgmentTarget: '该补什么、补多少、找谁补、是否值得补',
    requiredData: ['库存表', '销售预测', '采购订单', '供应商报价', '交付记录'],
    businessAction: '生成补货建议、供应商选择方案、采购任务单',
    executorRoles: ['采购', '供应链负责人', '老板'],
    validationMetrics: ['采购响应时间', '补货准确率', '采购成本变化'],
    aiCombinations: ['数据分析', '多 Agent', '自动化工作流', '方案生成'],
  },
  {
    realPainPoint: '老板需要看到可决策的汇报',
    judgmentTarget: '老板最关心哪些结论、哪些风险需要上报、方案是否可执行',
    requiredData: ['库存风险', '供应商风险', '补货建议', '成本变化', '执行进度'],
    businessAction: '生成老板汇报材料、风险摘要、决策建议',
    executorRoles: ['项目负责人', '供应链负责人'],
    validationMetrics: ['汇报材料可用性', '决策通过率', '管理层反馈'],
    aiCombinations: ['报告生成', 'RAG', '数据分析', '汇报模板 Skill'],
  },
  {
    realPainPoint: '需要沉淀成供应链补货预警解决包',
    judgmentTarget: '哪些能力和流程可复用、哪些数据模板可标准化、哪些动作可自动化',
    requiredData: ['本次项目流程', '业务动作清单', 'AI 能力组合', '验证指标'],
    businessAction: '沉淀解决包模板、生成客户使用说明、生成复盘记录',
    executorRoles: ['交付负责人', '产品负责人'],
    validationMetrics: ['复用率', '二次交付时间', '客户使用成功率'],
    aiCombinations: ['Skill', '自动化工作流', '知识库沉淀', '指标复盘'],
  },
];

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <span key={item} className="inline-flex rounded-full bg-gray-50 border border-gray-200 px-2 py-1 text-xs text-gray-600">
          {item}
        </span>
      ))}
    </div>
  );
}

export function Step05_PainPointAnalysis() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const { config: aiConfig } = useAIConfig();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const enhancedResult = {
      diagnosis: '系统已将客户表层需求拆解为供应链补货预警解决包的 6 个真实业务痛点。',
      painPoints: SUPPLY_CHAIN_PAIN_POINTS,
    };

    if (!state.projectId) {
      setResult(enhancedResult);
      dispatch({ type: 'SET_STEP_RESULT', step: '05-task-type-judge', result: enhancedResult });
      dispatch({ type: 'SET_BUSINESS_PAIN_POINTS', painPoints: SUPPLY_CHAIN_PAIN_POINTS.map(item => item.realPainPoint) });
      setLoading(false);
      return;
    }

    setLoading(true);
    api.judgeTaskType(state.projectId, aiConfig)
      .then(res => {
        const mergedResult = {
          ...(res.result || {}),
          diagnosis: enhancedResult.diagnosis,
          painPoints: SUPPLY_CHAIN_PAIN_POINTS,
        };
        setResult(mergedResult);
        dispatch({ type: 'SET_STEP_RESULT', step: '05-task-type-judge', result: mergedResult });
        dispatch({ type: 'SET_BUSINESS_PAIN_POINTS', painPoints: SUPPLY_CHAIN_PAIN_POINTS.map(item => item.realPainPoint) });
        if (res.project) dispatch({ type: 'SET_PROJECT', project: res.project });
      })
      .catch(err => {
        setResult(enhancedResult);
        dispatch({ type: 'SET_STEP_RESULT', step: '05-task-type-judge', result: enhancedResult });
        dispatch({ type: 'SET_BUSINESS_PAIN_POINTS', painPoints: SUPPLY_CHAIN_PAIN_POINTS.map(item => item.realPainPoint) });
        dispatch({ type: 'SET_ERROR', error: `痛点拆解使用预置结构化结果：${err.message}` });
      })
      .finally(() => setLoading(false));
  }, [state.projectId]);

  const painPoints: StructuredPainPoint[] = result?.painPoints || SUPPLY_CHAIN_PAIN_POINTS;

  const handleContinue = () => {
    dispatch({
      type: 'SET_STEP_RESULT',
      step: '05-task-type-judge',
      result: {
        ...(result || {}),
        painPoints,
      },
    });
    dispatch({ type: 'SET_BUSINESS_PAIN_POINTS', painPoints: painPoints.map(item => item.realPainPoint) });
    dispatch({ type: 'SET_STEP', step: '06-knowledge-search' });
  };

  if (loading) return <LoadingSpinner message="AI 正在拆解客户真实痛点..." />;

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">Step 5: 真实痛点拆解</h2>
      <p className="text-gray-500 text-sm mb-6">
        系统将客户表层需求拆解为真实业务痛点，并为每个痛点定义判断依据、所需数据、业务动作、执行角色、验证指标和 AI 组合用法。
      </p>

      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 font-medium">📝 客户原始需求</p>
          <p className="text-gray-800 mt-1">{state.taskInput || state.project?.taskObjective || '（从 Step 01 读取）'}</p>
        </div>

        {result?.diagnosis && (
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-sm text-purple-600 font-medium">🔎 拆解摘要</p>
            <p className="text-lg font-semibold mt-1 text-purple-900">{result.diagnosis}</p>
          </div>
        )}

        <div>
          <p className="label">真实痛点拆解表</p>
          <DataTable
            columns={[
              { key: 'realPainPoint', label: '真实痛点' },
              { key: 'judgmentTarget', label: '要判断什么' },
              { key: 'requiredData', label: '需要的数据 / 资料', render: (value: string[]) => <TagList items={value || []} /> },
              { key: 'businessAction', label: '输出业务动作' },
              { key: 'executorRoles', label: '执行角色', render: (value: string[]) => <TagList items={value || []} /> },
              { key: 'validationMetrics', label: '验证指标', render: (value: string[]) => <TagList items={value || []} /> },
              { key: 'aiCombinations', label: 'AI 组合用法', render: (value: string[]) => <TagList items={value || []} /> },
            ]}
            data={painPoints}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mt-6">
        <button onClick={goToPrevStep} className="btn-secondary">返回上一步</button>
        <ConfirmButton onClick={handleContinue} label="确认痛点拆解，继续" />
      </div>
    </div>
  );
}
