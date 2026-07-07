import { Router, Request, Response } from 'express';
import { PipelineExecutorService } from '../services/pipeline-executor.service';

export const projectRoutes = Router();
const executor = new PipelineExecutorService();

// POST /api/projects — 创建新项目（场景匹配后调用）
projectRoutes.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, sceneType, requiresProject, supplementaryInfo, metadata } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: '项目名称不能为空' });
    }

    const project = executor.createProject(
      name.trim(),
      (description || '').trim(),
      { sceneType, requiresProject, supplementaryInfo, metadata }
    );
    console.log(`📁 项目已创建: ${project.name} (${project.id}), 场景: ${sceneType || '未指定'}, 项目型: ${requiresProject}`);
    res.status(201).json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:projectId — 获取项目信息
projectRoutes.get('/:projectId', (req: Request, res: Response) => {
  try {
    const project = executor.getProject(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:projectId/state — 获取流水线状态
projectRoutes.get('/:projectId/state', (req: Request, res: Response) => {
  try {
    const project = executor.getProject(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    res.json({
      currentStep: project.currentStep,
      stepResults: project.stepResults,
      files: project.files.length,
      urls: project.urls.length,
      hasObjective: !!project.taskObjective,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
