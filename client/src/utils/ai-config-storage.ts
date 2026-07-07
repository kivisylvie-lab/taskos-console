import type { AIConfig } from '../types/ai-config';
import { DEFAULT_AI_CONFIG } from '../types/ai-config';

const STORAGE_KEY = 'kivi_ai_config';

/** 从 localStorage 加载 AI 配置 */
export function loadAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AI_CONFIG };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_AI_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_AI_CONFIG };
  }
}

/** 保存 AI 配置到 localStorage */
export function saveAIConfig(config: AIConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // localStorage 不可用（隐私模式等），静默失败
  }
}

/** 清除保存的 AI 配置 */
export function clearAIConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 静默失败
  }
}

/** 检查是否有可用的 API Key */
export function hasApiKey(config: AIConfig): boolean {
  return config.apiKey.trim().length > 0;
}

/** 获取 API Key 的脱敏显示（仅显示后 4 位） */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 4) return '';
  if (apiKey.length <= 8) return apiKey.substring(0, 2) + '****';
  return apiKey.substring(0, 3) + '****' + apiKey.substring(apiKey.length - 4);
}
