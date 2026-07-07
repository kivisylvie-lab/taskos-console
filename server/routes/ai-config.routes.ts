import { Router, Request, Response } from 'express';
import { createAIClient } from '../services/ai-client-factory';
import { classifyAIError, translateError } from '../utils/error-classifier';
import type { AIConfig } from '../types/ai-config';
import { AI_PLATFORM_DEFS } from '../types/ai-config';

export const aiConfigRoutes = Router();

/**
 * GET /api/ai-config/platforms
 * 返回支持的 AI 平台列表
 */
aiConfigRoutes.get('/platforms', (_req: Request, res: Response) => {
  res.json({ platforms: AI_PLATFORM_DEFS });
});

/**
 * POST /api/ai-config/test-connection
 * 测试与指定 AI 平台的连接
 *
 * Body: { platform, apiKey, baseUrl, model }
 * Response: { success, message, elapsed?, preview? } 或 { success, errorType, message }
 */
aiConfigRoutes.post('/test-connection', async (req: Request, res: Response) => {
  try {
    const { platform, apiKey, baseUrl, model } = req.body;

    // 验证必填字段
    if (!apiKey || !apiKey.trim()) {
      return res.json({
        success: false,
        errorType: 'missing_key',
        message:
          '请先填写 API Key。你可以在对应 AI 平台的 API Key 管理页面获取。',
      });
    }

    if (!model || !model.trim()) {
      return res.json({
        success: false,
        errorType: 'missing_key',
        message: '请填写模型名称。',
      });
    }

    const aiConfig: AIConfig = {
      platform: platform || 'deepseek',
      apiKey: apiKey.trim(),
      baseUrl: (baseUrl || '').trim(),
      model: model.trim(),
    };

    const { client } = createAIClient(aiConfig);
    const startTime = Date.now();

    // 最小测试请求：发送一个极短的 chat completion
    const completion = await client.chat.completions.create({
      model: aiConfig.model,
      max_tokens: 20,
      temperature: 0,
      messages: [{ role: 'user', content: 'Hi' }],
    });

    const elapsed = Date.now() - startTime;
    const content = completion.choices[0]?.message?.content || '';

    res.json({
      success: true,
      message: `连接成功 — 模型 "${aiConfig.model}" 响应正常（${elapsed}ms）`,
      elapsed,
      preview: content.substring(0, 100),
    });
  } catch (err: any) {
    const errorType = classifyAIError(err);
    const message = translateError(errorType, err);
    res.json({
      success: false,
      errorType,
      message,
    });
  }
});
