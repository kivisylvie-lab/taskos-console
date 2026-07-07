import dotenv from 'dotenv';
import path from 'path';

// 加载 .env（从项目根目录）
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',

  // KIVIDAILYLIFE 母库路径（默认在项目上两级）
  kividailylifePath: path.resolve(
    process.env.KIVIDAILYLIFE_PATH || path.join(__dirname, '..', '..', '..')
  ),

  // 项目输出目录
  outputPath: path.resolve(__dirname, '..', 'output'),

  // 文件上传限制
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 20,
};
