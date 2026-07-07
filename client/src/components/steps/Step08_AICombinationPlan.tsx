import React, { useEffect, useMemo, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { api } from '../../utils/api';
import {
  buildCapabilityAssemblyPlans,
  CapabilityAssemblyPlan,
  CapabilityCandidate,
  ExternalSearchResponse,
  getExternalSearchKeywords,
  SearchStatus,
} from '../../data/capabilityAssembly';

type DirectoryPickerHandle = {
  name: string;
  kind?: string;
};

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<DirectoryPickerHandle>;
  }
}

type LocalSourceStatus = '未连接' | '已连接' | '扫描中' | '已扫描' | '扫描失败';

interface LocalCapabilitySource {
  id: string;
  name: string;
  capabilityType: string;
  status: LocalSourceStatus;
  path: string;
  defaultConnected?: boolean;
}

interface LocalCapabilityLibraryModalProps {
  open: boolean;
  sources: LocalCapabilitySource[];
  scanResults: CapabilityCandidate[];
  selectedResultIds: string[];
  message: string | null;
  canScan: boolean;
  onChooseFolder: (sourceId: string) => void;
  onScan: () => void;
  onToggleResult: (id: string) => void;
  onConfirmResults: () => void;
  onSkip: () => void;
  onClose: () => void;
}

type SearchSourcePlatform = 'github' | 'openclaw' | 'skill-registry' | 'mcp' | 'plugins' | 'website';

interface SearchSourceConfig {
  githubToken: string;
  openClawApiUrl: string;
  openClawApiKey: string;
  skillRegistryUrl: string;
  mcpRegistryUrl: string;
  pluginSourceUrl: string;
  websiteSearchConfig: string;
}

interface SearchSourceConfigModalProps {
  open: boolean;
  activePlatform: SearchSourcePlatform;
  config: SearchSourceConfig;
  githubStatus: string;
  message: string | null;
  onChangePlatform: (platform: SearchSourcePlatform) => void;
  onChangeConfig: (patch: Partial<SearchSourceConfig>) => void;
  onSaveGitHub: () => void;
  onTestGitHub: () => void;
  onSavePlaceholder: (platform: SearchSourcePlatform) => void;
  onTestPlaceholder: (platform: SearchSourcePlatform) => void;
  onClose: () => void;
}

type BestPlanMode = 'save-only' | 'execute';

type BestPlanExecutionStatus = NonNullable<CapabilityAssemblyPlan['executionStatus']>;

interface BestPlanExecutionRecord {
  selectedPlan: CapabilityCandidate[];
  executionStatus: BestPlanExecutionStatus;
  status: CapabilityAssemblyPlan['status'];
  evidence: string[];
}

interface BestPlanConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onSaveOnly: () => void;
  onExecute: () => void;
}

const LOCAL_CAPABILITY_SOURCES: LocalCapabilitySource[] = [
  { id: 'skills', name: '本地 Skills 文件夹', capabilityType: 'Skill', status: '未连接', path: '' },
  { id: 'plugins', name: '本地 Plugins 文件夹', capabilityType: 'Plugin', status: '未连接', path: '' },
  { id: 'mcp', name: '本地 MCP 配置目录', capabilityType: 'MCP', status: '未连接', path: '' },
  { id: 'prompts', name: '本地 Prompt 模板库', capabilityType: 'Prompt', status: '未连接', path: '' },
  { id: 'agents', name: '本地 Agent 配置库', capabilityType: 'Agent', status: '未连接', path: '' },
  { id: 'claude-code', name: 'Claude Code 项目能力库', capabilityType: 'Tool', status: '未连接', path: '' },
  { id: 'kivi-taskos', name: 'KIVI TaskOS 能力库', capabilityType: 'Workflow', status: '已连接', path: '默认系统能力库', defaultConnected: true },
  { id: 'custom', name: '自定义能力目录', capabilityType: 'Tool', status: '未连接', path: '' },
];

const SEARCH_SOURCE_CONFIG_KEY = 'kivi-taskos.searchSourceConfig';
const SEARCH_SOURCE_STATUS_KEY = 'kivi-taskos.searchSourceStatus';

const DEFAULT_SEARCH_SOURCE_CONFIG: SearchSourceConfig = {
  githubToken: '',
  openClawApiUrl: '',
  openClawApiKey: '',
  skillRegistryUrl: '',
  mcpRegistryUrl: '',
  pluginSourceUrl: '',
  websiteSearchConfig: '',
};

function loadStoredSearchConfig(): SearchSourceConfig {
  try {
    return { ...DEFAULT_SEARCH_SOURCE_CONFIG, ...JSON.parse(window.localStorage.getItem(SEARCH_SOURCE_CONFIG_KEY) || '{}') };
  } catch {
    return DEFAULT_SEARCH_SOURCE_CONFIG;
  }
}

function loadStoredGitHubStatus() {
  try {
    return JSON.parse(window.localStorage.getItem(SEARCH_SOURCE_STATUS_KEY) || '{}')?.github || '未配置';
  } catch {
    return '未配置';
  }
}

const SOURCE_STATUS_COLORS: Record<LocalSourceStatus, string> = {
  未连接: 'bg-gray-100 text-gray-600',
  已连接: 'bg-blue-100 text-blue-700',
  扫描中: 'bg-yellow-100 text-yellow-700',
  已扫描: 'bg-green-100 text-green-700',
  扫描失败: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }: { status: string }) {
  const color = status.includes('确认') || status.includes('推荐') || status.includes('保存') || status.includes('已执行') || status.includes('已选用') || status.includes('已扫描') || status.includes('已连接') || status.includes('已配置') || status.includes('已搜索')
    ? 'bg-green-100 text-green-700'
    : status.includes('失败') || status.includes('限流') || status.includes('需人工审批')
        ? 'bg-red-100 text-red-700'
        : status.includes('搜索') || status.includes('待') || status.includes('扫描中')
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-gray-100 text-gray-600';

  return <span className={`badge ${color}`}>{status}</span>;
}

function PillList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <span key={item} className="text-xs bg-gray-50 border border-gray-200 rounded-full px-2 py-1 text-gray-600">
          {item}
        </span>
      ))}
    </div>
  );
}

