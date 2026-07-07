import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { PipelineExecutorService } from '../services/pipeline-executor.service';
import type { UploadedFile } from '../types';

export const uploadRoutes = Router();
const executor = new PipelineExecutorService();

// 配置 multer
const storage = multer.diskStorage({
  destination: (req: any, _file, cb) => {
    const projectId = req.params.projectId;
    const dir = path.join(config.outputPath, projectId, 'uploads');
    require('fs').mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize, files: config.maxFiles },
});

/**
 * 识别文件类型
 */
function recognizeFileType(mimeType: string): UploadedFile['recognizedType'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv') || mimeType.includes('excel')) return 'table';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('presentation')) return 'document';
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html') ||
      mimeType.includes('python') || mimeType.includes('text/x-') || mimeType.includes('application/x-')) return 'code';
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
  return 'other';
}

// POST /api/projects/:projectId/upload — 上传文件
uploadRoutes.post('/:projectId/upload', upload.array('files', config.maxFiles), (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: '未选择文件' });
    }

    const uploadedFiles: UploadedFile[] = files.map(f => ({
      id: uuidv4(),
      name: f.originalname,
      size: f.size,
      mimeType: f.mimetype,
      path: f.path,
      recognizedType: recognizeFileType(f.mimetype),
    }));

    const project = executor.addFiles(req.params.projectId, uploadedFiles);
    console.log(`📎 文件已上传: ${uploadedFiles.length} 个文件 → ${project.name}`);
    res.json({ files: uploadedFiles, project });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:projectId/uploads/:fileId — 删除已上传文件
uploadRoutes.delete('/:projectId/uploads/:fileId', (req: Request, res: Response) => {
  try {
    const project = executor.getProject(req.params.projectId);
    if (!project) return res.status(404).json({ error: '项目不存在' });

    const fileIndex = project.files.findIndex(f => f.id === req.params.fileId);
    if (fileIndex === -1) return res.status(404).json({ error: '文件不存在' });

    // 删除磁盘文件
    const fs = require('fs');
    const filePath = project.files[fileIndex].path;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    project.files.splice(fileIndex, 1);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
