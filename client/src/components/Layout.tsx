import React, { ReactNode, useState } from 'react';
import { StepIndicator } from './StepIndicator';
import { usePipeline } from '../store/PipelineContext';
import { AIConfigStatus } from './AIConfigStatus';
import { AIConfigPanel } from './AIConfigPanel';

const SIDEBAR_SECTIONS = [
  {
    title: '项目工作',
    items: ['工作台', '新建客户解决包', '我的项目', '客户解决包模板'],
  },
  {
    title: '能力系统',
    items: ['AI 能力路由内核', '知识库', '工具 / 插件 / MCP', 'AIGC 生成中心', '自动化工作流', '多 Agent 管理'],
  },
  {
    title: '交付运营',
    items: ['交付记录', '复盘沉淀', '指标验证'],
  },
  {
    title: '系统设置',
    items: ['账号设置', '系统设置'],
  },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <nav>
        {SIDEBAR_SECTIONS.map(section => (
          <div key={section.title}>
            <div className="sidebar-section-title">{section.title}</div>
            {section.items.map((item, index) => (
              <button
                key={item}
                type="button"
                className={`sidebar-item ${section.title === '项目工作' && index === 0 ? 'active' : ''}`}
              >
                {item}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { state } = usePipeline();
  const [currentView, setCurrentView] = useState<'workflow' | 'ai-config'>('workflow');

  const showWorkflow = currentView === 'workflow';

  return (
    <>
      <Sidebar />

      <div className="main-with-sidebar">
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="workflow-width px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">KIVI AI TaskOS Console</h1>
                  <p className="text-xs text-gray-500">AI 能力路由控制台</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {state.project && (
                  <>
                    <span className="badge badge-blue">{state.project.name}</span>
                    <span className="text-xs text-gray-400">ID: {state.project.id.substring(0, 8)}...</span>
                  </>
                )}
                <AIConfigStatus onClick={() => setCurrentView('ai-config')} />
              </div>
            </div>
          </header>

          {showWorkflow ? (
            <>
              {/* Step Indicator */}
              <div className="bg-white border-b border-gray-100">
                <div className="workflow-width px-6 py-4">
                  <StepIndicator />
                </div>
              </div>

              {/* Main Content */}
              <main className="workflow-width px-6 py-8">
                {state.error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">⚠️</span>
                      <p className="text-red-700 text-sm">{state.error}</p>
                    </div>
                  </div>
                )}
                {children}
              </main>
            </>
          ) : (
            <main className="workflow-width px-6 py-8">
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setCurrentView('workflow')}
                  className="btn-secondary text-sm"
                >
                  ← 返回当前流程
                </button>
              </div>
              <AIConfigPanel visible onClose={() => setCurrentView('workflow')} />
            </main>
          )}

          {/* Footer */}
          <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
            KIVI AI TaskOS Console v0.1.0 · 基于 KIVIDAILYLIFE 母库规则 · AI 辅助生成
          </footer>
            </div>
      </div>
    </>
  );
}
