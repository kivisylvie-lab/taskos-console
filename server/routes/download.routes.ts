import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { PipelineExecutorService } from '../services/pipeline-executor.service';

export const downloadRoutes = Router();
const executor = new PipelineExecutorService();

// POST /api/projects/:projectId/build-package — 构建项目包
downloadRoutes.post('/:projectId/build-package', async (req: Request, res: Response) => {
  try {
    console.log(`📦 构建项目包 → ${req.params.projectId}`);
    const zipPath = await executor.buildPackage(req.params.projectId);
    res.json({ zipPath: path.relative(config.outputPath, zipPath), success: true });
  } catch (err: any) {
    console.error('构建项目包失败:', err.message);
    res.status(500).json({ error: `构建项目包失败: ${err.message}` });
  }
});

// GET /api/projects/:projectId/download — 下载项目 ZIP
downloadRoutes.get('/:projectId/download', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const zipPath = path.join(config.outputPath, projectId, 'project-package.zip');

    // 如果 ZIP 不存在，先构建
    if (!fs.existsSync(zipPath)) {
      await executor.buildPackage(projectId);
    }

    const project = executor.getProject(projectId);
    const zipName = `${project?.name || 'project'}-package.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(zipName)}"`);
    res.setHeader('Content-Length', fs.statSync(zipPath).size);

    const stream = fs.createReadStream(zipPath);
    stream.pipe(res);
  } catch (err: any) {
    console.error('下载失败:', err.message);
    res.status(500).json({ error: `下载失败: ${err.message}` });
  }
});

// GET /api/projects/:projectId/files — 获取项目文件树
downloadRoutes.get('/:projectId/files', (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const projectDir = path.join(config.outputPath, projectId);

    if (!fs.existsSync(projectDir)) {
      return res.status(404).json({ error: '项目目录不存在' });
    }

    const fileTree = buildFileTree(projectDir, projectDir);

    // 计算总大小
    let totalSize = 0;
    let fileCount = 0;
    const countFiles = (node: any) => {
      if (node.type === 'file') { totalSize += node.size; fileCount++; }
      else if (node.children) node.children.forEach(countFiles);
    };
    countFiles(fileTree);

    res.json({ tree: fileTree, fileCount, totalSize });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:projectId/files/* — 获取单个文件内容
downloadRoutes.get('/:projectId/files/*', (req: Request, res: Response) => {
  try {
    const filePath = path.join(config.outputPath, req.params.projectId, req.params[0] || '');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    const ext = path.extname(filePath).toLowerCase();
    const textExts = ['.md', '.txt', '.json', '.csv', '.html', '.css', '.js', '.ts', '.jsx', '.tsx', '.svg', '.yaml', '.yml', '.xml', '.mmd'];
    if (textExts.includes(ext)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      res.json({ content, size: Buffer.byteLength(content, 'utf-8'), type: ext });
    } else {
      // 二进制文件发送原始数据
      res.sendFile(filePath);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---- 辅助 ----

interface FileTreeNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  children?: FileTreeNode[];
}

function buildFileTree(rootPath: string, currentPath: string): FileTreeNode {
  const stat = fs.statSync(currentPath);
  const relativePath = path.relative(rootPath, currentPath);

  if (stat.isFile()) {
    return {
      name: path.basename(currentPath),
      type: 'file',
      path: relativePath,
      size: stat.size,
    };
  }

  const children = fs.readdirSync(currentPath)
    .filter(name => name !== 'uploads' && !name.startsWith('pipeline-state'))
    .map(name => buildFileTree(rootPath, path.join(currentPath, name)))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  return {
    name: path.basename(currentPath),
    type: 'directory',
    path: relativePath,
    children,
  };
}
