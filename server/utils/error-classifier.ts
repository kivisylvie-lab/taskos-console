import type { AIErrorType } from '../types/ai-config';

/**
 * 将原生 API 错误分类为友好的错误类型
 */
export function classifyAIError(err: any): AIErrorType {
  const message = (err.message || String(err)).toLowerCase();
  const status = err.status || err.statusCode || 0;

  // 401 / 403 — API Key 无效
  if (status === 401 || status === 403 ||
      message.includes('unauthorized') ||
      message.includes('invalid api key') ||
      message.includes('incorrect api key') ||
      message.includes('invalid x-api-key') ||
      message.includes('authentication failed') ||
      message.includes('auth error') ||
      message.includes('not authorized')) {
    return 'invalid_key';
  }

  // 429 — 限流
  if (status === 429 ||
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('rate_limit')) {
    return 'rate_limit';
  }

  // 402 / 额度不足
  if (status === 402 ||
      message.includes('insufficient_quota') ||
      message.includes('billing') ||
      message.includes('quota exceeded') ||
      message.includes('insufficient balance') ||
      message.includes('balance') ||
      message.includes('you exceeded your current quota')) {
    return 'insufficient_quota';
  }

  // 模型不存在
  if ((message.includes('model') && (
        message.includes('not found') ||
        message.includes('not exist') ||
        message.includes('no such model') ||
        message.includes('does not exist') ||
        message.includes('not available'))) ||
      status === 404) {
    return 'model_not_found';
  }

  // 超时
  if (message.includes('timeout') ||
      message.includes('timed out') ||
      message.includes('etimedout') ||
      message.includes('econnaborted')) {
    return 'timeout';
  }

  // 网络错误
  if (message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('econnreset') ||
      message.includes('network') ||
      message.includes('fetch failed') ||
      message.includes('connection error') ||
      message.includes('unreachable')) {
    return 'network_error';
  }

  // 服务端错误
  if (status >= 500 ||
      message.includes('server error') ||
      message.includes('internal error') ||
      message.includes('service unavailable')) {
    return 'server_error';
  }

  return 'unknown';
}

/**
 * 翻译错误类型为中文用户提示
 */
export function translateError(type: AIErrorType, err?: any): string {
  const model = err?.model || '';

  const mapping: Record<AIErrorType, string> = {
    missing_key:
      '当前未配置 AI 模型。你可以进入【AI 配置】选择 Anthropic、OpenAI、DeepSeek、Gemini、OpenRouter、本地模型或自定义接口，并填写你自己的 API Key。未配置时，系统将使用本地规则匹配，无法使用 AI 深度分析。',
    invalid_key:
      'API Key 无效。请检查 Key 是否正确，以及是否已过期或被撤销。你可以在对应 AI 平台的 API Key 管理页面重新生成。',
    network_error:
      '网络连接失败，无法访问 AI 服务。请检查 Base URL 是否正确，以及当前网络是否通畅。如果你使用的是本地模型（Ollama），请确保 Ollama 服务已启动。',
    timeout:
      '连接超时。AI 服务响应太慢，请稍后重试，或检查网络状况。如果持续超时，可以尝试切换其他 AI 平台。',
    rate_limit:
      '请求频率过高，已被限流。请稍等片刻后重试。如果频繁遇到限流，建议升级 API 套餐或切换到其他平台。',
    insufficient_quota:
      'API 额度不足。请检查你在对应平台的账户余额，确认是否需要充值或续费。',
    model_not_found:
      model
        ? `模型 "${model}" 不存在。请检查模型名称是否正确，或确认你的 API 账号是否有权限访问该模型。`
        : '模型不存在。请检查模型名称是否正确，或确认你的 API 账号是否有权限访问该模型。',
    server_error:
      'AI 服务端返回错误。这通常是服务商端的临时问题，请稍后重试。如果持续出现，可以检查 Base URL 是否正确，或切换其他 AI 平台。',
    unknown:
      `AI 服务调用失败: ${err?.message || '未知错误'}`,
  };
  return mapping[type];
}
