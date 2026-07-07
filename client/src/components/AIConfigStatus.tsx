import React from 'react';
import { useAIConfig } from '../store/AIConfigContext';
import { hasApiKey } from '../utils/ai-config-storage';
import { AI_PLATFORM_DEFS } from '../types/ai-config';

interface Props {
  onClick: () => void;
}

export function AIConfigStatus({ onClick }: Props) {
  const { config } = useAIConfig();
  const configured = hasApiKey(config);
  const platformDef = AI_PLATFORM_DEFS.find(d => d.id === config.platform);

  return (
    <button
      onClick={onClick}
      className="ai-status-btn"
      title={configured
        ? `当前使用: ${platformDef?.label || config.platform} / ${config.model}`
        : '未配置 AI — 点击配置'}
    >
      <span className={`ai-status-dot ${configured ? 'active' : 'inactive'}`} />
      <span className="ai-status-label">
        {configured
          ? `${platformDef?.label || config.platform}`
          : '未配置 AI'}
      </span>
      <span className="ai-status-arrow">⚙</span>
    </button>
  );
}
