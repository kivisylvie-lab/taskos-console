// ============================================================
// KIVI AI TaskOS Console — AI 配置类型定义（Client 端）
// ============================================================

/** 支持的 AI 平台 */
export type AIPlatform =
  | 'deepseek'
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'openrouter'
  | 'ollama'
  | 'custom';

/** 平台元信息 */
export interface AIPlatformDef {
  id: AIPlatform;
  label: string;
  defaultBaseUrl: string;
  defaultModel: string;
  description: string;
  needsAnthropicSDK?: boolean;
}

export const AI_PLATFORM_DEFS: AIPlatformDef[] = [
  { id: 'deepseek',   label: 'DeepSeek',    defaultBaseUrl: 'https://api.deepseek.com',             defaultModel: 'deepseek-chat',       description: 'DeepSeek API（OpenAI 兼容）' },
  { id: 'openai',     label: 'OpenAI',      defaultBaseUrl: 'https://api.openai.com/v1',            defaultModel: 'gpt-4o',              description: 'OpenAI 官方 API' },
  { id: 'anthropic',  label: 'Anthropic',   defaultBaseUrl: 'https://api.anthropic.com',            defaultModel: 'claude-sonnet-4-20250514', description: 'Anthropic Claude API（需 SDK 支持）', needsAnthropicSDK: true },
  { id: 'gemini',     label: 'Google Gemini', defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', defaultModel: 'gemini-2.5-flash', description: 'Google Gemini API' },
  { id: 'openrouter', label: 'OpenRouter',  defaultBaseUrl: 'https://openrouter.ai/api/v1',         defaultModel: 'openai/gpt-4o',       description: 'OpenRouter 聚合 API' },
  { id: 'ollama',     label: 'Ollama（本地）', defaultBaseUrl: 'http://localhost:11434/v1',         defaultModel: 'llama3.2',            description: '本地 Ollama 服务' },
  { id: 'custom',     label: '自定义接口',    defaultBaseUrl: '',                                    defaultModel: '',                     description: '任意 OpenAI 兼容 API' },
];

/** 用户 AI 配置 */
export interface AIConfig {
  platform: AIPlatform;
  apiKey: string;
  baseUrl: string;
  model: string;
}

/** 默认空配置 */
export const DEFAULT_AI_CONFIG: AIConfig = {
  platform: 'deepseek',
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
};

/** 错误分类 */
export type AIErrorType =
  | 'missing_key'
  | 'invalid_key'
  | 'network_error'
  | 'timeout'
  | 'rate_limit'
  | 'insufficient_quota'
  | 'model_not_found'
  | 'server_error'
  | 'unknown';
