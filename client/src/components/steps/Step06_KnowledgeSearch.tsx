import React, { useEffect, useState } from 'react';
import { usePipeline } from '../../store/PipelineContext';
import { useAIConfig } from '../../store/AIConfigContext';
import { api } from '../../utils/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';

/* ===== 知识库弹窗组件 ===== */
function KnowledgeBaseModal({ onClose, onReSearch }: { onClose: () => void; onReSearch: () => void }) {
  const [activeModule, setActiveModule] = useState<'upload' | 'manual' | 'connect' | 'overview'>('upload');
  const [manualText, setManualText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [knowledgeSupplemented, setKnowledgeSupplemented] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleManualSubmit = () => {
    if (manualText.trim()) {
      setKnowledgeSupplemented(true);
      setManualText('');
    }
  };

  const handleUploadSubmit = () => {
    if (uploadedFiles.length > 0) {
      setKnowledgeSupplemented(true);
    }
  };

  const handleReSearch = () => {
    onReSearch();
  };

  const supportedFileTypes = [
    { category: '文档', types: 'PDF / Word / TXT / Markdown / PPT / Excel', icon: '📄' },
    { category: '图片', types: 'PNG / JPG / JPEG', icon: '🖼️' },
    { category: '视频', types: 'MP4 / MOV', icon: '🎬' },
    { category: '音频', types: 'MP3 / WAV', icon: '🎵' },
  ];

  const connectionSystems = [
    { name: '本地文件夹', desc: '连接本地目录作为知识来源', icon: '📁', available: false },
    { name: '本地数据库', desc: '连接 SQLite / MySQL / PG 等', icon: '🗄️', available: false },
    { name: '企业共享盘 / NAS', desc: '连接公司内部共享存储', icon: '💾', available: false },
    { name: 'Notion', desc: '通过 Notion API 同步工作区', icon: '📝', available: false },
    { name: '飞书文档', desc: '接入飞书知识库与文档', icon: '📋', available: false },
    { name: 'Confluence', desc: '接入 Atlassian Confluence', icon: '📚', available: false },
    { name: 'API / Webhook / 自定义接口', desc: '通过标准接口接入任意知识系统', icon: '🔌', available: false },
  ];

  return (
    <div className="kb-modal-overlay" onClick={onClose}>
      <div className="kb-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="kb-modal-header">
          <h3 className="kb-modal-title">📚 知识库管理</h3>
          <button onClick={onClose} className="kb-modal-close">✕</button>
        </div>

        {/* Module Tabs */}
        <div className="kb-modal-tabs">
          <button
            className={`kb-tab ${activeModule === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveModule('upload')}
          >
            📤 上传知识资料
          </button>
          <button
            className={`kb-tab ${activeModule === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveModule('manual')}
          >
            ✍️ 手动录入知识
          </button>
          <button
            className={`kb-tab ${activeModule === 'connect' ? 'active' : ''}`}
            onClick={() => setActiveModule('connect')}
          >
            🔗 连接已有知识系统
          </button>
          <button
            className={`kb-tab ${activeModule === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveModule('overview')}
          >
            📊 查看当前知识库
          </button>
        </div>

        {/* Module Content */}
        <div className="kb-modal-body">
          {/* Module 1: 上传知识资料 */}
          {activeModule === 'upload' && (
            <div className="kb-module">
              <p className="kb-module-desc">
                上传本地文件作为知识来源，系统将自动解析并提取知识卡片。
              </p>

              <div className="kb-file-types">
                {supportedFileTypes.map(ft => (
                  <div key={ft.category} className="kb-file-type-card">
                    <span className="kb-file-type-icon">{ft.icon}</span>
                    <div>
                      <p className="kb-file-type-category">{ft.category}</p>
                      <p className="kb-file-type-formats">{ft.types}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="kb-upload-zone">
                <input
                  type="file"
                  id="kb-file-input"
                  multiple
                  onChange={handleFileChange}
                  className="kb-file-input-hidden"
                  accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.mp4,.mov,.mp3,.wav"
                />
                <label htmlFor="kb-file-input" className="kb-upload-label">
                  <span className="kb-upload-icon">📂</span>
                  <span>点击选择文件或拖拽到此处</span>
                  <span className="kb-upload-hint">支持文档、图片、视频、音频等多种格式</span>
                </label>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="kb-file-list">
                  <p className="kb-file-list-title">已选文件（{uploadedFiles.length}）：</p>
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="kb-file-item">
                      <span className="kb-file-name">📎 {f.name}</span>
                      <span className="kb-file-size">{(f.size / 1024).toFixed(1)} KB</span>
                      <button onClick={() => handleRemoveFile(i)} className="kb-file-remove">移除</button>
                    </div>
                  ))}
                  <button onClick={handleUploadSubmit} className="btn-primary-uniform" style={{ marginTop: 12 }}>
                    确认上传
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Module 2: 手动录入知识 */}
          {activeModule === 'manual' && (
            <div className="kb-module">
              <p className="kb-module-desc">
                直接粘贴或输入 SOP、制度、规则、经验说明等文本内容，系统将自动拆分为知识卡片。
              </p>

              <textarea
                className="kb-manual-input"
                rows={10}
                placeholder={`在此输入知识内容...\n\n示例：\n- 公司内部 SOP 流程\n- 项目管理制度\n- 技术开发规范\n- 过往项目经验总结\n- 行业知识与最佳实践`}
                value={manualText}
                onChange={e => setManualText(e.target.value)}
              />

              <div className="kb-manual-actions">
                <button
                  onClick={handleManualSubmit}
                  disabled={!manualText.trim()}
                  className="btn-primary-uniform"
                >
                  提交录入
                </button>
                <span className="kb-manual-hint">
                  {manualText.trim()
                    ? `已输入 ${manualText.length} 字符`
                    : '请输入至少一条知识内容'}
                </span>
              </div>
            </div>
          )}

          {/* Module 3: 连接已有知识系统 */}
          {activeModule === 'connect' && (
            <div className="kb-module">
              <p className="kb-module-desc">
                接入外部知识系统，实现知识自动同步。以下为未来支持的接入类型。
              </p>

              <div className="kb-connect-grid">
                {connectionSystems.map(sys => (
                  <div key={sys.name} className={`kb-connect-card ${sys.available ? 'available' : 'planned'}`}>
                    <div className="kb-connect-card-header">
                      <span className="kb-connect-icon">{sys.icon}</span>
                      <span className="kb-connect-name">{sys.name}</span>
                      <span className={`kb-connect-badge ${sys.available ? 'badge-green' : 'badge-gray'}`}>
                        {sys.available ? '已支持' : '规划中'}
                      </span>
                    </div>
                    <p className="kb-connect-desc">{sys.desc}</p>
                    {!sys.available && (
                      <button disabled className="kb-connect-btn-disabled">即将上线</button>
                    )}
                    {sys.available && (
                      <button className="btn-primary-uniform" style={{ height: 36, minWidth: 120, fontSize: 13 }}>
                        连接
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Module 4: 查看当前知识库 */}
          {activeModule === 'overview' && (
            <div className="kb-module">
              <p className="kb-module-desc">
                当前知识库的基本信息和统计数据。
              </p>

              <div className="kb-stats-grid">
                <div className="kb-stat-card">
                  <span className="kb-stat-icon">📁</span>
                  <div>
                    <p className="kb-stat-value">{uploadedFiles.length || 0}</p>
                    <p className="kb-stat-label">已上传资料数量</p>
                  </div>
                </div>
                <div className="kb-stat-card">
                  <span className="kb-stat-icon">🧠</span>
                  <div>
                    <p className="kb-stat-value">0</p>
                    <p className="kb-stat-label">已解析知识数量</p>
                  </div>
                </div>
                <div className="kb-stat-card">
                  <span className="kb-stat-icon">🕐</span>
                  <div>
                    <p className="kb-stat-value">--</p>
                    <p className="kb-stat-label">最近更新时间</p>
                  </div>
                </div>
              </div>

              <div className="kb-source-section">
                <p className="kb-source-title">当前知识来源</p>
                <div className="kb-source-list">
                  <div className="kb-source-item">
                    <span>📂</span>
                    <span>本地知识库文件（KIVIDAILYLIFE/知识库/）</span>
                    <span className="badge badge-green">活跃</span>
                  </div>
                  <div className="kb-source-item">
                    <span>📋</span>
                    <span>常用 Prompt 模板</span>
                    <span className="badge badge-green">活跃</span>
                  </div>
                  <div className="kb-source-item">
                    <span>📝</span>
                    <span>手动录入知识</span>
                    <span className={`badge ${manualText.trim() || uploadedFiles.length > 0 ? 'badge-green' : 'badge-gray'}`}>
                      {manualText.trim() || uploadedFiles.length > 0 ? '有新增' : '空'}
                    </span>
                  </div>
                  <div className="kb-source-item">
                    <span>🔗</span>
                    <span>外部知识系统连接</span>
                    <span className="badge badge-gray">未连接</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer — 知识补充后提示 */}
        {knowledgeSupplemented && (
          <div className="kb-research-prompt">
            <p>
              ✅ 知识已补充，是否重新检索？
            </p>
            <div className="kb-research-actions">
              <button onClick={handleReSearch} className="btn-primary-uniform" style={{ height: 40, minWidth: 140, fontSize: 14 }}>
                🔍 重新检索
              </button>
              <button onClick={onClose} className="btn-secondary-uniform" style={{ height: 40, minWidth: 140, fontSize: 14 }}>
                稍后再说
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== Step 6 主组件 ===== */
export function Step06_KnowledgeSearch() {
  const { state, dispatch, goToPrevStep } = usePipeline();
  const { config: aiConfig } = useAIConfig();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [showKBModal, setShowKBModal] = useState(false);

  useEffect(() => {
    if (!state.projectId) return;
    setLoading(true);
    api.searchKnowledge(state.projectId, aiConfig)
      .then(res => {
        setResult(res.result);
        dispatch({ type: 'SET_STEP_RESULT', step: '06-knowledge-search', result: res.result });
        if (res.project) dispatch({ type: 'SET_PROJECT', project: res.project });
      })
      .catch(err => dispatch({ type: 'SET_ERROR', error: `知识库检索失败: ${err.message}` }))
      .finally(() => setLoading(false));
  }, [state.projectId]);

  const handleContinue = () => dispatch({ type: 'SET_STEP', step: '07-delivery-type' });

  const handleReSearch = () => {
    setShowKBModal(false);
    if (!state.projectId) return;
    setLoading(true);
    api.searchKnowledge(state.projectId, aiConfig)
      .then(res => {
        setResult(res.result);
        dispatch({ type: 'SET_STEP_RESULT', step: '06-knowledge-search', result: res.result });
        if (res.project) dispatch({ type: 'SET_PROJECT', project: res.project });
      })
      .catch(err => dispatch({ type: 'SET_ERROR', error: `知识库检索失败: ${err.message}` }))
      .finally(() => setLoading(false));
  };

  if (loading) return <LoadingSpinner message="AI 正在检索知识库..." />;

  const hits = result?.hits || [];

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-1">Step 6: 知识库检索</h2>
      <p className="text-gray-500 text-sm mb-6">系统已检索知识库中的相关知识和经验</p>

      {result?.searchKeywords && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-1">检索关键词：</p>
          <div className="flex flex-wrap gap-1">
            {result.searchKeywords.map((kw: string, i: number) => (
              <span key={i} className="badge badge-blue">{kw}</span>
            ))}
          </div>
        </div>
      )}

      {hits.length === 0 ? (
        <div className="p-6 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-700 font-semibold text-base">📭 当前暂无可复用知识</p>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-lg mx-auto">
            系统暂未在知识库中找到与本次项目高度相关的知识内容。
            你可以继续基于当前客户资料推进，也可以先补充知识资料或连接已有知识系统后重新检索。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {hits.map((hit: any, i: number) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">{hit.cardName}</h4>
                <span className="badge badge-green">相关</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{hit.summary}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>📁 {hit.path}</span>
                <span>🏷️ {(hit.tags || []).join(', ')}</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">💡 使用方式：{hit.usage}</p>
            </div>
          ))}
        </div>
      )}

      {/* 底部按钮区 — 三按钮统一大小 */}
      <div className="flex items-center justify-center gap-3 pt-6 mt-4 border-t border-gray-100">
        <button onClick={goToPrevStep} className="btn-secondary-uniform">
          ← 返回上一步
        </button>
        <button onClick={() => setShowKBModal(true)} className="btn-kb-uniform">
          📚 知识库
        </button>
        <button onClick={handleContinue} className="btn-primary-uniform">
          确认，继续
        </button>
      </div>

      {/* 知识库弹窗 */}
      {showKBModal && (
        <KnowledgeBaseModal
          onClose={() => setShowKBModal(false)}
          onReSearch={handleReSearch}
        />
      )}
    </div>
  );
}
