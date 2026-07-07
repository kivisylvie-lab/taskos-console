import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { api } from '../../utils/api';
import { ConfirmButton } from '../shared/ConfirmButton';
import { useAIConfig } from '../../store/AIConfigContext';
import { FileDropZone } from '../shared/FileDropZone';
import { matchScenarios, analyzeUserIntent, getFlowMeta } from '../../data/scenarioMatcher';
import type { ScenarioMatchSuggestion } from '../../data/scenarioMatcher';
import { SCENE_LABELS, getStepLabel } from '../../types/pipeline';
import type { SceneMatchResult, FlowMatchResult, SceneType } from '../../types/pipeline';
import { enableDemoMode, disableDemoMode } from '../../data/demoMode';

const PLACEHOLDER_EXAMPLES = [
  '我在做 AI 客服项目时卡住了，不知道怎么设计流程',
  '我想从 0 到 1 做一个产品项目',
  '我想上传一批资料，让系统学习并沉淀到知识库',
  '我有一个网址/视频，想让系统学习',
  '我看到一个 GitHub Skill，想判断能不能用',
  '我想把当前项目整理成老板汇报材料',
  '我想判断这个商业想法值不值得做',
  '我想让系统判断该用 Prompt、Skill、Agent、Hook、MCP 还是 Tool',
];

// 根据用户输入构建入口与流程路由判断结果（用于跳转到 Step 02）
function buildSceneMatchResult(taskInput: string): SceneMatchResult {
  return analyzeUserIntent(taskInput);
}

