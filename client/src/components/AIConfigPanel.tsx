import React, { useState } from 'react';
import { useAIConfig } from '../store/AIConfigContext';
import { AI_PLATFORM_DEFS } from '../types/ai-config';
import { maskApiKey, hasApiKey } from '../utils/ai-config-storage';
import type { AIPlatform } from '../types/ai-config';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AIConfigPanel({ visible, onClose }: Props) {
  const { config, updateConfig, setPlatform, resetConfig } = useAIConfig();

  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!visible) return null;

  const configured = hasApiKey(config);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ai-config/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: config.platform,
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          model: config.model,
        }),
      });
      const data = await res.json();
      setTestResult({ success: data.success, message: data.message });
    } catch (err: any) {
      setTestResult({ success: false, message: `网络请求失败: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    resetConfig();
    setConfirmDelete(false);
    setTestResult(null);
  };

  return (
    <div className="ai-config-panel animate-fade-in-up">
      <div className="max-w-6xl mx-auto px-6 py-4">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">⚙ AI 配置中心</h3>
            <p className="text-xs text-gray-500 mt-1">
              选择你的 AI 平台并配置 API Key，系统将使用你自己的 Key 执行 AI 场景匹配、能力路由和交付物生成。
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
            ✕
          </button>
        </div>

        {/* 平台选择 */}
        <div className="mb-4">
          <label className="label">AI 平台</label>
          <div className="platform-selector">
            {AI_PLATFORM_DEFS.map(def => (
              <button
                key={def.id}
                onClick={() => setPlatform(def.id)}
                className={`platform-card ${config.platform === def.id ? 'selected' : ''}`}
              >
                <div className="text-sm font-medium">{def.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{def.description}</div>
                {def.needsAnthropicSDK && (
                  <div className="text-xs text-orange-500 mt-0.5">⚠ 需额外 SDK</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div className="mb-4">
          <label className="label">
            API Key
            {configured && (
              <span className="text-xs text-gray-400 ml-2">
                (已保存: {maskApiKey(config.apiKey)})
              </span>
            )}
          </label>
          <div className="input-with-toggle">
            <input
              type={showKey ? 'text' : 'password'}
              className="input-field pr-16"
              placeholder="请输入你自己的 API Key"
              value={config.apiKey}
              onChange={e => updateConfig({ apiKey: e.target.value })}
            />
            <button
              type="button"
              className="toggle-btn"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? '隐藏' : '显示'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            请输入你自己在对应 AI 平台申请的 API Key。使用该 Key 会产生对应平台的 API 费用。
          </p>
        </div>

        {/* Base URL */}
        <div className="mb-4">
          <label className="label">Base URL</label>
          <input
            type="text"
            className="input-field"
            placeholder="https://api.example.com/v1"
            value={config.baseUrl}
            onChange={e => updateConfig({ baseUrl: e.target.value })}
          />
          <p className="text-xs text-gray-400 mt-1">
            支持 DeepSeek、OpenRouter、本地模型、自定义兼容接口。官方平台自动填充默认值。
          </p>
        </div>

        {/* 模型名称 */}
        <div className="mb-4">
          <label className="label">模型名称</label>
          <input
            type="text"
            className="input-field"
            placeholder="例如：deepseek-chat / gpt-4o / 自定义模型名"
            value={config.model}
            onChange={e => updateConfig({ model: e.target.value })}
          />
        </div>

        {/* 按钮 */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleTestConnection}
            disabled={testing || !config.apiKey.trim() || !config.model.trim()}
            className="btn-primary text-sm"
          >
            {testing ? '测试中...' : '🔌 测试连接'}
          </button>
          <button
            onClick={handleDelete}
            disabled={!configured}
            className="btn-secondary text-sm"
          >
            {confirmDelete ? '确认删除?' : '🗑 删除密钥'}
          </button>
          {confirmDelete && (
            <button
              onClick={() => setConfirmDelete(false)}
              className="btn-secondary text-sm"
            >
              取消
            </button>
          )}
        </div>

        {/* 测试结果 */}
        {testResult && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            testResult.success
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <div className="flex items-center gap-2">
              <span>{testResult.success ? '✅' : '❌'}</span>
              <span>{testResult.message}</span>
            </div>
          </div>
        )}

        {/* 安全警告 */}
        <div className="security-warning mb-4">
          <p>
            ⚠️ <strong>安全提醒：</strong>密钥保存在浏览器本地存储中，请勿在公共或共享电脑上使用。
            建议使用自己的 API Key。当前为本地 Demo 存储，生产环境应加密存储在后端。
          </p>
        </div>

        {/* 当前状态 */}
        <div className="text-xs text-gray-500 bg-gray-100 rounded-lg p-3">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1 pr-4 text-gray-400">当前平台</td>
                <td>{AI_PLATFORM_DEFS.find(d => d.id === config.platform)?.label || config.platform}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 text-gray-400">当前模型</td>
                <td>{config.model || '未设置'}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 text-gray-400">API Key</td>
                <td className={configured ? 'text-green-600' : 'text-orange-500'}>
                  {configured ? '已配置' : '未配置'}
                </td>
              </tr>
              <tr>
                <td className="py-1 pr-4 text-gray-400">连接状态</td>
                <td className={testResult
                  ? (testResult.success ? 'text-green-600' : 'text-red-500')
                  : 'text-gray-400'}
                >
                  {testResult
                    ? (testResult.success ? '连接成功' : '连接失败')
                    : '未测试'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 无 Key 时的说明 */}
        {!configured && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
            <p>
              💡 <strong>当前处于本地规则匹配模式。</strong>配置 API Key 后，可以启用 AI
              深度场景理解、复杂任务分析、多 Agent 判断和交付物生成。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
