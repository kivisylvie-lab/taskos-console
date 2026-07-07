import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AIConfig, AIPlatform } from '../types/ai-config';
import { AI_PLATFORM_DEFS, DEFAULT_AI_CONFIG } from '../types/ai-config';
import { loadAIConfig, saveAIConfig, clearAIConfig } from '../utils/ai-config-storage';

interface AIConfigContextValue {
  config: AIConfig;
  updateConfig: (partial: Partial<AIConfig>) => void;
  resetConfig: () => void;
  setPlatform: (platform: AIPlatform) => void;
}

const AIConfigCtx = createContext<AIConfigContextValue | null>(null);

export function AIConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AIConfig>(loadAIConfig);

  const updateConfig = useCallback((partial: Partial<AIConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...partial };
      saveAIConfig(next);
      return next;
    });
  }, []);

  const setPlatform = useCallback((platform: AIPlatform) => {
    setConfig(prev => {
      const def = AI_PLATFORM_DEFS.find(d => d.id === platform);
      const next: AIConfig = {
        ...prev,
        platform,
        baseUrl: def?.defaultBaseUrl ?? prev.baseUrl,
        model: def?.defaultModel ?? prev.model,
      };
      saveAIConfig(next);
      return next;
    });
  }, []);

  const resetConfig = useCallback(() => {
    clearAIConfig();
    setConfig({ ...DEFAULT_AI_CONFIG });
  }, []);

  return (
    <AIConfigCtx.Provider value={{ config, updateConfig, resetConfig, setPlatform }}>
      {children}
    </AIConfigCtx.Provider>
  );
}

export function useAIConfig(): AIConfigContextValue {
  const ctx = useContext(AIConfigCtx);
  if (!ctx) throw new Error('useAIConfig must be used within AIConfigProvider');
  return ctx;
}
