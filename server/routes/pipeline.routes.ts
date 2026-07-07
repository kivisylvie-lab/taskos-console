import { Router, Request, Response } from 'express';
import { PipelineExecutorService } from '../services/pipeline-executor.service';
import { ExternalCapabilitySearchService } from '../services/external-capability-search.service';
import { classifyAIError, translateError } from '../utils/error-classifier';
import type { AIConfig } from '../types/ai-config';

export const pipelineRoutes = Router();
const executor = new PipelineExecutorService();
const externalCapabilitySearch = new ExternalCapabilitySearchService();

// POST /api/pipeline/scene-match — 场景匹配（无需项目）
pipelineRoutes.post('/scene-match', async (req: Request, res: Response) => {
  try {
    const { taskInput, uploadedFileNames, inputURLs, supplementaryInfo } = req.body;
    if (!taskInput || typeof taskInput !== 'string' || taskInput.trim().length === 0) {
      return res.status(400).json({ error: '任务描述不能为空' });
    }
    console.log(`🎯 场景匹配: "${taskInput.substring(0, 50)}..."`);
    const aiConfig = (req as any).aiConfig as AIConfig | undefined;
    const result = await executor.matchScene({
      taskInput: taskInput.trim(),
      uploadedFileNames: uploadedFileNames || [],
      inputURLs: inputURLs || [],
      supplementaryInfo: supplementaryInfo || {},
    }, aiConfig);
    res.json(result);
  } catch (err: any) {
    console.error('场景匹配失败:', err.message);
    const friendly = translateError(classifyAIError(err), err);
    res.status(500).json({ error: friendly });
  }
});

