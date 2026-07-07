// API 调用工具

import type { AIConfig } from '../types/ai-config';
import { isDemoMode, getDemoStepResult } from '../data/demoMode';

const BASE = '/api';
const DEMO_DELAY = 300; // Demo 模式下模拟延迟（ms），让过渡动画自然

/** Demo 模式下返回预置数据，否则返回 null */
function demoOrNull(step: string): any {
  if (isDemoMode()) {
    const data = getDemoStepResult(step);
    if (data) {
      // 模拟网络延迟
      return new Promise(resolve => setTimeout(() => resolve(data), DEMO_DELAY));
    }
  }
  return null;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  // 场景匹配
  matchScene: (data: {
    taskInput: string;
    uploadedFileNames: string[];
    inputURLs: string[];
    supplementaryInfo: any;
  }, aiConfig?: AIConfig) =>
    request<any>('/pipeline/scene-match', {
      method: 'POST',
      body: JSON.stringify({ ...data, aiConfig }),
    }),

  // 项目
  createProject: (name: string, description: string, extra?: any) =>
    request<any>('/projects', { method: 'POST', body: JSON.stringify({ name, description, ...extra }) }),

  getProject: (id: string) => request<any>(`/projects/${id}`),

  // 文件上传
  uploadFiles: (projectId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return fetch(`${BASE}/projects/${projectId}/upload`, { method: 'POST', body: formData }).then(r => r.json());
  },

  deleteFile: (projectId: string, fileId: string) =>
    request<any>(`/projects/${projectId}/uploads/${fileId}`, { method: 'DELETE' }),

  // URL
  submitURLs: (projectId: string, urls: string[]) =>
    request<any>(`/projects/${projectId}/url`, { method: 'POST', body: JSON.stringify({ urls }) }),

  // 流水线步骤
  setObjective: (projectId: string, objective: string) =>
    request<any>(`/projects/${projectId}/pipeline/step/03-supplementary-info`, {
      method: 'POST', body: JSON.stringify({ objective }),
    }),

  judgeTaskType: (projectId: string, aiConfig?: AIConfig) => {
      const demo = demoOrNull('05-task-type-judge');
      if (demo) return demo;
      return request<any>(`/projects/${projectId}/pipeline/step/05-task-type-judge`, {
        method: 'POST',
        body: JSON.stringify({ aiConfig }),
      });
    },

  searchKnowledge: (projectId: string, aiConfig?: AIConfig) => {
      const demo = demoOrNull('06-knowledge-search');
      if (demo) return demo;
      return request<any>(`/projects/${projectId}/pipeline/step/06-knowledge-search`, {
        method: 'POST',
        body: JSON.stringify({ aiConfig }),
      });
    },

  judgeDeliveryType: (projectId: string, aiConfig?: AIConfig) => {
      const demo = demoOrNull('07-delivery-type');
      if (demo) return demo;
      return request<any>(`/projects/${projectId}/pipeline/step/07-delivery-type`, {
        method: 'POST',
        body: JSON.stringify({ aiConfig }),
      });
    },

  getCapabilityRoute: (projectId: string, aiConfig?: AIConfig) => {
      const demo = demoOrNull('12-capability-route');
      if (demo) return demo;
      return request<any>(`/projects/${projectId}/pipeline/step/12-capability-route`, {
        method: 'POST',
        body: JSON.stringify({ aiConfig }),
      });
    },

  getCapabilityDetail: (projectId: string, aiConfig?: AIConfig) => {
      const demo = demoOrNull('11-multi-agent-judge');
      if (demo) return demo;
      return request<any>(`/projects/${projectId}/pipeline/step/11-multi-agent-judge`, {
        method: 'POST',
        body: JSON.stringify({ aiConfig }),
      });
    },

  confirmPlan: (projectId: string, aiConfig?: AIConfig) => {
      const demo = demoOrNull('13-confirm-plan');
      if (demo) return demo;
      return request<any>(`/projects/${projectId}/pipeline/step/13-confirm-plan`, {
        method: 'POST',
        body: JSON.stringify({ aiConfig }),
      });
    },

  // SSE 生成
  generateDeliverablesSSE: (projectId: string, onProgress: (data: any) => void, onComplete: (data: any) => void, onError: (err: string) => void) => {
    // Demo Mode：模拟 SSE 进度推送
    if (isDemoMode()) {
      const demoData = getDemoStepResult('16-generate-deliverables');
      if (demoData) {
        const steps = [
          '🔍 分析库存数据...',
          '📊 计算补货优先级...',
          '📋 评估供应商表现...',
          '🤖 多 Agent 评审中...',
          '📝 生成汇报材料...',
          '✅ 交付物生成完成',
        ];
        let i = 0;
        const interval = setInterval(() => {
          if (i < steps.length) {
            onProgress({ current: i + 1, total: steps.length, message: steps[i] });
            i++;
          } else {
            clearInterval(interval);
            onComplete({ files: demoData.files, summary: demoData.summary, demoNote: demoData.demoNote });
          }
        }, 400);
        return Promise.resolve();
      }
    }
    // 真实 SSE
    return fetch(`${BASE}/projects/${projectId}/pipeline/step/16-generate-deliverables`, { method: 'POST' }).then(async response => {
      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.event === 'progress') onProgress(data);
              else if (data.event === 'complete') onComplete(data);
              else if (data.event === 'error') onError(data.error);
              else {
                if (data.current !== undefined) onProgress(data);
                else if (data.files) onComplete(data);
              }
            } catch { /* skip unparseable lines */ }
          }
        }
      }
    });
  },

  getCallRecord: (projectId: string, aiConfig?: AIConfig) => {
      const demo = demoOrNull('17-call-record-materials');
      if (demo) return demo;
      return request<any>(`/projects/${projectId}/pipeline/step/17-call-record-materials`, {
        method: 'POST',
        body: JSON.stringify({ aiConfig }),
      });
    },

  judgeKnowledgeDeposit: (projectId: string, aiConfig?: AIConfig) => {
      const demo = demoOrNull('18-assessment-deposit');
      if (demo) return demo;
      return request<any>(`/projects/${projectId}/pipeline/step/18-assessment-deposit`, {
        method: 'POST',
        body: JSON.stringify({ aiConfig }),
      });
    },

  // 客户解决包模式 (Business Solution Mode) 专用 API
  // 这些方法在 Demo 模式下查找 BS 专属 step key

  getAICombinationPlan: (projectId: string, aiConfig?: AIConfig) => {
      const demo = demoOrNull('08-capability-precheck');
      if (demo) return demo;
      return request<any>(`/projects/${projectId}/pipeline/step/08-capability-precheck`, {
        method: 'POST',
        body: JSON.stringify({ aiConfig }),
      });
    },

  searchExternalCapabilities: (data: {
    aiUsage: string;
    painPoints: string[];
    keywords: string[];
    limit?: number;
  }) =>
    request<any>('/capability-search/github', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getGitHubSearchConfig: () =>
    request<any>('/capability-search/github/config'),

  saveGitHubSearchToken: (token: string) =>
    request<any>('/capability-search/github/config', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  testGitHubSearchConnection: (token?: string) =>
    request<any>('/capability-search/github/test', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  getMultiAgentApproval: (projectId: string, aiConfig?: AIConfig) => {
      const demo = demoOrNull('10-github-search-judge');
      if (demo) return demo;
      return request<any>(`/projects/${projectId}/pipeline/step/10-github-search-judge`, {
        method: 'POST',
        body: JSON.stringify({ aiConfig }),
      });
    },

  getRiskMetrics: (projectId: string, aiConfig?: AIConfig) => {
      const demo = demoOrNull('12-capability-route');
      if (demo) return demo;
      return request<any>(`/projects/${projectId}/pipeline/step/12-capability-route`, {
        method: 'POST',
        body: JSON.stringify({ aiConfig }),
      });
    },

  getSolutionPackage: (projectId: string, aiConfig?: AIConfig) => {
      const demo = demoOrNull('14-execute-generate');
      if (demo) return demo;
      return request<any>(`/projects/${projectId}/pipeline/step/14-execute-generate`, {
        method: 'POST',
        body: JSON.stringify({ aiConfig }),
      });
    },

  getClientUsageGuide: (projectId: string, aiConfig?: AIConfig) => {
      const demo = demoOrNull('15-quality-check');
      if (demo) return demo;
      return request<any>(`/projects/${projectId}/pipeline/step/15-quality-check`, {
        method: 'POST',
        body: JSON.stringify({ aiConfig }),
      });
    },

  // 下载
  buildPackage: (projectId: string) =>
    request<any>(`/projects/${projectId}/build-package`, { method: 'POST' }),

  getDownloadURL: (projectId: string) => `${BASE}/projects/${projectId}/download`,

  getFiles: (projectId: string) =>
    request<any>(`/projects/${projectId}/files`),

  getFileContent: (projectId: string, filePath: string) =>
    request<any>(`/projects/${projectId}/files/${filePath}`),

  healthCheck: () => request<any>('/health'),
};
