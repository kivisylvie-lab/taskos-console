import { Request, Response, NextFunction } from 'express';
import type { AIConfig } from '../types/ai-config';

/**
 * AI 配置中间件 — 从请求 body 中提取 aiConfig，注入到 req 对象
 *
 * 前端在每次 AI 调用时随请求体发送 aiConfig 对象。
 * 本中间件将其提取到 (req as any).aiConfig 供下游路由和服务使用。
 */
export function aiConfigMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const body = req.body;

  if (body && typeof body === 'object' && body.aiConfig && typeof body.aiConfig === 'object') {
    const ac = body.aiConfig;
    (req as any).aiConfig = {
      platform: ac.platform || 'deepseek',
      apiKey: ac.apiKey || '',
      baseUrl: ac.baseUrl || '',
      model: ac.model || '',
    } satisfies AIConfig;
  }

  next();
}