// POST /api/projects/:projectId/pipeline/step/03-supplementary-info
pipelineRoutes.post('/:projectId/pipeline/step/03-supplementary-info', (req: Request, res: Response) => {
  try {
    const { objective } = req.body;
    if (!objective || typeof objective !== 'string' || objective.trim().length === 0) {
      return res.status(400).json({ error: '任务目标不能为空' });
    }
    const project = executor.setTaskObjective(req.params.projectId, objective.trim());
    res.json({ project, message: '任务目标已记录' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:projectId/pipeline/step/05-task-type-judge
pipelineRoutes.post('/:projectId/pipeline/step/05-task-type-judge', async (req: Request, res: Response) => {
  try {
    console.log(`🔍 执行 Step 05: 任务类型判断 → ${req.params.projectId}`);
    const aiConfig = (req as any).aiConfig as AIConfig | undefined;
    const { project, result } = await executor.executeStep05(req.params.projectId, aiConfig);
    res.json({ project, result });
  } catch (err: any) {
    console.error('Step 05 失败:', err.message);
    const friendly = translateError(classifyAIError(err), err);
    res.status(500).json({ error: friendly });
  }
});

// POST /api/projects/:projectId/pipeline/step/06-knowledge-search
pipelineRoutes.post('/:projectId/pipeline/step/06-knowledge-search', async (req: Request, res: Response) => {
  try {
    console.log(`📚 执行 Step 06: 知识库检索 → ${req.params.projectId}`);
    const aiConfig = (req as any).aiConfig as AIConfig | undefined;
    const { project, result } = await executor.executeStep06(req.params.projectId, aiConfig);
    res.json({ project, result });
  } catch (err: any) {
    console.error('Step 06 失败:', err.message);
    const friendly = translateError(classifyAIError(err), err);
    res.status(500).json({ error: friendly });
  }
});

// POST /api/projects/:projectId/pipeline/step/07-delivery-type
pipelineRoutes.post('/:projectId/pipeline/step/07-delivery-type', async (req: Request, res: Response) => {
  try {
    console.log(`📋 执行 Step 07: 交付物类型判断 → ${req.params.projectId}`);
    const aiConfig = (req as any).aiConfig as AIConfig | undefined;
    const { project, result } = await executor.executeStep07(req.params.projectId, aiConfig);
    res.json({ project, result });
  } catch (err: any) {
    console.error('Step 07 失败:', err.message);
    const friendly = translateError(classifyAIError(err), err);
    res.status(500).json({ error: friendly });
  }
});

// ---- 客户解决包模式 (Business Solution Mode) 专用路由 ----

// POST /api/projects/:projectId/pipeline/step/08-capability-precheck (BS: AI 组合方案)
pipelineRoutes.post('/:projectId/pipeline/step/08-capability-precheck', async (req: Request, res: Response) => {
  try {
    console.log(`🧠 执行 BS Step 08: AI 组合方案 → ${req.params.projectId}`);
    const aiConfig = (req as any).aiConfig as AIConfig | undefined;
    const project = executor.getProject(req.params.projectId);
    if (!project) return res.status(404).json({ error: '项目不存在' });
    res.json({ project, result: {} });
  } catch (err: any) {
    console.error('BS Step 08 失败:', err.message);
    res.status(500).json({ error: `AI 组合方案失败: ${err.message}` });
  }
});

// POST /api/pipeline/external-capability-search — 外部开源能力搜索（优先 GitHub）
pipelineRoutes.post('/external-capability-search', async (req: Request, res: Response) => {
  try {
    const { aiUsage, painPoints, keywords, limit } = req.body;
    if (!aiUsage || typeof aiUsage !== 'string') {
      return res.status(400).json({ error: 'aiUsage 不能为空' });
    }
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: 'keywords 不能为空' });
    }

    const result = await externalCapabilitySearch.search({
      aiUsage,
      painPoints: Array.isArray(painPoints) ? painPoints : [],
      keywords,
      limit,
    });
    res.json(result);
  } catch (err: any) {
    console.error('外部能力搜索失败:', err.message);
    res.status(500).json({ error: `外部能力搜索失败: ${err.message}` });
  }
});

// POST /api/projects/:projectId/pipeline/step/10-github-search-judge (BS: 多Agent/人工审批)
pipelineRoutes.post('/:projectId/pipeline/step/10-github-search-judge', async (req: Request, res: Response) => {
  try {
    console.log(`👥 执行 BS Step 10: 多Agent/人工审批 → ${req.params.projectId}`);
    const aiConfig = (req as any).aiConfig as AIConfig | undefined;
    const project = executor.getProject(req.params.projectId);
    if (!project) return res.status(404).json({ error: '项目不存在' });
    res.json({ project, result: {} });
  } catch (err: any) {
    console.error('BS Step 10 失败:', err.message);
    res.status(500).json({ error: `多Agent审批失败: ${err.message}` });
  }
});

// POST /api/projects/:projectId/pipeline/step/14-execute-generate (BS: 解决包生成)
pipelineRoutes.post('/:projectId/pipeline/step/14-execute-generate', async (req: Request, res: Response) => {
  try {
    console.log(`📦 执行 BS Step 14: 解决包生成 → ${req.params.projectId}`);
    const project = executor.getProject(req.params.projectId);
    if (!project) return res.status(404).json({ error: '项目不存在' });
    res.json({ project, result: {} });
  } catch (err: any) {
    console.error('BS Step 14 失败:', err.message);
    res.status(500).json({ error: `解决包生成失败: ${err.message}` });
  }
});

// POST /api/projects/:projectId/pipeline/step/15-quality-check (BS: 客户使用说明)
pipelineRoutes.post('/:projectId/pipeline/step/15-quality-check', async (req: Request, res: Response) => {
  try {
    console.log(`📖 执行 BS Step 15: 客户使用说明 → ${req.params.projectId}`);
    const aiConfig = (req as any).aiConfig as AIConfig | undefined;
    const project = executor.getProject(req.params.projectId);
    if (!project) return res.status(404).json({ error: '项目不存在' });
    res.json({ project, result: {} });
  } catch (err: any) {
    console.error('BS Step 15 失败:', err.message);
    res.status(500).json({ error: `客户使用说明失败: ${err.message}` });
  }
});

// POST /api/projects/:projectId/pipeline/step/11-multi-agent-judge
pipelineRoutes.post('/:projectId/pipeline/step/11-multi-agent-judge', async (req: Request, res: Response) => {
  try {
    console.log(`🎯 执行 Step 11: 具体能力 + 多 Agent 判断 → ${req.params.projectId}`);
    const aiConfig = (req as any).aiConfig as AIConfig | undefined;
    const { project, result } = await executor.executeStep11(req.params.projectId, aiConfig);
    res.json({ project, result });
  } catch (err: any) {
    console.error('Step 11 失败:', err.message);
    const friendly = translateError(classifyAIError(err), err);
    res.status(500).json({ error: friendly });
  }
});

// POST /api/projects/:projectId/pipeline/step/12-capability-route
pipelineRoutes.post('/:projectId/pipeline/step/12-capability-route', async (req: Request, res: Response) => {
  try {
    console.log(`🗺️ 执行 Step 12: 能力路由 → ${req.params.projectId}`);
    const aiConfig = (req as any).aiConfig as AIConfig | undefined;
    const { project, result } = await executor.executeStep12(req.params.projectId, aiConfig);
    res.json({ project, result });
  } catch (err: any) {
    console.error('Step 12 失败:', err.message);
    const friendly = translateError(classifyAIError(err), err);
    res.status(500).json({ error: friendly });
  }
});

// POST /api/projects/:projectId/pipeline/step/13-confirm-plan
pipelineRoutes.post('/:projectId/pipeline/step/13-confirm-plan', async (req: Request, res: Response) => {
  try {
    console.log(`✅ 执行 Step 13: 确认执行方案 → ${req.params.projectId}`);
    const { project, result } = await executor.executeStep13(req.params.projectId);
    res.json({ project, result });
  } catch (err: any) {
    console.error('Step 13 失败:', err.message);
    res.status(500).json({ error: `执行方案确认失败: ${err.message}` });
  }
});

// POST /api/projects/:projectId/pipeline/step/16-generate-deliverables — SSE 流式
pipelineRoutes.post('/:projectId/pipeline/step/16-generate-deliverables', async (req: Request, res: Response) => {
  try {
    console.log(`🚀 执行 Step 16: 生成交付物 → ${req.params.projectId}`);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const sendSSE = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const { project, result } = await executor.executeStep16(
      req.params.projectId,
      (current, total, fileName) => {
        sendSSE('progress', { current, total, fileName });
      },
      (req as any).aiConfig as AIConfig | undefined
    );

    sendSSE('complete', { files: result.files, project });
    res.end();
  } catch (err: any) {
    console.error('Step 16 失败:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: `交付物生成失败: ${err.message}` });
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

// POST /api/projects/:projectId/pipeline/step/17-call-record-materials
pipelineRoutes.post('/:projectId/pipeline/step/17-call-record-materials', async (req: Request, res: Response) => {
  try {
    console.log(`📝 执行 Step 17: 生成能力调用记录 → ${req.params.projectId}`);
    const aiConfig = (req as any).aiConfig as AIConfig | undefined;
    const { project, result } = await executor.executeStep17(req.params.projectId, aiConfig);
    res.json({ project, result });
  } catch (err: any) {
    console.error('Step 17 失败:', err.message);
    const friendly = translateError(classifyAIError(err), err);
    res.status(500).json({ error: friendly });
  }
});

// POST /api/projects/:projectId/pipeline/step/18-assessment-deposit
pipelineRoutes.post('/:projectId/pipeline/step/18-assessment-deposit', async (req: Request, res: Response) => {
  try {
    console.log(`💾 执行 Step 18: 知识库沉淀判断 → ${req.params.projectId}`);
    const aiConfig = (req as any).aiConfig as AIConfig | undefined;
    const { project, result } = await executor.executeStep18(req.params.projectId, aiConfig);
    res.json({ project, result });
  } catch (err: any) {
    console.error('Step 18 失败:', err.message);
    const friendly = translateError(classifyAIError(err), err);
    res.status(500).json({ error: friendly });
  }
});
