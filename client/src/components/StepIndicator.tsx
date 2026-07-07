import React from 'react';
import { usePipeline } from '../store/PipelineContext';
import { getPipelineSteps, getStepLabel } from '../types/pipeline';

export function StepIndicator() {
  const { state } = usePipeline();
  const steps = getPipelineSteps(state.project?.sceneType);
  const currentIndex = steps.indexOf(state.currentStep);

  // 三阶段：输入阶段 (0-3)、装配规划阶段 (4-10)、交付沉淀阶段 (11-15)
  const groups = [
    { label: '输入', steps: steps.slice(0, 4) },
    { label: '装配', steps: steps.slice(4, 10) },
    { label: '交付', steps: steps.slice(10) },
  ];

  return (
    <div className="flex items-center gap-6 overflow-x-auto">
      {groups.map((group, gi) => (
        <React.Fragment key={group.label}>
          {gi > 0 && <div className="flex-1 min-w-[20px] h-px bg-gray-200" />}
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xs text-gray-400 font-medium mr-1 whitespace-nowrap">{group.label}</span>
            {group.steps.map((step) => {
              const index = steps.indexOf(step);
              const isCompleted = index < currentIndex;
              const isActive = index === currentIndex;
              const isUpcoming = index > currentIndex;

              return (
                <div
                  key={step}
                  className={`step-dot ${
                    isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-200' :
                    isCompleted ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}
                  title={`${getStepLabel(step, state.project?.sceneType || null)}${isCompleted ? ' ✓' : isActive ? ' ←' : ''}`}
                  style={{ width: '26px', height: '26px', fontSize: '10px' }}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
              );
            })}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
