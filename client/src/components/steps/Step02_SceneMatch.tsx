import React, { useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { api } from '../../utils/api';
import type { RouteRole, SceneMatchResult } from '../../types/pipeline';
import { getFlowMeta } from '../../data/scenarioMatcher';

type DirectoryPickerHandle = {
  name: string;
  kind?: string;
};

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<DirectoryPickerHandle>;
  }
}

interface SelectedDirectoryInfo {
  name: string;
  pathLabel: string;
  source: 'local-directory' | 'default-workspace';
  handle?: DirectoryPickerHandle;
}

interface ProjectLocationModalProps {
  open: boolean;
  projectName: string;
  selectedDirectory: SelectedDirectoryInfo | null;
  loading: boolean;
  error: string | null;
  onProjectNameChange: (name: string) => void;
  onChooseDirectory: () => void;
  onCancel: () => void;
  onUseDefault: () => void;
  onConfirm: () => void;
}

const ROLE_BADGE_COLORS: Record<RouteRole, string> = {
  'primary-entry': 'bg-blue-100 text-blue-700 border-blue-200',
  'support-flow': 'bg-green-100 text-green-700 border-green-200',
  'later-flow': 'bg-purple-100 text-purple-700 border-purple-200',
  'weak-related': 'bg-gray-100 text-gray-500 border-gray-200',
  'not-recommended': 'bg-red-50 text-red-400 border-red-100',
};

const ROLE_LABELS: Record<RouteRole, string> = {
  'primary-entry': '主入口',
  'support-flow': '辅助流程',
  'later-flow': '后置流程',
  'weak-related': '弱相关',
  'not-recommended': '不推荐',
};

const DEFAULT_WORKSPACE = 'KIVI-TaskOS-Projects';
const PROJECT_CONTENTS = [
  '客户输入记录',
  '路由判断结果',
  '上传资料索引',
  '业务动作清单',
  'AI 能力组合记录',
  '交付物文件夹',
  '复盘记录文件夹',
];

