import { Router, Request, Response } from 'express';
import { ExternalCapabilitySearchService } from '../services/external-capability-search.service';

export const capabilitySearchRoutes = Router();
const externalCapabilitySearch = new ExternalCapabilitySearchService();

// GET /api/capability-search/github/config
capabilitySearchRoutes.get('/github/config', (_req: Request, res: Response) => {
  res.json(externalCapabilitySearch.getGitHubConfigStatus());
});

// POST /api/capability-search/github/config
capabilitySearchRoutes.post('/github/config', (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'GitHub Token 不能为空' });
  }

  res.json(externalCapabilitySearch.configureGitHubToken(token));
});

// POST /api/capability-search/github/test
capabilitySearchRoutes.post('/github/test', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const result = await externalCapabilitySearch.testGitHubConnection(typeof token === 'string' ? token : undefined);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: `GitHub 测试连接失败: ${err.message}` });
  }
});

// POST /api/capability-search/github
capabilitySearchRoutes.post('/github', async (req: Request, res: Response) => {
  try {
    const { aiUsage, painPoints, keywords, limit } = req.body;
    if (!aiUsage || typeof aiUsage !== 'string') {
      return res.status(400).json({ error: 'aiUsage 不能为空' });
    }
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: 'keywords 不能为空' });
    }

    const result = await externalCapabilitySearch.searchGitHubWithCacheAndQueue({
      aiUsage,
      painPoints: Array.isArray(painPoints) ? painPoints : [],
      keywords,
      limit,
    });

    res.json(result);
  } catch (err: any) {
    console.error('GitHub 能力搜索失败:', err.message);
    res.status(500).json({ error: `GitHub 能力搜索失败: ${err.message}` });
  }
});
