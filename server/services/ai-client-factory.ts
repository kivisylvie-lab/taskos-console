import OpenAI from 'openai';
import { config } from '../config';
import type { AIConfig } from '../types/ai-config';

/**
 * AI 客户端工厂 — 根据用户配置或服务器默认配置创建 OpenAI 兼容客户端
 *
 * 优先级：用户提供的 aiConfig > 服务器 .env 配置
 */
export function createAIClient(aiConfig?: AIConfig): {
  client: OpenAI;
  model: string;
} {
  // 优先使用用户提供的 apiKey，否则回退到服务器 .env
  const apiKey = aiConfig?.apiKey?.trim() || config.deepseekApiKey;

  if (!apiKey) {
    throw new Error(
      'missing_key: 未配置 AI API 密钥。请在 AI 配置中心填写你的 API Key，或联系管理员配置服务器端 .env 文件。'
    );
  }

  const baseURL = aiConfig?.baseUrl?.trim() || config.deepseekBaseUrl;
  const model = aiConfig?.model?.trim() || config.deepseekModel;

  const client = new OpenAI({
    apiKey,
    baseURL: baseURL || undefined,
  });

  return { client, model };
}

/**
 * 获取服务器默认 AI 客户端（单例回退）
 */
let _defaultClient: OpenAI | null = null;

export function getDefaultClient(): { client: OpenAI; model: string } {
  if (!_defaultClient) {
    if (!config.deepseekApiKey || config.deepseekApiKey.trim() === '') {
      throw new Error(
        'missing_key: 未配置 AI API 密钥。请在 AI 配置中心填写你的 API Key，或联系管理员配置服务器端 .env 文件。'
      );
    }
    _defaultClient = new OpenAI({
      apiKey: config.deepseekApiKey,
      baseURL: config.deepseekBaseUrl,
    });
  }
  return { client: _defaultClient, model: config.deepseekModel };
}