function buildDefaultProjectName(taskInput: string, supplementaryInfo: any) {
  const source = [
    supplementaryInfo?.businessPainPoint,
    supplementaryInfo?.expectedOutcome,
    taskInput,
  ].filter(Boolean).join(' ');

  if (/供应链|补货|供应商|库存/.test(source)) {
    return '供应链补货与供应商异常决策解决包';
  }

  const compact = source
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[，。！？、；：,.!?;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return compact ? `${compact.slice(0, 24)}解决包` : '客户业务解决包';
}

function buildProjectPathPreview(projectName: string, directory: SelectedDirectoryInfo | null) {
  const basePath = directory?.pathLabel || DEFAULT_WORKSPACE;
  return `${basePath} / ${projectName || '未命名项目'}`;
}

function ProjectLocationModal({
  open,
  projectName,
  selectedDirectory,
  loading,
  error,
  onProjectNameChange,
  onChooseDirectory,
  onCancel,
  onUseDefault,
  onConfirm,
}: ProjectLocationModalProps) {
  if (!open) return null;

  const projectPathPreview = buildProjectPathPreview(projectName, selectedDirectory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 px-4 py-6">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">选择项目保存位置</h3>
          <p className="text-sm text-gray-500 mt-2 leading-6">
            系统将为本次客户解决包创建一个项目文件夹，用于保存客户资料、AI 判断结果、解决包配置、交付物和复盘记录。
          </p>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">项目名称</label>
            <input
              value={projectName}
              onChange={(event) => onProjectNameChange(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              placeholder="请输入项目名称"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">保存位置</p>
            <button
              type="button"
              onClick={onChooseDirectory}
              className="btn-secondary-uniform"
              disabled={loading}
            >
              选择本地文件夹
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium text-gray-500 mb-1">项目目录预览</p>
            <p className="text-sm text-gray-800 break-words leading-6">{projectPathPreview}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">创建内容说明</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROJECT_CONTENTS.map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked readOnly className="rounded border-gray-300 text-blue-600" />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary-uniform" disabled={loading}>
            取消
          </button>
          <button type="button" onClick={onUseDefault} className="btn-secondary-uniform" disabled={loading}>
            暂不选择，使用默认项目空间
          </button>
          <button type="button" onClick={onConfirm} className="btn-primary-uniform" disabled={loading}>
            {loading ? '创建中...' : '确认创建项目'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Step02_SceneMatch() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState(() => buildDefaultProjectName(state.taskInput, state.supplementaryInfo));
  const [selectedDirectory, setSelectedDirectory] = useState<SelectedDirectoryInfo | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const result: SceneMatchResult | undefined = state.stepResults['02-scene-match'];

  if (!result) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400">路由判断结果未找到，请返回上一步重试。</p>
        <button
          onClick={() => dispatch({ type: 'SET_STEP', step: '01-task-input' })}
          className="btn-secondary mt-4"
        >
          返回上一步
        </button>
      </div>
    );
  }

  const primaryEntry = result.primaryEntry;
  const primaryMeta = primaryEntry ? getFlowMeta(primaryEntry.flowName) : null;

  const continueAfterProjectCreated = () => {
    if (primaryMeta?.needsProject) {
      dispatch({ type: 'SET_STEP', step: '03-supplementary-info' });
    } else if (primaryMeta?.needsUpload && state.uploadedFiles.length > 0) {
      dispatch({ type: 'SET_STEP', step: '03-supplementary-info' });
    } else if (primaryMeta?.needsCapabilityRouting) {
      dispatch({ type: 'SET_STEP', step: '05-task-type-judge' });
    } else {
      dispatch({ type: 'SET_STEP', step: '05-task-type-judge' });
    }
  };

  const createProjectAndContinue = async (directory: SelectedDirectoryInfo) => {
    if (!primaryEntry) return;

    const trimmedName = projectName.trim();
    if (!trimmedName) {
      setModalError('请输入项目名称。');
      return;
    }

    setLoading(true);
    setError(null);
    setModalError(null);

    try {
      const projectPathPreview = buildProjectPathPreview(trimmedName, directory);
      const project = await api.createProject(trimmedName, state.taskInput, {
        sceneType: primaryEntry.flowName,
        requiresProject: primaryMeta?.needsProject ?? true,
        supplementaryInfo: state.supplementaryInfo,
        metadata: {
          projectName: trimmedName,
          selectedDirectory: {
            name: directory.name,
            pathLabel: directory.pathLabel,
            source: directory.source,
          },
          projectPathPreview,
          createdVia: directory.source === 'local-directory' ? 'showDirectoryPicker' : 'default-workspace',
          createdAt: new Date().toISOString(),
          contents: PROJECT_CONTENTS,
        },
      });

      dispatch({ type: 'SET_PROJECT', project });
      setProjectModalOpen(false);
      continueAfterProjectCreated();
    } catch (err: any) {
      setModalError(err.message || '项目创建失败，请重试。');
      setLoading(false);
    }
  };

  const handleConfirmClick = () => {
    if (!primaryEntry) return;
    if (primaryMeta?.needsProject) {
      setProjectName((current) => current || buildDefaultProjectName(state.taskInput, state.supplementaryInfo));
      setModalError(null);
      setProjectModalOpen(true);
      return;
    }

    createProjectAndContinue({
      name: DEFAULT_WORKSPACE,
      pathLabel: DEFAULT_WORKSPACE,
      source: 'default-workspace',
    });
  };

  const handleChooseDirectory = async () => {
    setModalError(null);

    if (!window.showDirectoryPicker) {
      setModalError('当前浏览器不支持直接选择本地文件夹，请使用默认项目空间，或在桌面端中配置项目目录。');
      return;
    }

    try {
      const handle = await window.showDirectoryPicker();
      setSelectedDirectory({
        name: handle.name,
        pathLabel: handle.name,
        source: 'local-directory',
        handle,
      });
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setModalError(err.message || '选择文件夹失败，请重试。');
      }
    }
  };

  const handleUseDefaultWorkspace = () => {
    createProjectAndContinue({
      name: DEFAULT_WORKSPACE,
      pathLabel: DEFAULT_WORKSPACE,
      source: 'default-workspace',
    });
  };

  const handleConfirmCreateProject = () => {
    if (!selectedDirectory) {
      setModalError('请先选择文件夹，或点击“暂不选择，使用默认项目空间”继续。');
      return;
    }
    createProjectAndContinue(selectedDirectory);
  };

  const handleModify = () => {
    dispatch({ type: 'SET_STEP', step: '01-task-input' });
  };

  const handleChangeEntry = () => {
    setFeedback('');
  };

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          <span className="text-blue-600">Step 2</span>：入口与流程路由判断
        </h2>
        <p className="text-gray-500">
          系统已分析你的输入，并给出下一步交付流程。
        </p>
      </div>

      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

      <div className="card mb-6 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">你的输入</h3>
        <p className="text-gray-800 whitespace-pre-wrap">{state.taskInput}</p>
        {state.uploadedFiles.length > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            已上传 {state.uploadedFiles.length} 个文件
          </p>
        )}
        {state.inputURLs.length > 0 && (
          <p className="text-xs text-gray-400">
            已输入 {state.inputURLs.length} 个链接
          </p>
        )}
      </div>

      {result.evidence && result.evidence.length > 0 && (
        <div className="card mb-6 bg-blue-50/30 border border-blue-100">
          <h3 className="text-sm font-semibold text-blue-700 mb-2">检测到的信号</h3>
          <div className="flex flex-wrap gap-1.5">
            {result.evidence.map((e, i) => (
              <span key={i} className="text-xs bg-white border border-blue-100 rounded-full px-2.5 py-1 text-gray-600">
                {e}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">入口与流程路由判断</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">流程名称</th>
                <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-600">路由角色</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">业务意图</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">推荐入口</th>
              </tr>
            </thead>
            <tbody>
              {result.flowResults.map((flow, i) => (
                <tr
                  key={`${flow.flowName}-${i}`}
                  className={flow.routeRole === 'primary-entry' ? 'bg-blue-50/30' : flow.routeRole === 'support-flow' ? 'bg-green-50/20' : ''}
                >
                  <td className="border border-gray-200 px-3 py-2 font-medium">
                    {flow.flowLabel}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    <span className={`badge border text-xs ${ROLE_BADGE_COLORS[flow.routeRole]}`}>
                      {ROLE_LABELS[flow.routeRole]}
                    </span>
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-gray-600">
                    {flow.matchedIntent}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-sm text-gray-600 leading-6 whitespace-normal">
                    {flow.recommendedEntry}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {primaryEntry && (
        <div className="card mb-6 border-2 border-blue-200 bg-blue-50/30">
          <h3 className="text-lg font-semibold mb-2">已识别为客户解决包模式</h3>
          <p className="text-gray-600 mb-3">
            系统将基于当前输入进入客户业务解决包交付流程。
          </p>
          <p className="text-sm text-blue-700 font-medium">
            推荐入口：客户解决包模式
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="text-center">
        <div className="flex items-center justify-center flex-wrap gap-4">
          <button onClick={goToPrevStep} className="btn-secondary-uniform" disabled={loading}>
            返回上一步
          </button>
          <button onClick={handleChangeEntry} className="btn-secondary-uniform" disabled={loading}>
            换入口
          </button>
          <button onClick={handleModify} className="btn-secondary-uniform" disabled={loading}>
            修改输入
          </button>
          <button
            onClick={handleConfirmClick}
            disabled={loading || !primaryEntry}
            className="btn-primary-uniform"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                处理中...
              </span>
            ) : (
              primaryMeta?.needsProject
                ? '确认，创建项目并继续'
                : '确认，进入该流程'
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          {primaryMeta?.needsProject
            ? '确认后将先选择项目保存位置，再进入资料补充和项目设置。'
            : '确认后将直接进入任务判断阶段，不创建项目文件夹。'}
        </p>
      </div>

      <ProjectLocationModal
        open={isProjectModalOpen}
        projectName={projectName}
        selectedDirectory={selectedDirectory}
        loading={loading}
        error={modalError}
        onProjectNameChange={(name) => {
          setProjectName(name);
          setModalError(null);
        }}
        onChooseDirectory={handleChooseDirectory}
        onCancel={() => {
          if (!loading) {
            setProjectModalOpen(false);
            setModalError(null);
          }
        }}
        onUseDefault={handleUseDefaultWorkspace}
        onConfirm={handleConfirmCreateProject}
      />
    </div>
  );
}