function LocalCapabilityLibraryModal({
  open,
  sources,
  scanResults,
  selectedResultIds,
  message,
  canScan,
  onChooseFolder,
  onScan,
  onToggleResult,
  onConfirmResults,
  onSkip,
  onClose,
}: LocalCapabilityLibraryModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 px-4 py-6">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">连接本地能力库</h3>
          <p className="text-sm text-gray-500 mt-2 leading-6">
            逐项连接本地 Skills、Plugins、MCP、Prompt、Agent 和项目能力库。扫描后先展示本地能力结果，再由你确认使用哪些能力。
          </p>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">能力来源名称</th>
                  <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-600">当前状态</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">本地路径</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {sources.map(source => (
                  <tr key={source.id}>
                    <td className="border border-gray-200 px-3 py-2 font-medium text-gray-800">{source.name}</td>
                    <td className="border border-gray-200 px-3 py-2 text-center">
                      <span className={`badge ${SOURCE_STATUS_COLORS[source.status]}`}>{source.status}</span>
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-600 break-words">
                      {source.path || '未连接'}
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onChooseFolder(source.id)}
                          className="btn-secondary text-xs py-1 px-2"
                          disabled={source.defaultConnected}
                        >
                          {source.path ? '重新选择' : '选择文件夹'}
                        </button>
                        <button
                          type="button"
                          onClick={onScan}
                          className="btn-secondary text-xs py-1 px-2"
                          disabled={source.status === '未连接'}
                        >
                          重新扫描
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {message && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              {message}
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="font-semibold text-gray-800">本地能力扫描结果</p>
                <p className="text-xs text-gray-500 mt-1">当前前端无法真实读取目录内容，扫描结果会标记为 Demo 模拟 / 需人工确认。</p>
              </div>
              <StatusBadge status={scanResults.length > 0 ? '已扫描' : '待扫描'} />
            </div>

            {scanResults.length > 0 ? (
              <div className="space-y-3">
                {scanResults.map(result => (
                  <label key={result.id} className="block rounded-lg border border-gray-200 bg-white p-3 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedResultIds.includes(result.id)}
                        onChange={() => onToggleResult(result.id)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-gray-900">{result.name}</p>
                          <StatusBadge status={result.installStatus} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
                          <p><span className="font-medium text-gray-700">能力类型：</span>{result.capabilityType}</p>
                          <p><span className="font-medium text-gray-700">来源路径：</span>{result.sourcePath}</p>
                          <p><span className="font-medium text-gray-700">匹配用法：</span>{result.aiUsage}</p>
                          <p><span className="font-medium text-gray-700">输入输出：</span>{result.input} → {result.output}</p>
                        </div>
                        <div className="mt-2">
                          <PillList items={result.relatedPainPoints} />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {['使用', '收藏', '保存到系统', '跳过'].map(action => (
                            <span key={action} className="text-xs rounded border border-gray-200 px-2 py-1 text-gray-500">{action}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">连接至少一个能力来源后，点击“扫描已连接能力库”查看结果。</p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary-uniform">取消</button>
          <button type="button" onClick={onSkip} className="btn-secondary-uniform">跳过本地搜索</button>
          <button type="button" onClick={onScan} className="btn-secondary-uniform" disabled={!canScan}>扫描已连接能力库</button>
          <button type="button" onClick={onConfirmResults} className="btn-primary-uniform" disabled={scanResults.length === 0}>确认使用选中能力</button>
        </div>
      </div>
    </div>
  );
}

function SearchSourceConfigModal({
  open,
  activePlatform,
  config,
  githubStatus,
  message,
  onChangePlatform,
  onChangeConfig,
  onSaveGitHub,
  onTestGitHub,
  onSavePlaceholder,
  onTestPlaceholder,
  onClose,
}: SearchSourceConfigModalProps) {
  if (!open) return null;

  const navItems: Array<{ id: SearchSourcePlatform; label: string }> = [
    { id: 'github', label: 'GitHub' },
    { id: 'openclaw', label: 'OpenClaw / ClawHub' },
    { id: 'skill-registry', label: 'Skill Registry' },
    { id: 'mcp', label: 'MCP Server' },
    { id: 'plugins', label: '开源插件库' },
    { id: 'website', label: '工具官网搜索' },
  ];

  const placeholderSections: Record<Exclude<SearchSourcePlatform, 'github'>, {
    title: string;
    fields: Array<{ key: keyof SearchSourceConfig; label: string; placeholder: string; type?: string }>;
  }> = {
    openclaw: {
      title: 'OpenClaw / ClawHub',
      fields: [
        { key: 'openClawApiUrl', label: 'API 地址', placeholder: 'https://...' },
        { key: 'openClawApiKey', label: 'API Key（如需要）', placeholder: '可选', type: 'password' },
      ],
    },
    'skill-registry': {
      title: 'OpenClaw Skill Registry',
      fields: [
        { key: 'skillRegistryUrl', label: 'Registry URL', placeholder: 'https://...' },
      ],
    },
    mcp: {
      title: 'MCP Server 市场',
      fields: [
        { key: 'mcpRegistryUrl', label: 'MCP 市场地址 / Registry URL', placeholder: 'https://...' },
      ],
    },
    plugins: {
      title: '开源插件库',
      fields: [
        { key: 'pluginSourceUrl', label: 'npm / PyPI / 自定义插件源地址', placeholder: 'https://registry.npmjs.org 或自定义地址' },
      ],
    },
    website: {
      title: '工具官网搜索',
      fields: [
        { key: 'websiteSearchConfig', label: '搜索引擎 API Key 或自定义搜索服务地址', placeholder: 'API Key 或 https://...' },
      ],
    },
  };

  const currentPlaceholder = activePlatform === 'github' ? null : placeholderSections[activePlatform];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 px-4 py-6">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">搜索源配置</h3>
            <p className="text-sm text-gray-500 mt-2 leading-6">
              配置外部能力搜索源。GitHub Token 会发送到后端运行时配置；正式环境建议写入后端 .env 的 GITHUB_TOKEN。
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary text-xs py-1 px-2">关闭</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-0">
          <div className="border-r border-gray-100 p-4 space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangePlatform(item.id)}
                className={`w-full text-left rounded-lg border px-3 py-2 text-sm ${
                  activePlatform === item.id ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-4">
            {message && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                {message}
              </div>
            )}

            {activePlatform === 'github' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-semibold text-gray-900">GitHub</h4>
                  <StatusBadge status={githubStatus} />
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">GitHub Token</span>
                  <input
                    type="password"
                    value={config.githubToken}
                    onChange={event => onChangeConfig({ githubToken: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    placeholder="ghp_... / github_pat_..."
                  />
                </label>
                <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-3 text-xs text-yellow-800 leading-5">
                  Demo 模式可用于本地测试；正式环境应由后端安全保存 Token，推荐写入 .env：GITHUB_TOKEN=xxxx。
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={onSaveGitHub} className="btn-primary-uniform">保存 Token</button>
                  <button type="button" onClick={onTestGitHub} className="btn-secondary-uniform">测试连接</button>
                  <a className="btn-secondary-uniform text-center" href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens" target="_blank" rel="noreferrer">
                    查看配置说明
                  </a>
                </div>
              </div>
            ) : currentPlaceholder && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-semibold text-gray-900">{currentPlaceholder.title}</h4>
                  <StatusBadge status="平台待接入" />
                </div>
                {currentPlaceholder.fields.map(field => (
                  <label key={field.key} className="block">
                    <span className="text-sm font-medium text-gray-700">{field.label}</span>
                    <input
                      type={field.type || 'text'}
                      value={String(config[field.key] || '')}
                      onChange={event => onChangeConfig({ [field.key]: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      placeholder={field.placeholder}
                    />
                  </label>
                ))}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                  当前版本暂未接入真实搜索接口，配置会先保存为本地草案，后续接入对应 API 后可启用真实搜索。
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => onSavePlaceholder(activePlatform)} className="btn-primary-uniform">保存配置</button>
                  <button type="button" onClick={() => onTestPlaceholder(activePlatform)} className="btn-secondary-uniform">测试连接</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BestPlanConfirmModal({
  open,
  onCancel,
  onSaveOnly,
  onExecute,
}: BestPlanConfirmModalProps) {
  if (!open) return null;

  const summaryItems = [
    '将自动使用本地已匹配能力',
    '将自动保存系统创建的 Prompt / Agent / Hook / Workflow',
    '外部开源能力不会直接安装，只标记为待用户确认',
    '高风险能力不会自动启用，需要人工审批',
    '搜索失败或未配置平台的能力将跳过，进入系统自动创建备选',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 px-4 py-6">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">确认执行最优方案</h3>
          <p className="text-sm text-gray-500 mt-2 leading-6">
            系统将根据当前评分结果，自动为每个 AI 组合用法选择推荐分最高、风险可控、最适合当前痛点的能力组合。
          </p>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm font-semibold text-gray-800 mb-3">执行摘要</p>
          <ul className="space-y-2">
            {summaryItems.map(item => (
              <li key={item} className="flex gap-2 text-sm text-gray-600">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary-uniform">取消</button>
          <button type="button" onClick={onSaveOnly} className="btn-secondary-uniform">仅保存推荐</button>
          <button type="button" onClick={onExecute} className="btn-primary-uniform">确认执行</button>
        </div>
      </div>
    </div>
  );
}

function CapabilityCard({
  candidate,
  onAction,
}: {
  candidate: CapabilityCandidate;
  onAction?: (candidate: CapabilityCandidate, action: string) => void;
}) {
  const actions = ['查看来源', '收藏', '下载到本地', '保存到系统', '安装 / 接入', '替换', '跳过'];
  const visibleActions = actions.filter(action => action !== '查看来源' || Boolean(candidate.sourceUrl || candidate.sourceLink));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-gray-900">{candidate.name}</p>
          <p className="text-xs text-gray-500 mt-1">
            {candidate.sourcePlatform || candidate.platform || candidate.sourceType} · {candidate.capabilityType}
            {candidate.status ? ` · ${candidate.status}` : ''}
          </p>
        </div>
        <StatusBadge status={candidate.installStatus} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
        <p><span className="font-medium text-gray-700">来源平台：</span>{candidate.sourcePlatform || candidate.platform || candidate.sourceType}</p>
        <p><span className="font-medium text-gray-700">能力类型：</span>{candidate.capabilityType}</p>
        <p><span className="font-medium text-gray-700">作用：</span>{candidate.purpose}</p>
        <p><span className="font-medium text-gray-700">适合痛点：</span>{candidate.matchedPainPoint || candidate.usageLocation}</p>
        <p><span className="font-medium text-gray-700">Stars / 热度：</span>{candidate.stars ?? '未提供'}</p>
        <p><span className="font-medium text-gray-700">最近更新时间：</span>{candidate.lastUpdated || '未提供'}</p>
        <p><span className="font-medium text-gray-700">许可证：</span>{candidate.license || '未提供'}</p>
        <p><span className="font-medium text-gray-700">风险等级：</span>{candidate.riskLevel || candidate.risk}</p>
        <p><span className="font-medium text-gray-700">输入：</span>{candidate.input}</p>
        <p><span className="font-medium text-gray-700">输出：</span>{candidate.output}</p>
        <p><span className="font-medium text-gray-700">推荐理由：</span>{candidate.recommendationReason}</p>
        <p><span className="font-medium text-gray-700">推荐分：</span>{candidate.score || candidate.recommendationScore || '待评分'}</p>
      </div>

      {candidate.safetyCheck && (
        <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-800 mb-2">安全检查</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-amber-800">
            <p>来源平台：{candidate.safetyCheck.sourcePlatform}</p>
            <p>README：{candidate.safetyCheck.hasReadme}</p>
            <p>安装脚本：{candidate.safetyCheck.hasInstallScript}</p>
            <p>API Key：{candidate.safetyCheck.needsApiKey}</p>
            <p>本地文件权限：{candidate.safetyCheck.localFilePermission}</p>
            <p>Shell 命令：{candidate.safetyCheck.shellCommand}</p>
            <p>维护记录：{candidate.safetyCheck.recentlyMaintained}</p>
            <p>明显风险：{candidate.safetyCheck.obviousRisk}</p>
          </div>
        </div>
      )}

      <div className="mt-3">
        <p className="text-xs font-medium text-gray-500 mb-1">对应痛点</p>
        <PillList items={candidate.relatedPainPoints} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {visibleActions.map(action => (
          <button key={action} type="button" className="btn-secondary text-xs py-1 px-2" onClick={() => onAction?.(candidate, action)}>
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}

function getSystemCapabilityType(candidate: CapabilityCandidate) {
  if (candidate.capabilityType === 'Prompt') return 'Prompt';
  if (candidate.capabilityType.includes('Agent')) return 'Agent';
  if (candidate.capabilityType === 'Hook') return 'Hook';
  if (candidate.capabilityType === 'Workflow') return '自动化流程';
  return candidate.capabilityType || '其他';
}

function SystemCapabilitySummaryCard({
  candidate,
  expanded,
  onToggle,
  onAction,
}: {
  candidate: CapabilityCandidate;
  expanded: boolean;
  onToggle: () => void;
  onAction?: (candidate: CapabilityCandidate, action: string) => void;
}) {
  const actions = ['收藏', '下载到本地', '保存到系统', '安装 / 接入', '替换', '跳过'];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{candidate.name}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
            <p><span className="font-medium text-gray-700">能力类型：</span>{candidate.capabilityType}</p>
            <p><span className="font-medium text-gray-700">来源：</span>系统创建</p>
            <p><span className="font-medium text-gray-700">作用：</span>{candidate.purpose}</p>
            <p><span className="font-medium text-gray-700">适合痛点：</span>{candidate.matchedPainPoint || candidate.usageLocation}</p>
            <p><span className="font-medium text-gray-700">推荐状态：</span>{candidate.installStatus}</p>
            <p><span className="font-medium text-gray-700">推荐分：</span>{candidate.score || candidate.recommendationScore || '待评分'}</p>
          </div>
        </div>
        <button type="button" onClick={onToggle} className="btn-secondary text-xs py-1 px-2">
          {expanded ? '收起详情' : '展开详情'}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
            <p><span className="font-medium text-gray-700">来源平台：</span>{candidate.sourcePlatform || candidate.platform || candidate.sourceType}</p>
            <p><span className="font-medium text-gray-700">能力类型：</span>{candidate.capabilityType}</p>
            <p><span className="font-medium text-gray-700">作用：</span>{candidate.purpose}</p>
            <p><span className="font-medium text-gray-700">适合痛点：</span>{candidate.matchedPainPoint || candidate.usageLocation}</p>
            <p><span className="font-medium text-gray-700">Stars / 热度：</span>{candidate.stars ?? '未提供'}</p>
            <p><span className="font-medium text-gray-700">最近更新时间：</span>{candidate.lastUpdated || '未提供'}</p>
            <p><span className="font-medium text-gray-700">许可证：</span>{candidate.license || '未提供'}</p>
            <p><span className="font-medium text-gray-700">风险等级：</span>{candidate.riskLevel || candidate.risk}</p>
            <p><span className="font-medium text-gray-700">输入：</span>{candidate.input}</p>
            <p><span className="font-medium text-gray-700">输出：</span>{candidate.output}</p>
            <p><span className="font-medium text-gray-700">推荐理由：</span>{candidate.recommendationReason}</p>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-500 mb-1">对应痛点</p>
            <PillList items={candidate.relatedPainPoints} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map(action => (
              <button key={action} type="button" className="btn-secondary text-xs py-1 px-2" onClick={() => onAction?.(candidate, action)}>
                {action}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SystemCreatedCapabilitiesPanel({
  candidates,
  selectedType,
  expandedIds,
  onSelectType,
  onToggleExpanded,
  onAction,
}: {
  candidates: CapabilityCandidate[];
  selectedType: string;
  expandedIds: string[];
  onSelectType: (type: string) => void;
  onToggleExpanded: (id: string) => void;
  onAction?: (candidate: CapabilityCandidate, action: string) => void;
}) {
  const grouped = candidates.reduce<Record<string, CapabilityCandidate[]>>((acc, candidate) => {
    const type = getSystemCapabilityType(candidate);
    acc[type] = [...(acc[type] || []), candidate];
    return acc;
  }, {});
  const preferredOrder = ['Prompt', 'Agent', 'Hook', '自动化流程'];
  const types = [
    ...preferredOrder.filter(type => grouped[type]?.length),
    ...Object.keys(grouped).filter(type => !preferredOrder.includes(type)),
  ];
  const activeType = types.includes(selectedType) ? selectedType : types[0];
  const visibleCandidates = activeType ? grouped[activeType] || [] : [];

  if (types.length === 0) {
    return <p className="text-sm text-gray-400">暂无系统自动创建能力候选。</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          已生成 {types.length} 类能力候选，共 {candidates.length} 个候选项
        </p>
        <div className="flex flex-wrap gap-2">
          {types.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => onSelectType(type)}
              className={`h-9 px-3 rounded-lg border text-sm font-medium transition-colors ${
                activeType === type
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {visibleCandidates.map((candidate, index) => {
          const isExpanded = expandedIds.includes(candidate.id) || (index === 0 && !expandedIds.some(id => visibleCandidates.some(item => item.id === id)));
          return (
            <SystemCapabilitySummaryCard
              key={candidate.id}
              candidate={candidate}
              expanded={isExpanded}
              onToggle={() => onToggleExpanded(candidate.id)}
              onAction={onAction}
            />
          );
        })}
      </div>
    </div>
  );
}

function PlanSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function getPainPointsFromState(state: any) {
  const stepResult = state.stepResults?.['05-task-type-judge'];
  return stepResult?.painPoints || [];
}

function getExternalSearchEmptyMessage(status: SearchStatus) {
  if (status === '搜索被限流') {
    return '你可以配置 GitHub Token 后重新搜索，也可以先进入系统自动创建能力。';
  }
  if (status === '搜索失败') {
    return '你可以配置 GitHub Token 后重新搜索，也可以先进入系统自动创建能力。';
  }
  if (status === '搜索中') {
    return 'GitHub 搜索正在后端队列中执行，请稍等。';
  }
  if (status === '待搜索') {
    return 'GitHub 搜索待执行，请稍等或稍后重试。';
  }
  return '暂无高匹配开源能力，建议由系统自动创建对应 Prompt / Skill / Agent / Hook / Workflow。';
}

function platformToConfigTab(platform: string): SearchSourcePlatform {
  if (platform.includes('GitHub')) return 'github';
  if (platform.includes('OpenClaw Skills') || platform.includes('ClawHub')) return 'openclaw';
  if (platform.includes('Skill Registry')) return 'skill-registry';
  if (platform.includes('MCP')) return 'mcp';
  if (platform.includes('插件')) return 'plugins';
  return 'website';
}

function createLocalScanResults(sources: LocalCapabilitySource[], plans: CapabilityAssemblyPlan[]): CapabilityCandidate[] {
  const connectedSources = sources.filter(source => source.status === '已连接' || source.status === '已扫描');
  return connectedSources.flatMap(source => plans.map(plan => ({
    id: `${source.id}-${plan.aiUsage}`,
    name: `${source.name} · ${plan.aiUsage} 候选能力`,
    capabilityType: source.capabilityType,
    sourceType: '本地' as const,
    sourcePath: source.path || '默认系统能力库',
    purpose: `从${source.name}中匹配可用于「${plan.aiUsage}」的本地能力。`,
    usageLocation: plan.relatedPainPoints.join('、') || '当前业务痛点',
    relatedPainPoints: plan.relatedPainPoints,
    aiUsage: plan.aiUsage,
    input: '痛点、所需数据、业务动作、验证指标',
    output: '本地能力调用建议、配置草案或执行模板',
    installStatus: '需人工确认' as const,
    risk: '当前为前端 Demo 模拟扫描结果，未真实读取本地文件内容，使用前需人工确认。',
    recommendationReason: '本地能力优先，接入成本低，适合保存为系统能力。',
    score: source.defaultConnected ? 88 : 84,
    scoreBreakdown: {
      场景匹配度: 86,
      输入输出匹配度: 84,
      本地可用性: source.defaultConnected ? 90 : 82,
      '安装 / 接入成本': 88,
      风险可控性: 72,
      可复用性: 86,
      调用证据完整性: 70,
    },
  })));
}

function mergeLocalResults(plan: CapabilityAssemblyPlan, acceptedLocalResults: CapabilityCandidate[]): CapabilityAssemblyPlan {
  const localSearchResults = acceptedLocalResults.filter(result => result.aiUsage === plan.aiUsage);
  if (localSearchResults.length === 0) return plan;

  const scoredCandidates = [...localSearchResults, ...plan.externalSearchResults, ...plan.systemCreatedCapabilities]
    .sort((a, b) => (b.score || 0) - (a.score || 0));
  const finalRecommendedCapabilities = [...localSearchResults, ...plan.systemCreatedCapabilities].slice(0, 4);

  return {
    ...plan,
    localSearchStatus: 'Demo 模拟',
    localSearchResults,
    scoredCandidates,
    finalRecommendedCapabilities,
    installPlan: finalRecommendedCapabilities.map(item => `${item.installStatus}: ${item.name}`),
    evidence: [...plan.evidence, '用户已在本地能力库弹窗中确认使用本地候选能力'],
  };
}

function isHighRiskCandidate(candidate: CapabilityCandidate) {
  const riskText = `${candidate.riskLevel || ''} ${candidate.risk || ''}`.toLowerCase();
  return riskText.includes('high') || riskText.includes('高风险') || riskText.includes('明显风险');
}

function isExternalCandidate(candidate: CapabilityCandidate) {
  return ['GitHub', 'OpenClawAI', 'Claude Skill 社区', 'MCP Server 市场', '开源插件库', '工具官网'].includes(candidate.sourceType);
}

function getBestCandidate(plan: CapabilityAssemblyPlan) {
  return [...plan.finalRecommendedCapabilities].sort(
    (a, b) => (b.score || b.recommendationScore || 0) - (a.score || a.recommendationScore || 0)
  )[0];
}

function buildBestPlanRecord(plan: CapabilityAssemblyPlan, mode: BestPlanMode): BestPlanExecutionRecord {
  const bestCandidate = getBestCandidate(plan);
  const timestamp = new Date().toISOString();

  if (!bestCandidate) {
    return {
      selectedPlan: [],
      executionStatus: 'skipped',
      status: '已跳过',
      evidence: [
        `${timestamp} 一键执行最优方案：${plan.aiUsage} 暂无可执行推荐，建议系统自动创建基础 Prompt / Agent / Hook。`,
      ],
    };
  }

  if (mode === 'save-only') {
    return {
      selectedPlan: [bestCandidate],
      executionStatus: 'saved',
      status: '已推荐',
      evidence: [
        `${timestamp} 仅保存推荐：已为 ${plan.aiUsage} 保存推荐分最高能力 ${bestCandidate.name}，未改变安装 / 接入状态。`,
      ],
    };
  }

  if (isHighRiskCandidate(bestCandidate)) {
    return {
      selectedPlan: [{ ...bestCandidate, installStatus: '需人工审批' }],
      executionStatus: 'need-human-approval',
      status: '需人工审批',
      evidence: [
        `${timestamp} 一键执行最优方案：${bestCandidate.name} 风险等级为 high / 高风险，未自动启用，需人工审批。`,
      ],
    };
  }

  if (bestCandidate.sourceType === '本地') {
    return {
      selectedPlan: [{ ...bestCandidate, installStatus: '已选用' }],
      executionStatus: 'executed',
      status: '已执行',
      evidence: [
        `${timestamp} 一键执行最优方案：已选用本地能力 ${bestCandidate.name}。`,
      ],
    };
  }

  if (bestCandidate.sourceType === '系统创建') {
    return {
      selectedPlan: [{ ...bestCandidate, installStatus: '已保存到系统' }],
      executionStatus: 'saved',
      status: '已执行',
      evidence: [
        `${timestamp} 一键执行最优方案：已保存系统创建能力 ${bestCandidate.name}，类型 ${bestCandidate.capabilityType}。`,
      ],
    };
  }

  if (isExternalCandidate(bestCandidate)) {
    return {
      selectedPlan: [{ ...bestCandidate, installStatus: '待用户确认' }],
      executionStatus: 'pending-confirm',
      status: '待用户确认',
      evidence: [
        `${timestamp} 一键执行最优方案：外部能力 ${bestCandidate.name} 未自动安装，仅标记为待用户确认，来源 ${bestCandidate.sourceUrl || bestCandidate.sourceLink || '未提供'}。`,
      ],
    };
  }

  return {
    selectedPlan: [{ ...bestCandidate, installStatus: '待用户确认' }],
    executionStatus: 'pending-confirm',
    status: '待用户确认',
    evidence: [
      `${timestamp} 一键执行最优方案：${bestCandidate.name} 来源类型需用户确认，未自动接入。`,
    ],
  };
}

export function Step08_AICombinationPlan() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const painPoints = useMemo(() => getPainPointsFromState(state), [state.stepResults]);
  const [localSources, setLocalSources] = useState<LocalCapabilitySource[]>(LOCAL_CAPABILITY_SOURCES);
  const [localSearchStatus, setLocalSearchStatus] = useState<SearchStatus>('待搜索');
  const [externalSearchStatus] = useState<SearchStatus>('待搜索');
  const [modalOpen, setModalOpen] = useState(true);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<CapabilityCandidate[]>([]);
  const [selectedScanResultIds, setSelectedScanResultIds] = useState<string[]>([]);
  const [acceptedLocalResults, setAcceptedLocalResults] = useState<CapabilityCandidate[]>([]);
  const [confirmedUsages, setConfirmedUsages] = useState<string[]>([]);
  const [externalSearchResultsByUsage, setExternalSearchResultsByUsage] = useState<Record<string, ExternalSearchResponse>>({});
  const [candidateOverrides, setCandidateOverrides] = useState<Record<string, Partial<CapabilityCandidate>>>({});
  const [externalSearchMessage, setExternalSearchMessage] = useState<string | null>(null);
  const [searchConfigModalOpen, setSearchConfigModalOpen] = useState(false);
  const [activeSearchPlatform, setActiveSearchPlatform] = useState<SearchSourcePlatform>('github');
  const [searchSourceConfig, setSearchSourceConfig] = useState<SearchSourceConfig>(() => loadStoredSearchConfig());
  const [githubConfigStatus, setGithubConfigStatus] = useState<string>(() => loadStoredGitHubStatus());
  const [searchConfigMessage, setSearchConfigMessage] = useState<string | null>(null);
  const [selectedSystemCapabilityTypeByUsage, setSelectedSystemCapabilityTypeByUsage] = useState<Record<string, string>>({});
  const [expandedSystemCapabilityIdsByUsage, setExpandedSystemCapabilityIdsByUsage] = useState<Record<string, string[]>>({});
  const [bestPlanModalOpen, setBestPlanModalOpen] = useState(false);
  const [bestPlanRecords, setBestPlanRecords] = useState<Record<string, BestPlanExecutionRecord>>({});
  const [error, setError] = useState<string | null>(null);

  const localPathLabel = localSources
    .filter(source => source.status === '已连接' || source.status === '已扫描')
    .map(source => `${source.name}: ${source.path || '默认系统能力库'}`)
    .join('；');

  const saveGitHubStatus = (status: string) => {
    setGithubConfigStatus(status);
    const stored = JSON.parse(window.localStorage.getItem(SEARCH_SOURCE_STATUS_KEY) || '{}');
    window.localStorage.setItem(SEARCH_SOURCE_STATUS_KEY, JSON.stringify({ ...stored, github: status }));
  };

  const updateSearchSourceConfig = (patch: Partial<SearchSourceConfig>) => {
    setSearchSourceConfig(prev => {
      const next = { ...prev, ...patch };
      window.localStorage.setItem(SEARCH_SOURCE_CONFIG_KEY, JSON.stringify({ ...next, githubToken: '' }));
      return next;
    });
  };

  useEffect(() => {
    api.getGitHubSearchConfig()
      .then(result => {
        if (result.configured) saveGitHubStatus('已配置');
      })
      .catch(() => {
        if (githubConfigStatus === '未配置') saveGitHubStatus('连接失败');
      });
  }, []);

  const basePlans = useMemo(
    () => buildCapabilityAssemblyPlans(painPoints, { localPath: localPathLabel, localSearchStatus, externalSearchStatus, externalSearchResultsByUsage }),
    [painPoints, localPathLabel, localSearchStatus, externalSearchStatus, externalSearchResultsByUsage]
  );

  const performExternalSearch = async (aiUsage: string, relatedPainPoints: string[]) => {
    const keywords = getExternalSearchKeywords(aiUsage, relatedPainPoints).slice(0, 3);
    setExternalSearchResultsByUsage(prev => ({
      ...prev,
      [aiUsage]: {
        aiUsage,
        generatedKeywords: keywords,
        platformStatuses: [
          { platform: 'GitHub', status: '搜索中', evidence: '已进入后端搜索队列，每次只请求 1 个关键词。' },
          { platform: 'OpenClaw Skills / ClawHub', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
          { platform: 'OpenClaw Skill Registry', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
          { platform: 'MCP Server 相关仓库', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
          { platform: '开源插件库', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
          { platform: '工具官网', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
        ],
        results: [],
      },
    }));

    try {
      const result = await api.searchExternalCapabilities({ aiUsage, painPoints: relatedPainPoints, keywords, limit: 5 });
      setExternalSearchResultsByUsage(prev => ({ ...prev, [aiUsage]: result }));
      const githubStatus = result.platformStatuses?.find((item: any) => item.platform === 'GitHub')?.status;
      if (githubStatus === '已真实搜索' || githubStatus === '使用缓存结果') saveGitHubStatus('已搜索');
      if (githubStatus === '搜索被限流') saveGitHubStatus('被限流');
      if (githubStatus === '搜索失败' && githubConfigStatus === '未配置') saveGitHubStatus('未配置');
    } catch (err: any) {
      setExternalSearchResultsByUsage(prev => ({
        ...prev,
        [aiUsage]: {
          aiUsage,
          generatedKeywords: keywords,
          platformStatuses: [
            { platform: 'GitHub', status: '搜索失败', evidence: err.message || '后端 GitHub 搜索代理调用失败' },
            { platform: 'OpenClaw Skills / ClawHub', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
            { platform: 'OpenClaw Skill Registry', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
            { platform: 'MCP Server 相关仓库', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
            { platform: '开源插件库', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
            { platform: '工具官网', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
          ],
          results: [],
        },
      }));
      saveGitHubStatus('搜索失败');
    }
  };

  useEffect(() => {
    let alive = true;
    const usageMap = new Map<string, string[]>();
    painPoints.forEach((point: any) => {
      (point.aiCombinations || []).forEach((usage: string) => {
        const normalized = usage.trim().replace(/\s+/g, ' ');
        if (!normalized) return;
        usageMap.set(normalized, [...(usageMap.get(normalized) || []), point.realPainPoint]);
      });
    });

    if (usageMap.size === 0) return;

    setExternalSearchMessage('正在通过后端代理自动执行 GitHub 搜索；OpenClaw / ClawHub / Skill Registry / MCP 市场暂未配置真实搜索接口，显示为平台待接入。');

    const runSearchQueue = async () => {
      for (const [aiUsage, relatedPainPoints] of Array.from(usageMap.entries())) {
        if (!alive) return;
        const keywords = getExternalSearchKeywords(aiUsage, relatedPainPoints).slice(0, 3);
        setExternalSearchResultsByUsage(prev => ({
          ...prev,
          [aiUsage]: {
            aiUsage,
            generatedKeywords: keywords,
            platformStatuses: [
              { platform: 'GitHub', status: '搜索中', evidence: '已进入后端搜索队列，每次只请求 1 个关键词。' },
              { platform: 'OpenClaw Skills / ClawHub', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
              { platform: 'OpenClaw Skill Registry', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
              { platform: 'MCP Server 相关仓库', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
              { platform: '开源插件库', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
              { platform: '工具官网', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
            ],
            results: [],
          },
        }));

        try {
          const result = await api.searchExternalCapabilities({
            aiUsage,
            painPoints: relatedPainPoints,
            keywords,
            limit: 5,
          });
          if (!alive) return;
          setExternalSearchResultsByUsage(prev => ({ ...prev, [aiUsage]: result }));
        } catch (err: any) {
          if (!alive) return;
          setExternalSearchResultsByUsage(prev => ({
            ...prev,
            [aiUsage]: {
              aiUsage,
              generatedKeywords: keywords,
              platformStatuses: [
                { platform: 'GitHub', status: '搜索失败', evidence: err.message || '后端 GitHub 搜索代理调用失败' },
                { platform: 'OpenClaw Skills / ClawHub', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
                { platform: 'OpenClaw Skill Registry', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
                { platform: 'MCP Server 相关仓库', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
                { platform: '开源插件库', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
                { platform: '工具官网', status: '平台待接入', evidence: '暂未配置真实搜索接口，等待接入。' },
              ],
              results: [],
            },
          }));
        }
      }
    };

    runSearchQueue();

    return () => {
      alive = false;
    };
  }, [painPoints]);

  const capabilityAssemblyPlans = useMemo(
    () => basePlans
      .map(plan => mergeLocalResults(plan, acceptedLocalResults))
      .map(plan => ({
        ...plan,
        localSearchResults: plan.localSearchResults.map(candidate => ({ ...candidate, ...candidateOverrides[candidate.id] })),
        externalSearchResults: plan.externalSearchResults.map(candidate => ({ ...candidate, ...candidateOverrides[candidate.id] })),
        systemCreatedCapabilities: plan.systemCreatedCapabilities.map(candidate => ({ ...candidate, ...candidateOverrides[candidate.id] })),
        scoredCandidates: plan.scoredCandidates.map(candidate => ({ ...candidate, ...candidateOverrides[candidate.id] })),
        finalRecommendedCapabilities: plan.finalRecommendedCapabilities.map(candidate => ({ ...candidate, ...candidateOverrides[candidate.id] })),
        selectedPlan: bestPlanRecords[plan.aiUsage]?.selectedPlan,
        executionStatus: bestPlanRecords[plan.aiUsage]?.executionStatus,
        evidence: bestPlanRecords[plan.aiUsage] ? [...plan.evidence, ...bestPlanRecords[plan.aiUsage].evidence] : plan.evidence,
        confirmed: confirmedUsages.includes(plan.aiUsage) || Boolean(bestPlanRecords[plan.aiUsage]),
        status: bestPlanRecords[plan.aiUsage]?.status || (confirmedUsages.includes(plan.aiUsage) ? '用户已确认' as const : plan.status),
      })),
    [basePlans, acceptedLocalResults, confirmedUsages, candidateOverrides, bestPlanRecords]
  );

  const [selectedUsage, setSelectedUsage] = useState('');
  const currentPlan: CapabilityAssemblyPlan | undefined = capabilityAssemblyPlans.find(plan => plan.aiUsage === (selectedUsage || capabilityAssemblyPlans[0]?.aiUsage));
  const canScan = localSources.some(source => source.status === '已连接' || source.status === '已扫描');
  const allUsagesHandled = capabilityAssemblyPlans.length > 0 && capabilityAssemblyPlans.every(plan => plan.confirmed);

  const handleChooseFolder = async (sourceId: string) => {
    setModalMessage(null);
    if (!window.showDirectoryPicker) {
      setModalMessage('当前浏览器不支持直接选择本地文件夹，请在桌面端或后端服务中配置能力库路径。');
      return;
    }

    try {
      const handle = await window.showDirectoryPicker();
      setLocalSources(prev => prev.map(source => source.id === sourceId
        ? { ...source, status: '已连接', path: handle.name }
        : source
      ));
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setModalMessage(err.message || '选择本地文件夹失败。');
        setLocalSources(prev => prev.map(source => source.id === sourceId ? { ...source, status: '扫描失败' } : source));
      }
    }
  };

  const handleScanLocalLibraries = () => {
    if (!canScan) return;
    setModalMessage(null);
    setLocalSources(prev => prev.map(source => (source.status === '已连接' || source.status === '已扫描')
      ? { ...source, status: '扫描中' }
      : source
    ));

    window.setTimeout(() => {
      setLocalSources(prev => prev.map(source => source.status === '扫描中' ? { ...source, status: '已扫描' } : source));
      const results = createLocalScanResults(localSources, capabilityAssemblyPlans);
      setScanResults(results);
      setSelectedScanResultIds(results.map(result => result.id));
      setLocalSearchStatus('Demo 模拟');
      setModalMessage('扫描完成：当前为 Demo 模拟结果，未真实读取本地文件内容。请确认要使用的本地能力。');
    }, 400);
  };

  const handleToggleScanResult = (id: string) => {
    setSelectedScanResultIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleConfirmLocalResults = () => {
    const selected = scanResults.filter(result => selectedScanResultIds.includes(result.id));
    setAcceptedLocalResults(selected);
    setModalOpen(false);
    setModalMessage(null);
  };

  const handleSkipLocal = () => {
    setLocalSearchStatus('已跳过');
    setAcceptedLocalResults([]);
    setModalOpen(false);
  };

  const handleConfirmCurrent = () => {
    if (!currentPlan) return;
    setConfirmedUsages(prev => Array.from(new Set([...prev, currentPlan.aiUsage])));
    setError(null);
  };

  const handleSkipCurrent = () => {
    if (!currentPlan) return;
    setConfirmedUsages(prev => Array.from(new Set([...prev, currentPlan.aiUsage])));
    setError(null);
  };

  const buildDraftPayload = (plans: CapabilityAssemblyPlan[], draft = true) => ({
    capabilityAssemblyPlan: plans,
    localCapabilitySearchResults: acceptedLocalResults,
    externalSearchResults: plans.flatMap(plan => plan.externalSearchResults || []),
    systemCreatedCapabilities: plans.flatMap(plan => plan.systemCreatedCapabilities || []),
    finalRecommendedCapabilities: plans.flatMap(plan => plan.finalRecommendedCapabilities || []),
    abilitySelections: plans.map(plan => ({
      aiUsage: plan.aiUsage,
      selectedCapabilities: plan.selectedPlan?.length ? plan.selectedPlan : plan.finalRecommendedCapabilities,
      selectedPlan: plan.selectedPlan || [],
      executionStatus: plan.executionStatus,
      evidence: plan.evidence,
      confirmed: plan.confirmed,
    })),
    localCapabilitySources: localSources,
    searchSourceStatus: {
      github: githubConfigStatus,
    },
    draft,
    generatedAt: new Date().toISOString(),
  });

  const handleSaveDraft = () => {
    dispatch({
      type: 'SET_STEP_RESULT',
      step: '08-capability-precheck',
      result: buildDraftPayload(capabilityAssemblyPlans, true),
    });
    setError(null);
    setExternalSearchMessage('能力装配草稿已保存。');
  };

  const executeBestPlan = (mode: BestPlanMode) => {
    const records = capabilityAssemblyPlans.reduce<Record<string, BestPlanExecutionRecord>>((acc, plan) => {
      acc[plan.aiUsage] = buildBestPlanRecord(plan, mode);
      return acc;
    }, {});

    const candidateStatusOverrides = Object.values(records).reduce<Record<string, Partial<CapabilityCandidate>>>((acc, record) => {
      const selectedCandidate = record.selectedPlan[0];
      if (mode === 'execute' && selectedCandidate) {
        acc[selectedCandidate.id] = {
          installStatus: selectedCandidate.installStatus,
          recommendationReason: `${selectedCandidate.recommendationReason} 一键执行最优方案已处理，执行状态：${record.executionStatus}。`,
        };
      }
      return acc;
    }, {});

    if (mode === 'execute') {
      setCandidateOverrides(prev => ({ ...prev, ...candidateStatusOverrides }));
    }
    setBestPlanRecords(records);
    setConfirmedUsages(prev => Array.from(new Set([...prev, ...capabilityAssemblyPlans.map(plan => plan.aiUsage)])));

    const updatedPlans = capabilityAssemblyPlans.map(plan => {
      const record = records[plan.aiUsage];
      return {
        ...plan,
        confirmed: true,
        selectedPlan: record.selectedPlan,
        executionStatus: record.executionStatus,
        status: record.status,
        evidence: [...plan.evidence, ...record.evidence],
      };
    });

    dispatch({
      type: 'SET_STEP_RESULT',
      step: '08-capability-precheck',
      result: buildDraftPayload(updatedPlans, true),
    });

    setBestPlanModalOpen(false);
    setError(null);
    setExternalSearchMessage(mode === 'save-only'
      ? '推荐方案已保存，未改变安装 / 接入状态。'
      : '最优方案已生成。外部能力需用户确认后再安装 / 接入。'
    );
  };

  const openSearchConfigModal = (platform: SearchSourcePlatform = 'github') => {
    setActiveSearchPlatform(platform);
    setSearchConfigMessage(null);
    setSearchConfigModalOpen(true);
  };

  const handleSaveGitHubToken = async () => {
    if (!searchSourceConfig.githubToken.trim()) {
      setSearchConfigMessage('请先输入 GitHub Token。');
      saveGitHubStatus('未配置');
      return;
    }

    try {
      await api.saveGitHubSearchToken(searchSourceConfig.githubToken.trim());
      updateSearchSourceConfig({ githubToken: '' });
      saveGitHubStatus('已配置');
      setSearchConfigMessage('GitHub Token 已保存到后端运行时配置。正式环境建议写入 .env 的 GITHUB_TOKEN。');
    } catch (err: any) {
      saveGitHubStatus('连接失败');
      setSearchConfigMessage(err.message || '保存 GitHub Token 失败。');
    }
  };

  const handleTestGitHubConnection = async () => {
    try {
      const result = await api.testGitHubSearchConnection(searchSourceConfig.githubToken.trim() || undefined);
      saveGitHubStatus(result.connected ? '已配置' : result.status || '连接失败');
      setSearchConfigMessage(result.connected ? 'GitHub 已连接' : result.evidence || 'GitHub 连接失败');
    } catch (err: any) {
      saveGitHubStatus('连接失败');
      setSearchConfigMessage(err.message || 'GitHub 连接失败。');
    }
  };

  const handleSavePlaceholderConfig = (platform: SearchSourcePlatform) => {
    updateSearchSourceConfig({});
    setSearchConfigMessage(`${platform} 配置已保存为本地草案；当前暂未配置真实搜索接口，等待接入。`);
  };

  const handleTestPlaceholderConfig = (platform: SearchSourcePlatform) => {
    setSearchConfigMessage(`${platform} 当前为平台待接入，尚不能执行真实连接测试。`);
  };

  const handleReSearchCurrent = async () => {
    if (!currentPlan) return;
    setExternalSearchMessage('正在重新搜索当前 AI 组合用法的 GitHub 开源能力。');
    await performExternalSearch(currentPlan.aiUsage, currentPlan.relatedPainPoints);
  };

  const handleEnterSystemCreated = () => {
    const element = document.getElementById('system-created-capabilities');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSelectSystemCapabilityType = (type: string) => {
    if (!currentPlan) return;
    setSelectedSystemCapabilityTypeByUsage(prev => ({ ...prev, [currentPlan.aiUsage]: type }));
    const firstCandidate = currentPlan.systemCreatedCapabilities.find(candidate => getSystemCapabilityType(candidate) === type);
    setExpandedSystemCapabilityIdsByUsage(prev => ({
      ...prev,
      [currentPlan.aiUsage]: firstCandidate ? [firstCandidate.id] : [],
    }));
  };

  const handleToggleSystemCapabilityExpanded = (id: string) => {
    if (!currentPlan) return;
    setExpandedSystemCapabilityIdsByUsage(prev => {
      const current = prev[currentPlan.aiUsage] || [];
      return {
        ...prev,
        [currentPlan.aiUsage]: current.includes(id)
          ? current.filter(item => item !== id)
          : [...current, id],
      };
    });
  };

  const getPlatformActionLabel = (platform: string, status: SearchStatus) => {
    if (platform.includes('GitHub')) {
      if (githubConfigStatus === '未配置' || githubConfigStatus === '连接失败') return '配置 GitHub Token';
      if (status === '搜索失败' || status === '搜索被限流' || status === '被限流') return '重新搜索';
      if (status === '已真实搜索' || status === '使用缓存结果' || status === '已搜索') return '查看结果';
      return '重新搜索';
    }
    if (platform.includes('OpenClaw Skills') || platform.includes('ClawHub')) return searchSourceConfig.openClawApiUrl ? '搜索 OpenClaw' : '连接 OpenClaw';
    if (platform.includes('Skill Registry')) return '连接 Skill Registry';
    if (platform.includes('MCP')) return '连接 MCP 市场';
    if (platform.includes('插件')) return '配置插件源';
    return '配置官网搜索';
  };

  const handlePlatformAction = async (platform: string, status: SearchStatus) => {
    const action = getPlatformActionLabel(platform, status);
    if (action === '配置 GitHub Token') {
      openSearchConfigModal('github');
      return;
    }
    if (action === '重新搜索' || action === '搜索 OpenClaw') {
      if (platform.includes('GitHub')) await handleReSearchCurrent();
      else openSearchConfigModal(platformToConfigTab(platform));
      return;
    }
    if (action === '查看结果') {
      const element = document.getElementById('external-search-result-cards');
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    openSearchConfigModal(platformToConfigTab(platform));
  };

  const handleCapabilityAction = (candidate: CapabilityCandidate, action: string) => {
    if (action === '查看来源') {
      const url = candidate.sourceUrl || candidate.sourceLink;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (action === '下载到本地') {
      setExternalSearchMessage('当前浏览器环境无法直接写入本地目录，请在桌面端或后端服务中完成下载。后续接入 Electron / Node 后端后，可执行真实下载。');
      return;
    }

    if (action === '安装 / 接入') {
      const confirmed = window.confirm('外部插件 / Skill 可能访问本地文件、执行命令或调用外部服务。安装前请确认来源可信。是否继续标记为待验证？');
      if (!confirmed) return;
      setCandidateOverrides(prev => ({
        ...prev,
        [candidate.id]: {
          installStatus: '待验证',
          risk: `${candidate.risk} 已触发安装安全确认，正式接入前仍需人工验证 README、安装脚本和权限。`,
        },
      }));
      return;
    }

    if (action === '收藏') {
      setCandidateOverrides(prev => ({
        ...prev,
        [candidate.id]: { installStatus: '已收藏' },
      }));
      return;
    }

    if (action === '保存到系统') {
      const savedCandidate = {
        ...candidate,
        installStatus: '已保存到系统',
        savedStatus: ['已收藏', '待安装', '待验证'],
        savedAt: new Date().toISOString(),
      };
      const storageKey = 'kivi-taskos.capabilityLibrary.externalCandidates';
      const existing = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
      const nextSaved = [
        ...existing.filter((item: CapabilityCandidate) => item.id !== candidate.id),
        savedCandidate,
      ];
      window.localStorage.setItem(storageKey, JSON.stringify(nextSaved));
      setCandidateOverrides(prev => ({
        ...prev,
        [candidate.id]: {
          installStatus: '已保存到系统',
          status: candidate.status || '已真实搜索',
          recommendationReason: `${candidate.recommendationReason} 已保存到 KIVI TaskOS 能力库候选清单，状态：已收藏 / 待安装 / 待验证。`,
        },
      }));
      setExternalSearchMessage('已写入当前 KIVI TaskOS 能力库候选清单；状态标记为：已收藏 / 待安装 / 待验证。');
      return;
    }

    if (action === '跳过') {
      setCandidateOverrides(prev => ({
        ...prev,
        [candidate.id]: { installStatus: '已跳过' },
      }));
      return;
    }

    if (action === '替换') {
      setExternalSearchMessage('替换操作已记录：请从同一 AI 用法的其他候选中选择更高分能力，或继续使用系统自动创建能力。');
    }
  };

  const handleContinue = () => {
    const unconfirmed = capabilityAssemblyPlans.filter(plan => !plan.confirmed);
    if (unconfirmed.length > 0) {
      setError('还有 AI 组合用法未完成能力装配，请先确认、跳过或生成推荐方案。');
      return;
    }

    const confirmedPlans = capabilityAssemblyPlans
      .filter(plan => plan.confirmed)
      .map(plan => ({ ...plan, confirmed: true }));

    dispatch({
      type: 'SET_STEP_RESULT',
      step: '08-capability-precheck',
      result: buildDraftPayload(confirmedPlans, false),
    });
    dispatch({ type: 'SET_STEP', step: '11-multi-agent-judge' });
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">Step 8: AI 能力装配与工具选择</h2>
      <p className="text-gray-500 text-sm mb-6">
        系统根据 Step 5 的痛点和 AI 组合用法，装配本地能力、开源候选和系统自动创建能力，并给出最终推荐组合。
      </p>

      <button
        onClick={goToPrevStep}
        className="text-gray-400 hover:text-gray-600 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回上一步
      </button>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">
        <div className="space-y-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-gray-800">AI 组合用法列表</p>
              <button type="button" onClick={() => setModalOpen(true)} className="btn-secondary text-xs py-1 px-2">
                连接能力库
              </button>
            </div>
            <div className="space-y-2">
              {capabilityAssemblyPlans.map(plan => (
                <button
                  key={plan.aiUsage}
                  type="button"
                  onClick={() => setSelectedUsage(plan.aiUsage)}
                  className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                    currentPlan?.aiUsage === plan.aiUsage ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm text-gray-800">{plan.aiUsage}</span>
                    <StatusBadge status={plan.status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{plan.relatedPainPoints.length} 个相关痛点</p>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setBestPlanModalOpen(true)}
              className="mt-3 w-full h-10 rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              一键执行全部最优方案
            </button>
          </div>
        </div>

        {currentPlan && (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{currentPlan.aiUsage}</p>
                  <p className="text-sm text-gray-600 mt-1">当前能力装配任务 capabilityAssemblyTask</p>
                </div>
                <StatusBadge status={currentPlan.status} />
              </div>
              <div className="mt-3">
                <p className="text-xs font-medium text-blue-700 mb-1">相关痛点</p>
                <PillList items={currentPlan.relatedPainPoints} />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={handleConfirmCurrent} className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                  确认当前用法
                </button>
                <button type="button" onClick={handleSkipCurrent} className="h-10 px-4 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
                  跳过当前用法
                </button>
                <button type="button" onClick={() => setModalOpen(true)} className="h-10 px-4 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
                  重新连接本地能力库
                </button>
              </div>
            </div>

            <PlanSection title="1. 需要的能力类型">
              <PillList items={currentPlan.requiredCapabilityTypes} />
            </PlanSection>

            <PlanSection title="2. 本地能力搜索结果">
              <div className="flex items-center gap-2 mb-3">
                <StatusBadge status={currentPlan.localSearchStatus} />
                <span className="text-xs text-gray-500">{localPathLabel || '尚未连接本地能力库'}</span>
              </div>
              <div className="space-y-3">
                {currentPlan.localSearchResults.length > 0
                  ? currentPlan.localSearchResults.map(candidate => <CapabilityCard key={candidate.id} candidate={candidate} onAction={handleCapabilityAction} />)
                  : <p className="text-sm text-gray-400">暂无已确认的本地候选能力。请在弹窗中连接并扫描本地能力库，或跳过本地搜索。</p>}
              </div>
            </PlanSection>

            <PlanSection title="3. 开源平台搜索结果">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={currentPlan.externalSearchStatus} />
                  <span className="text-xs text-gray-500">GitHub / OpenClawAI / Claude Skill 社区 / MCP Server 市场 / 开源插件库 / 工具官网</span>
                </div>
                <button type="button" onClick={() => openSearchConfigModal('github')} className="btn-primary-uniform">
                  配置搜索源
                </button>
              </div>
              {externalSearchMessage && (
                <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  {externalSearchMessage}
                </div>
              )}
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">自动生成搜索关键词</p>
                <PillList items={currentPlan.externalSearchKeywords} />
              </div>
              <div className="mb-3 overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-600">平台</th>
                      <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-600">状态</th>
                      <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-600">证据</th>
                      <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPlan.externalPlatformStatuses.map(item => (
                      <tr key={item.platform}>
                        <td className="border border-gray-200 px-2 py-1">{item.platform}</td>
                        <td className="border border-gray-200 px-2 py-1"><StatusBadge status={item.status} /></td>
                        <td className="border border-gray-200 px-2 py-1 text-gray-600">{item.evidence}</td>
                        <td className="border border-gray-200 px-2 py-1">
                          <button type="button" onClick={() => handlePlatformAction(item.platform, item.status)} className="btn-secondary text-xs py-1 px-2">
                            {getPlatformActionLabel(item.platform, item.status)}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div id="external-search-result-cards" className="space-y-3">
                {currentPlan.externalSearchResults.length > 0
                  ? currentPlan.externalSearchResults.map(candidate => <CapabilityCard key={candidate.id} candidate={candidate} onAction={handleCapabilityAction} />)
                  : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-sm text-gray-600 mb-3">{getExternalSearchEmptyMessage(currentPlan.externalSearchStatus)}</p>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => openSearchConfigModal('github')} className="btn-secondary text-xs py-1 px-2">
                          配置 GitHub Token
                        </button>
                        <button type="button" onClick={handleReSearchCurrent} className="btn-secondary text-xs py-1 px-2">
                          重新搜索
                        </button>
                        <button type="button" onClick={handleEnterSystemCreated} className="btn-secondary text-xs py-1 px-2">
                          进入系统自动创建能力
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            </PlanSection>

            <div id="system-created-capabilities">
            <PlanSection title="4. 系统自动创建能力">
              <SystemCreatedCapabilitiesPanel
                candidates={currentPlan.systemCreatedCapabilities}
                selectedType={selectedSystemCapabilityTypeByUsage[currentPlan.aiUsage] || 'Prompt'}
                expandedIds={expandedSystemCapabilityIdsByUsage[currentPlan.aiUsage] || []}
                onSelectType={handleSelectSystemCapabilityType}
                onToggleExpanded={handleToggleSystemCapabilityExpanded}
                onAction={handleCapabilityAction}
              />
            </PlanSection>
            </div>

            <PlanSection title="5. 综合评分">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">能力</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">来源</th>
                      <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-600">综合分</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">证据状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPlan.scoredCandidates.map(candidate => (
                      <tr key={candidate.id}>
                        <td className="border border-gray-200 px-3 py-2">{candidate.name}</td>
                        <td className="border border-gray-200 px-3 py-2">{candidate.sourceType}</td>
                        <td className="border border-gray-200 px-3 py-2 text-center font-semibold text-blue-700">{candidate.score}</td>
                        <td className="border border-gray-200 px-3 py-2">{candidate.installStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PlanSection>

            <PlanSection title="6. 最终推荐能力组合">
              <div className="space-y-3">
                {currentPlan.finalRecommendedCapabilities.length > 0
                  ? currentPlan.finalRecommendedCapabilities.map(candidate => <CapabilityCard key={candidate.id} candidate={candidate} onAction={handleCapabilityAction} />)
                  : <p className="text-sm text-gray-400">暂无高匹配开源能力，建议由系统自动创建对应 Prompt / Skill / Agent / Hook / Workflow。</p>}
              </div>
              <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-100 p-3 text-sm text-yellow-800">
                不推荐项：未真实搜索或未完成安装验证的外部候选暂不建议直接接入，需用户确认后再下载 / 安装 / 保存到系统。
              </div>
            </PlanSection>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        <button type="button" onClick={goToPrevStep} className="btn-secondary-uniform">
          返回上一步
        </button>
        <button type="button" onClick={handleSaveDraft} className="btn-secondary-uniform">
          保存草稿
        </button>
        <button
          type="button"
          onClick={() => setBestPlanModalOpen(true)}
          className="h-11 px-5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
        >
          一键执行最优方案
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!allUsagesHandled}
          title={!allUsagesHandled ? '还有 AI 组合用法未完成能力装配，请先确认、跳过或生成推荐方案。' : undefined}
          className="btn-primary-uniform"
        >
          完成能力装配，继续
        </button>
      </div>

      <LocalCapabilityLibraryModal
        open={modalOpen}
        sources={localSources}
        scanResults={scanResults}
        selectedResultIds={selectedScanResultIds}
        message={modalMessage}
        canScan={canScan}
        onChooseFolder={handleChooseFolder}
        onScan={handleScanLocalLibraries}
        onToggleResult={handleToggleScanResult}
        onConfirmResults={handleConfirmLocalResults}
        onSkip={handleSkipLocal}
        onClose={() => setModalOpen(false)}
      />

      <SearchSourceConfigModal
        open={searchConfigModalOpen}
        activePlatform={activeSearchPlatform}
        config={searchSourceConfig}
        githubStatus={githubConfigStatus}
        message={searchConfigMessage}
        onChangePlatform={setActiveSearchPlatform}
        onChangeConfig={updateSearchSourceConfig}
        onSaveGitHub={handleSaveGitHubToken}
        onTestGitHub={handleTestGitHubConnection}
        onSavePlaceholder={handleSavePlaceholderConfig}
        onTestPlaceholder={handleTestPlaceholderConfig}
        onClose={() => setSearchConfigModalOpen(false)}
      />

      <BestPlanConfirmModal
        open={bestPlanModalOpen}
        onCancel={() => setBestPlanModalOpen(false)}
        onSaveOnly={() => executeBestPlan('save-only')}
        onExecute={() => executeBestPlan('execute')}
      />
    </div>
  );
}
