import React from 'react';
import { PipelineProvider, usePipeline } from './store/PipelineContext';
import { AIConfigProvider } from './store/AIConfigContext';
import { Layout } from './components/Layout';

// 输入阶段
import { Step01_TaskInput } from './components/steps/Step01_TaskInput';
import { Step02_SceneMatch } from './components/steps/Step02_SceneMatch';
import { Step03_SupplementaryInfo } from './components/steps/Step03_SupplementaryInfo';
import { Step04_ProjectSetup } from './components/steps/Step04_ProjectSetup';

// 判断阶段 — 默认模式
import { Step05_TaskTypeJudge } from './components/steps/Step05_TaskTypeJudge';
import { Step06_KnowledgeSearch } from './components/steps/Step06_KnowledgeSearch';
import { Step07_DeliveryType } from './components/steps/Step07_DeliveryType';
import { Step08_CapabilityPrecheck } from './components/steps/Step08_CapabilityPrecheck';
import { Step10_GitHubSearchJudge } from './components/steps/Step10_GitHubSearchJudge';
import { Step11_MultiAgentJudge } from './components/steps/Step11_MultiAgentJudge';
import { Step13_ConfirmPlan } from './components/steps/Step13_ConfirmPlan';

// 判断阶段 — 客户解决包模式 (Business Solution Mode)
import { Step05_PainPointAnalysis } from './components/steps/Step05_PainPointAnalysis';
import { Step07_BusinessActionDef } from './components/steps/Step07_BusinessActionDef';
import { Step08_AICombinationPlan } from './components/steps/Step08_AICombinationPlan';

// 执行阶段 — 默认模式
import { Step14_ExecuteGenerate } from './components/steps/Step14_ExecuteGenerate';
import { Step15_QualityCheck } from './components/steps/Step15_QualityCheck';
import { Step16_GenerateDeliverables } from './components/steps/Step16_GenerateDeliverables';
import { Step17_CallRecordMaterials } from './components/steps/Step17_CallRecordMaterials';
import { Step18_AssessmentDeposit } from './components/steps/Step18_AssessmentDeposit';

// 执行阶段 — 客户解决包模式 (Business Solution Mode)
import { Step14_SolutionPackageGen } from './components/steps/Step14_SolutionPackageGen';
import { Step15_ClientUsageGuide } from './components/steps/Step15_ClientUsageGuide';
import { Step18_MetricsValidation } from './components/steps/Step18_MetricsValidation';

function StepRenderer() {
  const { state } = usePipeline();
  const isBS = state.project?.sceneType === 'business-solution';

  switch (state.currentStep) {
    // 输入阶段 — 共用组件（内部条件渲染）
    case '01-task-input':
      return <Step01_TaskInput />;
    case '02-scene-match':
      return <Step02_SceneMatch />;
    case '03-supplementary-info':
      return <Step03_SupplementaryInfo />;
    case '04-project-setup':
      return <Step04_ProjectSetup />;

    // 判断阶段 — 条件路由
    case '05-task-type-judge':
      return isBS ? <Step05_PainPointAnalysis /> : <Step05_TaskTypeJudge />;
    case '06-knowledge-search':
      return <Step06_KnowledgeSearch />;
    case '07-delivery-type':
      return <Step07_DeliveryType />;
    case '08-capability-precheck':
      return isBS ? <Step08_AICombinationPlan /> : <Step08_CapabilityPrecheck />;
    case '09-local-capability-scan':
      return isBS ? <Step07_BusinessActionDef /> : <Step11_MultiAgentJudge />;
    case '10-github-search-judge':
      return isBS ? <Step13_ConfirmPlan /> : <Step10_GitHubSearchJudge />;
    case '11-multi-agent-judge':
      return isBS ? <Step07_BusinessActionDef /> : <Step11_MultiAgentJudge />;
    case '12-capability-route':
      return <Step13_ConfirmPlan />;
    case '13-confirm-plan':
      return <Step13_ConfirmPlan />;

    // 执行阶段 — 条件路由
    case '14-execute-generate':
      return isBS ? <Step14_SolutionPackageGen /> : <Step14_ExecuteGenerate />;
    case '15-quality-check':
      return isBS ? <Step15_ClientUsageGuide /> : <Step15_QualityCheck />;
    case '16-generate-deliverables':
      return <Step16_GenerateDeliverables />;
    case '17-call-record-materials':
      return <Step17_CallRecordMaterials />;
    case '18-assessment-deposit':
      return isBS ? <Step18_MetricsValidation /> : <Step18_AssessmentDeposit />;

    default:
      return <Step01_TaskInput />;
  }
}

function App() {
  return (
    <AIConfigProvider>
      <PipelineProvider>
        <Layout>
          <StepRenderer />
        </Layout>
      </PipelineProvider>
    </AIConfigProvider>
  );
}

export default App;