export function Step01_TaskInput() {
  const { state, dispatch } = usePipeline();
  const { config: aiConfig } = useAIConfig();
  const [taskInput, setTaskInput] = useState(state.taskInput || '');
  const [urlInput, setUrlInput] = useState('');
  const [urlList, setUrlList] = useState<string[]>(state.inputURLs || []);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>(state.uploadedFiles || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // 补充信息
  const [reportAudience, setReportAudience] = useState(state.supplementaryInfo.reportAudience);
  const [needsDeliverable, setNeedsDeliverable] = useState(state.supplementaryInfo.needsDeliverable);
  const [isProjectTask, setIsProjectTask] = useState(state.supplementaryInfo.isProjectTask);
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(state.supplementaryInfo.useKnowledgeBase);
  const [allowGitHubSearch, setAllowGitHubSearch] = useState(state.supplementaryInfo.allowGitHubSearch);
  const [allowCreateProject, setAllowCreateProject] = useState(state.supplementaryInfo.allowCreateProject);

  // 客户解决包模式专用字段
  const [companyName, setCompanyName] = useState(state.supplementaryInfo.companyName || '');
  const [industry, setIndustry] = useState(state.supplementaryInfo.industry || '');
  const [budget, setBudget] = useState(state.supplementaryInfo.budget || '');
  const [timeline, setTimeline] = useState(state.supplementaryInfo.timeline || '');

  // 场景选择状态
  const [selectedSuggestion, setSelectedSuggestion] = useState<ScenarioMatchSuggestion | null>(
    state.selectedScene,
  );
  const [confirmed, setConfirmed] = useState(state.confirmedScene);

  // 防抖 timer
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 实时匹配
  const matchedSuggestions = useMemo(() => {
    if (!taskInput || taskInput.trim().length < 2) return [];
    return matchScenarios(taskInput, 5);
  }, [taskInput]);

  // 输入变化时清除选择和确认
  const handleInputChange = (value: string) => {
    setTaskInput(value);
    setSelectedSuggestion(null);
    setConfirmed(false);

    // 防抖 300ms 后显示推荐
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim().length >= 2) {
        setShowRecommendations(true);
      }
    }, 300);
  };

  // 清理防抖
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // 聚焦时如果已有足够输入，显示推荐
  const handleFocus = () => {
    if (taskInput.trim().length >= 2 && matchedSuggestions.length > 0) {
      setShowRecommendations(true);
    }
  };

  const handleFilesSelected = useCallback((files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddURL = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!urlList.includes(trimmed)) {
      setUrlList(prev => [...prev, trimmed]);
    }
    setUrlInput('');
  };

  const handleRemoveURL = (index: number) => {
    setUrlList(prev => prev.filter((_, i) => i !== index));
  };

  // 点击推荐卡片 → 选中
  const handleSelectSuggestion = (suggestion: ScenarioMatchSuggestion) => {
    setSelectedSuggestion(suggestion);
    setConfirmed(false);
  };

  // 确认选中场景 → 构建结果并跳转
  const handleConfirmScene = () => {
    if (!selectedSuggestion) return;

    // 保存输入到状态
    dispatch({ type: 'SET_TASK_INPUT', taskInput: taskInput.trim() });
    dispatch({ type: 'SET_UPLOADED_FILES', files: uploadedFiles });
    dispatch({ type: 'SET_INPUT_URLS', urls: urlList });
    dispatch({
      type: 'SET_SUPPLEMENTARY_INFO',
      info: { reportAudience, needsDeliverable, isProjectTask, useKnowledgeBase, allowGitHubSearch, allowCreateProject },
    });

    // 构建 SceneMatchResult 并设为 Step 02 结果
    const sceneResult = buildSceneMatchResult(taskInput.trim());
    dispatch({ type: 'SET_STEP_RESULT', step: '02-scene-match', result: sceneResult });
    dispatch({ type: 'SELECT_SCENE', scene: selectedSuggestion });
    dispatch({ type: 'CONFIRM_SCENE' });

    setConfirmed(true);

    // 跳转到 Step 02（场景匹配确认）
    setTimeout(() => {
      dispatch({ type: 'SET_STEP', step: '02-scene-match' });
    }, 400);
  };

  // 取消选中 → 回到推荐列表
  const handleCancelSelection = () => {
    setSelectedSuggestion(null);
    setConfirmed(false);
  };

  // Demo Mode — 加载客户解决包演示案例 (Business Solution Mode)
  const handleLoadBusinessSolutionDemo = () => {
    disableDemoMode();

    const demoTaskText = `客户是一家年营收2亿的制造企业，最近供应链问题严重。部分SKU库存下降很快，销售部门担心断货。供应商A最近交付延期，供应商B价格更高但交期稳定。

客户提供了以下资料：
- 库存表（15个SKU，含周转天数）
- 销售预测数据
- 采购订单记录
- 供应商报价表
- 供应商交付异常记录
- 采购SOP

客户需要系统帮他：判断现在应该补什么、找谁补、有什么风险、怎么向老板汇报，并沉淀成供应链补货预警解决包。`;

    setTaskInput(demoTaskText);
    setReportAudience('client');
    setNeedsDeliverable('yes');
    setIsProjectTask('yes');
    setUseKnowledgeBase('yes');
    setAllowGitHubSearch('no');
    setAllowCreateProject('ask-first');

    const suggestions = matchScenarios(demoTaskText, 5);
    const topMatch = suggestions.find(s => s.scenario.sceneType === 'business-solution') || suggestions[0];

    if (topMatch) {
      setSelectedSuggestion(topMatch);
      enableDemoMode('business-solution');
      dispatch({ type: 'SET_DEMO_MODE', demoMode: true });

      dispatch({ type: 'SET_TASK_INPUT', taskInput: demoTaskText });
      dispatch({ type: 'SET_UPLOADED_FILES', files: [] });
      dispatch({ type: 'SET_INPUT_URLS', urls: [] });
      dispatch({
        type: 'SET_SUPPLEMENTARY_INFO',
        info: { reportAudience: 'client', needsDeliverable: 'yes', isProjectTask: 'yes', useKnowledgeBase: 'yes', allowGitHubSearch: 'no', allowCreateProject: 'ask-first' },
      });

      const sceneResult = buildSceneMatchResult(demoTaskText);
      dispatch({ type: 'SET_STEP_RESULT', step: '02-scene-match', result: sceneResult });
      dispatch({ type: 'SELECT_SCENE', scene: topMatch });
      dispatch({ type: 'CONFIRM_SCENE' });
      setConfirmed(true);

      setTimeout(() => {
        dispatch({ type: 'SET_STEP', step: '02-scene-match' });
      }, 500);
    }
  };

  // Demo Mode — 加载供应链演示案例
  const handleLoadSupplyChainDemo = () => {
    disableDemoMode(); // 先清除旧状态

    const demoTaskText = `我们公司的供应链最近问题很多。库存周转慢，有些SKU积压严重，有些又经常缺货。供应商交期不稳定，采购订单经常延迟。老板让我出一份供应链优化方案，要能直接给管理层看的。

具体问题：
1. 库存周转天数平均 45 天，目标是降到 30 天
2. 有 15 个 SKU，其中 3 个经常缺货，5 个积压严重
3. 供应商有 8 家，交期准时率只有 70%
4. 采购订单有 20% 延迟到货
5. 老板下周要开会讨论这个问题

我需要系统帮我：分析库存风险、给出补货优先级、评估供应商表现、生成给老板看的汇报材料。`;

    setTaskInput(demoTaskText);
    setReportAudience('boss');
    setNeedsDeliverable('yes');
    setIsProjectTask('yes');
    setUseKnowledgeBase('yes');
    setAllowGitHubSearch('no');
    setAllowCreateProject('ask-first');

    // 自动匹配场景
    const suggestions = matchScenarios(demoTaskText, 5);
    const topMatch = suggestions.find(s => s.scenario.sceneType === 'task-execution-loop') || suggestions[0];

    if (topMatch) {
      setSelectedSuggestion(topMatch);

      // 启用 Demo Mode
      enableDemoMode('supply-chain');
      dispatch({ type: 'SET_DEMO_MODE', demoMode: true });

      // 保存所有输入到状态
      dispatch({ type: 'SET_TASK_INPUT', taskInput: demoTaskText });
      dispatch({ type: 'SET_UPLOADED_FILES', files: [] });
      dispatch({ type: 'SET_INPUT_URLS', urls: [] });
      dispatch({
        type: 'SET_SUPPLEMENTARY_INFO',
        info: { reportAudience: 'boss', needsDeliverable: 'yes', isProjectTask: 'yes', useKnowledgeBase: 'yes', allowGitHubSearch: 'no', allowCreateProject: 'ask-first' },
      });

      // 构建场景匹配结果并跳转
      const sceneResult = buildSceneMatchResult(demoTaskText);
      dispatch({ type: 'SET_STEP_RESULT', step: '02-scene-match', result: sceneResult });
      dispatch({ type: 'SELECT_SCENE', scene: topMatch });
      dispatch({ type: 'CONFIRM_SCENE' });
      setConfirmed(true);

      setTimeout(() => {
        dispatch({ type: 'SET_STEP', step: '02-scene-match' });
      }, 500);
    }
  };

  // API 场景匹配（备选方案 —— 当用户不确定时使用）
  const handleAPIMatchScene = async () => {
    if (!taskInput.trim()) return;
    setLoading(true);
    setError(null);

    dispatch({ type: 'SET_TASK_INPUT', taskInput: taskInput.trim() });
    dispatch({ type: 'SET_UPLOADED_FILES', files: uploadedFiles });
    dispatch({ type: 'SET_INPUT_URLS', urls: urlList });
    dispatch({
      type: 'SET_SUPPLEMENTARY_INFO',
      info: { reportAudience, needsDeliverable, isProjectTask, useKnowledgeBase, allowGitHubSearch, allowCreateProject },
    });

    try {
      const result = await api.matchScene({
        taskInput: taskInput.trim(),
        uploadedFileNames: uploadedFiles.map(f => f.name),
        inputURLs: urlList,
        supplementaryInfo: {
          reportAudience,
          needsDeliverable,
          isProjectTask,
          useKnowledgeBase,
          allowGitHubSearch,
          allowCreateProject,
        },
      }, aiConfig);

      dispatch({ type: 'SET_STEP_RESULT', step: '02-scene-match', result });
      dispatch({ type: 'SET_STEP', step: '02-scene-match' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---- 辅助渲染 ----
  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getConfidenceLabel = (confidence: string) => {
    switch (confidence) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return confidence;
    }
  };

  const getConfidenceEmoji = (confidence: string) => {
    switch (confidence) {
      case 'high': return '🟢';
      case 'medium': return '🟡';
      case 'low': return '⚪';
      default: return '⚪';
    }
  };

  const hasInput = taskInput.trim().length > 0;
  const hasRecommendations = matchedSuggestions.length > 0;
  const showCards = showRecommendations && hasRecommendations && !confirmed;
  const isBS = state.project?.sceneType === 'business-solution' || state.selectedScene?.scenario?.sceneType === 'business-solution';

  return (
    <div className="animate-fade-in-up">
      {/* 标题区 */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">
          <span className={isBS ? 'text-purple-600' : 'text-blue-600'}>Step 1</span>
          ：{isBS ? '客户需求输入' : '输入任务 / 模糊搜索'}
        </h2>
        <p className="text-gray-500">
          {isBS
            ? '描述客户业务需求，系统会自动匹配客户解决包模式。'
            : '用自然语言描述你想做什么，系统会自动匹配最合适的流程入口。'}
        </p>
      </div>

      {/* Demo Mode 按钮组 */}
      <div className="flex flex-col gap-3 mb-6">
        {/* 客户解决包演示案例 NEW */}
        <div className="card border-2 border-dashed border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🏢</span>
                <h3 className="font-semibold text-gray-800">客户解决包演示案例</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                  无需 API Key
                </span>
              </div>
              <p className="text-sm text-gray-500">
                一键加载供应链优化客户解决包 Demo，体验完整 Business Solution Mode：痛点拆解 → AI 组合方案 → 解决包封装 → 客户培训 → 指标验证。
              </p>
            </div>
            <button
              onClick={handleLoadBusinessSolutionDemo}
              disabled={loading}
              className="px-5 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap shadow-sm shadow-purple-200 disabled:opacity-50"
            >
              🏢 加载客户解决包演示
            </button>
          </div>
        </div>

        {/* 供应链演示案例 */}
        <div className="card border-2 border-dashed border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">📦</span>
                <h3 className="font-semibold text-gray-800">供应链演示案例</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                  无需 API Key
                </span>
              </div>
              <p className="text-sm text-gray-500">
                一键加载供应链补货决策 Demo，体验完整任务执行闭环。所有数据均为示例数据。
              </p>
            </div>
            <button
              onClick={handleLoadSupplyChainDemo}
              disabled={loading}
              className="px-5 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap shadow-sm shadow-orange-200 disabled:opacity-50"
            >
              📦 加载供应链演示案例
            </button>
          </div>
        </div>
      </div>

      {/* 主输入区 */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔍</span>
          <h3 className="text-lg font-semibold">你想让系统帮你做什么？</h3>
        </div>
        <textarea
          className="input-field min-h-[120px] resize-y text-base"
          placeholder={PLACEHOLDER_EXAMPLES.join('\n\n')}
          value={taskInput}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          autoFocus
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-400">
            试试输入「老板汇报」「上传资料」「卡住了」「做产品」「GitHub Skill」「视频学习」等模糊表达
          </p>
          <span className="text-xs text-gray-300">{taskInput.length}/500</span>
        </div>
      </div>

      {/* --- 智能推荐结果区 --- */}
      {showCards && (
        <div className="card mb-6 border-2 border-blue-100 bg-gradient-to-b from-blue-50/50 to-white">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">💡</span>
            <h3 className="text-lg font-semibold text-gray-800">
              系统可能理解为：
            </h3>
            <span className="text-xs text-gray-400 ml-auto">
              {matchedSuggestions.length} 个匹配场景
            </span>
          </div>

          <div className="space-y-3">
            {matchedSuggestions.map((suggestion) => {
              const isSelected = selectedSuggestion?.scenario.id === suggestion.scenario.id;
              return (
                <div
                  key={suggestion.scenario.id}
                  className={`
                    relative rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100 scale-[1.01]'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm hover:bg-blue-50/30'
                    }
                  `}
                  onClick={() => !confirmed && handleSelectSuggestion(suggestion)}
                >
                  {/* 置信度标签 */}
                  <div className="absolute top-3 right-3">
                    <span className={`
                      inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border
                      ${getConfidenceBadge(suggestion.confidence)}
                    `}>
                      {getConfidenceEmoji(suggestion.confidence)} 置信度{getConfidenceLabel(suggestion.confidence)}
                      <span className="text-xs opacity-60">({suggestion.score}分)</span>
                    </span>
                  </div>

                  {/* 场景名称 + 入口 */}
                  <div className="mb-2 pr-24">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        {suggestion.scenario.label}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                          ✅ 已选择
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-blue-700 font-medium mt-1">
                      → {suggestion.scenario.recommendedEntry}
                    </p>
                  </div>

                  {/* 匹配理由 */}
                  <p className="text-sm text-gray-500 mb-2">
                    {suggestion.scenario.description}
                  </p>

                  {/* 匹配详情 */}
                  <div className="flex flex-wrap gap-1.5">
                    {suggestion.matchedDetails.map((detail, i) => (
                      <span
                        key={i}
                        className="inline-block px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-600"
                      >
                        {detail}
                      </span>
                    ))}
                  </div>

                  {/* 选中后的操作按钮 */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-blue-200 flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleConfirmScene(); }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        ✅ 选择这个入口
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCancelSelection(); }}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 无匹配结果 */}
      {showRecommendations && hasInput && !hasRecommendations && (
        <div className="card mb-6 text-center py-8 bg-gray-50/50 border-dashed">
          <span className="text-3xl">🤔</span>
          <p className="text-gray-500 mt-3">
            暂未匹配到明确场景，建议进入普通任务分诊。
          </p>
          <button
            onClick={handleAPIMatchScene}
            disabled={loading}
            className="btn-primary mt-4"
          >
            进入任务分诊
          </button>
        </div>
      )}

      {/* 确认后过渡 */}
      {confirmed && selectedSuggestion && (
        <div className="card mb-6 border-2 border-green-200 bg-green-50/30 text-center py-6">
          <span className="text-4xl">🎯</span>
          <h3 className="text-xl font-bold text-green-800 mt-3">
            已选定：【{selectedSuggestion.scenario.label}】
          </h3>
          <p className="text-green-600 mt-2">
            系统建议进入「{selectedSuggestion.scenario.recommendedEntry}」流程。
          </p>
          <p className="text-sm text-green-500 mt-1">
            正在跳转到场景匹配确认页面...
          </p>
        </div>
      )}

      {/* 分隔线 */}
      {(showCards || confirmed) && (
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">更多选项</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
      )}

      {/* 上传资料区 */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-3">📎 上传资料</h3>
        <p className="text-sm text-gray-500 mb-3">
          支持文件、文件夹、图片、表格、文档、PDF、PPT、视频/音频、代码项目、压缩包
        </p>
        <FileDropZone onFilesSelected={handleFilesSelected} disabled={loading} />

        {uploadedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploadedFiles.map((file, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{file.name.match(/\.(jpg|png|gif|svg|webp)$/i) ? '🖼️' :
                    file.name.match(/\.(xlsx?|csv)$/i) ? '📊' :
                    file.name.match(/\.(pdf)$/i) ? '📄' :
                    file.name.match(/\.(pptx?)$/i) ? '📽️' :
                    file.name.match(/\.(mp4|mov|avi)$/i) ? '🎬' :
                    file.name.match(/\.(zip|rar|7z|tar|gz)$/i) ? '📦' :
                    file.name.match(/\.(js|ts|py|go|rs|java)$/i) ? '💻' : '📁'}</span>
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-400">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveFile(i)}
                  className="text-red-400 hover:text-red-600 text-sm"
                  disabled={loading}
                >
                  移除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* URL / 链接输入区 */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-3">🔗 URL / 视频链接</h3>
        <p className="text-sm text-gray-500 mb-3">
          支持网页链接、GitHub 链接、文档链接、视频链接、课程链接、产品官网、竞品链接
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            className="input-field flex-1"
            placeholder="https://..."
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddURL())}
            disabled={loading}
          />
          <button
            onClick={handleAddURL}
            className="btn-primary"
            disabled={!urlInput.trim() || loading}
          >
            添加
          </button>
        </div>

        {urlList.length > 0 && (
          <div className="mt-4 space-y-2">
            {urlList.map((url, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {url.includes('github.com') ? '🐙' :
                     url.includes('youtube.com') || url.includes('bilibili.com') ? '▶️' :
                     url.includes('docs.') ? '📖' : '🌐'}
                  </span>
                  <span className="text-sm text-gray-700 truncate max-w-md">{url}</span>
                </div>
                <button
                  onClick={() => handleRemoveURL(i)}
                  className="text-red-400 hover:text-red-600 text-sm"
                  disabled={loading}
                >
                  移除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 可选补充信息 */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">⚙️ 可选补充信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">汇报对象</label>
            <select
              className="input-field"
              value={reportAudience}
              onChange={e => setReportAudience(e.target.value as any)}
              disabled={loading}
            >
              <option value="">不指定</option>
              <option value="self">自己</option>
              <option value="boss">老板</option>
              <option value="client">客户</option>
              <option value="hr">HR / 面试官</option>
              <option value="investor">投资方</option>
              <option value="team">团队</option>
            </select>
          </div>

          <div>
            <label className="label">是否需要生成交付物</label>
            <select
              className="input-field"
              value={needsDeliverable}
              onChange={e => setNeedsDeliverable(e.target.value as any)}
              disabled={loading}
            >
              <option value="uncertain">不确定</option>
              <option value="yes">是</option>
              <option value="no">否</option>
            </select>
          </div>

          <div>
            <label className="label">是否是项目型任务</label>
            <select
              className="input-field"
              value={isProjectTask}
              onChange={e => setIsProjectTask(e.target.value as any)}
              disabled={loading}
            >
              <option value="uncertain">不确定</option>
              <option value="yes">是</option>
              <option value="no">否</option>
            </select>
          </div>

          <div>
            <label className="label">是否需要使用知识库</label>
            <select
              className="input-field"
              value={useKnowledgeBase}
              onChange={e => setUseKnowledgeBase(e.target.value as any)}
              disabled={loading}
            >
              <option value="uncertain">不确定</option>
              <option value="yes">是</option>
              <option value="no">否</option>
            </select>
          </div>

          <div>
            <label className="label">是否允许搜索 GitHub 能力</label>
            <select
              className="input-field"
              value={allowGitHubSearch}
              onChange={e => setAllowGitHubSearch(e.target.value as any)}
              disabled={loading}
            >
              <option value="ask-first">先询问</option>
              <option value="yes">是</option>
              <option value="no">否</option>
            </select>
          </div>

          <div>
            <label className="label">是否允许创建项目文件夹</label>
            <select
              className="input-field"
              value={allowCreateProject}
              onChange={e => setAllowCreateProject(e.target.value as any)}
              disabled={loading}
            >
              <option value="ask-first">先询问</option>
              <option value="yes">是</option>
              <option value="no">否</option>
            </select>
          </div>
        </div>

        {/* 客户解决包模式专用字段 */}
        {isBS && (
          <div className="mt-4 pt-4 border-t border-purple-200">
            <p className="text-sm text-purple-600 font-medium mb-3">🏢 客户业务信息（客户解决包模式专用）</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">企业名称</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="如：XX制造有限公司"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="label">行业</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="如：制造业、零售、物流"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="label">预算范围</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="如：10-50万"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="label">时间要求</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="如：2周内交付"
                  value={timeline}
                  onChange={e => setTimeline(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 错误 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* 底部操作区 */}
      <div className="text-center space-y-3">
        {/* 备选：直接 API 场景匹配 */}
        <ConfirmButton
          onClick={handleAPIMatchScene}
          disabled={!hasInput}
          loading={loading}
          label={hasRecommendations ? '或使用 AI 深度场景匹配' : '开始场景匹配'}
          variant={hasRecommendations ? 'secondary' : 'primary'}
        />
        <p className="text-xs text-gray-400">
          系统将根据你的输入自动判断最合适的流程入口，不会直接创建项目。
        </p>
      </div>
    </div>
  );
}
