import { Router, Request, Response } from 'express';
import { PipelineExecutorService } from '../services/pipeline-executor.service';
import type { InputURL } from '../types';

export const urlRoutes = Router();
const executor = new PipelineExecutorService();

/**
 * 判断 URL 类型
 */
function categorizeURL(url: string): InputURL['type'] {
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be') || u.includes('bilibili.com') ||
      u.includes('vimeo.com') || u.includes('video')) return 'video';
  if (u.includes('github.com')) return 'github';
  if (u.includes('docs.google.com') || u.includes('notion.so') || u.includes('.pdf')) return 'doc';
  return 'webpage';
}

// POST /api/projects/:projectId/url — 提交 URL 列表
urlRoutes.post('/:projectId/url', (req: Request, res: Response) => {
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'URL 列表不能为空' });
    }

    // 验证 URL 格式
    const urlRegex = /^https?:\/\/.+/;
    const validUrls = urls.filter((u: string) => urlRegex.test(u));
    if (validUrls.length === 0) {
      return res.status(400).json({ error: '没有有效的 URL（必须以 http:// 或 https:// 开头）' });
    }

    const inputURLs: InputURL[] = validUrls.map((u: string) => ({
      url: u,
      type: categorizeURL(u),
      accessible: true, // 初始假设可访问，后续可做 HEAD 请求验证
      title: '',
    }));

    const project = executor.addURLs(req.params.projectId, inputURLs);
    console.log(`🔗 URL 已添加: ${inputURLs.length} 个链接 → ${project.name}`);
    res.json({ urls: inputURLs, project });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
