import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { projectRoutes } from './routes/project.routes';
import { uploadRoutes } from './routes/upload.routes';
import { urlRoutes } from './routes/url.routes';
import { pipelineRoutes } from './routes/pipeline.routes';
import { downloadRoutes } from './routes/download.routes';
import { aiConfigRoutes } from './routes/ai-config.routes';
import { capabilitySearchRoutes } from './routes/capability-search.routes';
import { aiConfigMiddleware } from './middleware/ai-config.middleware';
import { RuleLoaderService } from './services/rule-loader.service';

const app = express();

// 中间件
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// AI 配置中间件 — 从请求 body 提取 aiConfig
app.use(aiConfigMiddleware);

// 静态文件服务（生成的 output 目录）
app.use('/output', express.static(config.outputPath));

// 初始化 RuleLoader（预加载母库规则到内存）
const ruleLoader = RuleLoaderService.getInstance();
ruleLoader.loadAllRules().then(() => {
  console.log('✅ KIVIDAILYLIFE 母库规则已加载');
}).catch(err => {
  console.warn('⚠️ 母库规则加载部分失败，将使用降级模式:', err.message);
});

// 注入 ruleLoader 到请求上下文
app.use((req: any, _res, next) => {
  req.ruleLoader = ruleLoader;
  next();
});

// 路由
app.use('/api/projects', projectRoutes);
app.use('/api/projects', uploadRoutes);
app.use('/api/projects', urlRoutes);
app.use('/api/projects', pipelineRoutes);
app.use('/api/pipeline', pipelineRoutes);  // 场景匹配等无需 projectId 的端点
app.use('/api/projects', downloadRoutes);
app.use('/api/capability-search', capabilitySearchRoutes);

// AI 配置路由
app.use('/api/ai-config', aiConfigRoutes);

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '0.1.0',
    rulesLoaded: ruleLoader.isLoaded(),
    uptime: process.uptime(),
  });
});

// 错误处理
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

app.listen(config.port, () => {
  console.log(`\n⚡ KIVI AI TaskOS Console`);
  console.log(`   服务端: http://localhost:${config.port}`);
  console.log(`   健康检查: http://localhost:${config.port}/api/health`);
  console.log(`   母库路径: ${config.kividailylifePath}\n`);
});
