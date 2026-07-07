import OpenAI from 'openai';
import type { AIConfig } from '../types/ai-config';
import { createAIClient, getDefaultClient } from './ai-client-factory';

/**
 * AI 服务 — 封装 OpenAI 兼容 SDK
 *
 * 支持每请求级别的 AI 配置覆盖（platform / apiKey / baseUrl / model），
 * 未提供时回退到服务器 .env 默认配置。
 */
export class AIService {

  /**
   * 获取当前请求应该使用的 OpenAI 客户端
   * 优先 aiConfig（用户自定义），否则回退到服务器默认
   */
  private resolveClient(aiConfig?: AIConfig): { client: OpenAI; model: string } {
    if (aiConfig?.apiKey?.trim()) {
      return createAIClient(aiConfig);
    }
    return getDefaultClient();
  }

  /**
   * 发送系统 Prompt + 用户消息，获取结构化 JSON 响应
   */
  async chat(params: {
    systemPrompt: string;
    userMessage: string;
    jsonSchema?: object;
    temperature?: number;
    maxTokens?: number;
    aiConfig?: AIConfig;
  }): Promise<string> {
    const { systemPrompt, userMessage, jsonSchema, temperature = 0.3, maxTokens = 4096 } = params;

    // 如果要求 JSON 输出，在系统 Prompt 末尾追加格式指令
    let system = systemPrompt;
    if (jsonSchema) {
      system += `\n\n## 输出格式要求\n你必须严格按以下 JSON 格式输出，不要包含任何其他文字：\n\`\`\`json\n${JSON.stringify(jsonSchema, null, 2)}\n\`\`\`\n只输出 JSON，不要用 markdown 代码块包裹。`;
    }

    const { client, model } = this.resolveClient(params.aiConfig);

    const completion = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('AI 响应中没有文本内容');
    }

    return content;
  }

  /**
   * 流式聊天 — 用于生成交付物时返回 SSE 流
   */
  async chatStream(params: {
    systemPrompt: string;
    userMessage: string;
    temperature?: number;
    maxTokens?: number;
    onChunk: (chunk: string) => void;
    aiConfig?: AIConfig;
  }): Promise<string> {
    const { systemPrompt, userMessage, temperature = 0.5, maxTokens = 8192, onChunk } = params;

    const { client, model } = this.resolveClient(params.aiConfig);

    const stream = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      stream: true,
    });

    let fullText = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullText += delta;
        onChunk(delta);
      }
    }

    return fullText;
  }

  /**
   * 尝试从 AI 响应中解析 JSON
   */
  static parseJSONResponse(response: string): any {
    // 尝试直接解析
    try {
      return JSON.parse(response);
    } catch {
      // 尝试从 markdown 代码块中提取
      const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch {
          // fall through
        }
      }
      // 尝试找到第一个 { 和最后一个 }
      const firstBrace = response.indexOf('{');
      const lastBrace = response.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          return JSON.parse(response.substring(firstBrace, lastBrace + 1));
        } catch {
          // fall through
        }
      }
      throw new Error(`无法从 AI 响应中解析 JSON: ${response.substring(0, 200)}...`);
    }
  }
}

// 单例
let aiInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiInstance) {
    aiInstance = new AIService();
  }
  return aiInstance;
}
