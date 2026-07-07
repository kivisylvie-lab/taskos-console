import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { PipelineStep, Project, SupplementaryInfo } from '../types/pipeline';
import { DEFAULT_SUPPLEMENTARY_INFO, getPipelineSteps } from '../types/pipeline';
import type { ScenarioMatchSuggestion } from '../data/scenarioMatcher';

// ---- State ----
interface PipelineState {
  projectId: string | null;
  project: Project | null;
  currentStep: PipelineStep;
  error: string | null;
  loading: boolean;
  stepResults: Record<string, any>;
  // Step 01 输入暂存（创建项目前暂存）
  taskInput: string;
  uploadedFiles: File[];
  inputURLs: string[];
  supplementaryInfo: SupplementaryInfo;
  // 场景匹配暂存
  selectedScene: ScenarioMatchSuggestion | null;
  confirmedScene: boolean;
  // Demo Mode
  demoMode: boolean;
  // 客户解决包模式专用字段
  solutionPackageName: string;
  businessPainPoints: string[];
  confirmedActions: string[];
  selectedCapabilities: string[];
}

const initialState: PipelineState = {
  projectId: null,
  project: null,
  currentStep: '01-task-input',
  error: null,
  loading: false,
  stepResults: {},
  taskInput: '',
  uploadedFiles: [],
  inputURLs: [],
  supplementaryInfo: DEFAULT_SUPPLEMENTARY_INFO,
  selectedScene: null,
  confirmedScene: false,
  demoMode: false,
  solutionPackageName: '',
  businessPainPoints: [],
  confirmedActions: [],
  selectedCapabilities: [],
};

// ---- Actions ----
type PipelineAction =
  | { type: 'SET_PROJECT'; project: Project }
  | { type: 'SET_STEP'; step: PipelineStep }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_STEP_RESULT'; step: PipelineStep; result: any }
  | { type: 'SET_TASK_INPUT'; taskInput: string }
  | { type: 'SET_UPLOADED_FILES'; files: File[] }
  | { type: 'ADD_UPLOADED_FILES'; files: File[] }
  | { type: 'REMOVE_UPLOADED_FILE'; index: number }
  | { type: 'SET_INPUT_URLS'; urls: string[] }
  | { type: 'SET_SUPPLEMENTARY_INFO'; info: Partial<SupplementaryInfo> }
  | { type: 'SELECT_SCENE'; scene: ScenarioMatchSuggestion | null }
  | { type: 'CONFIRM_SCENE' }
  | { type: 'SET_DEMO_MODE'; demoMode: boolean }
  | { type: 'SET_SOLUTION_PACKAGE_NAME'; name: string }
  | { type: 'SET_BUSINESS_PAIN_POINTS'; painPoints: string[] }
  | { type: 'SET_CONFIRMED_ACTIONS'; actions: string[] }
  | { type: 'SET_SELECTED_CAPABILITIES'; capabilities: string[] }
  | { type: 'RESET' };

function pipelineReducer(state: PipelineState, action: PipelineAction): PipelineState {
  switch (action.type) {
    case 'SET_PROJECT':
      return {
        ...state,
        projectId: action.project.id,
        project: action.project,
        currentStep: action.project.currentStep,
        stepResults: action.project.stepResults || {},
        error: null,
      };
    case 'SET_STEP':
      return { ...state, currentStep: action.step, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    case 'SET_STEP_RESULT':
      return {
        ...state,
        stepResults: { ...state.stepResults, [action.step]: action.result },
        project: state.project ? {
          ...state.project,
          currentStep: action.step,
          stepResults: { ...state.project.stepResults, [action.step]: action.result },
        } : null,
      };
    case 'SET_TASK_INPUT':
      return { ...state, taskInput: action.taskInput };
    case 'SET_UPLOADED_FILES':
      return { ...state, uploadedFiles: action.files };
    case 'ADD_UPLOADED_FILES':
      return { ...state, uploadedFiles: [...state.uploadedFiles, ...action.files] };
    case 'REMOVE_UPLOADED_FILE':
      return { ...state, uploadedFiles: state.uploadedFiles.filter((_, i) => i !== action.index) };
    case 'SET_INPUT_URLS':
      return { ...state, inputURLs: action.urls };
    case 'SET_SUPPLEMENTARY_INFO':
      return { ...state, supplementaryInfo: { ...state.supplementaryInfo, ...action.info } };
    case 'SELECT_SCENE':
      return { ...state, selectedScene: action.scene, confirmedScene: false };
    case 'CONFIRM_SCENE':
      return { ...state, confirmedScene: true };
    case 'SET_DEMO_MODE':
      return { ...state, demoMode: action.demoMode };
    case 'SET_SOLUTION_PACKAGE_NAME':
      return { ...state, solutionPackageName: action.name };
    case 'SET_BUSINESS_PAIN_POINTS':
      return { ...state, businessPainPoints: action.painPoints };
    case 'SET_CONFIRMED_ACTIONS':
      return { ...state, confirmedActions: action.actions };
    case 'SET_SELECTED_CAPABILITIES':
      return { ...state, selectedCapabilities: action.capabilities };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ---- Context ----
const PipelineCtx = createContext<{
  state: PipelineState;
  dispatch: React.Dispatch<PipelineAction>;
  goToStep: (step: PipelineStep) => void;
  getStepIndex: () => number;
  goToPrevStep: () => void;
} | null>(null);

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(pipelineReducer, initialState);

  const goToStep = (step: PipelineStep) => {
    dispatch({ type: 'SET_STEP', step });
  };

  const getStepIndex = () => {
    return getPipelineSteps(state.project?.sceneType).indexOf(state.currentStep);
  };

  const goToPrevStep = () => {
    const steps = getPipelineSteps(state.project?.sceneType);
    const currentIndex = steps.indexOf(state.currentStep);
    const prevIndex = Math.max(0, currentIndex - 1);
    dispatch({ type: 'SET_STEP', step: steps[prevIndex] });
  };

  return (
    <PipelineCtx.Provider value={{ state, dispatch, goToStep, getStepIndex, goToPrevStep }}>
      {children}
    </PipelineCtx.Provider>
  );
}

export function usePipeline() {
  const ctx = useContext(PipelineCtx);
  if (!ctx) throw new Error('usePipeline must be used within PipelineProvider');
  return ctx;
}
