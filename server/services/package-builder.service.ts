import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { config } from '../config';
import type { Project } from '../types';

/**
 * 项目包构建服务 — 生成 README 等元文件 + ZIP 打包
 */
export class PackageBuilderService {

  /**
   * 构建完整项目包 — 生成 README、使用说明等，然后打包为 ZIP
   */
  async buildPackage(project: Project): Promise<string> {
    const projectDir = path.join(config.outputPath, project.id);

    // 生成 README.md
    this.generateReadme(project);

    // 生成使用说明.md
    this.generateUsageGuide(project);

    // 打包为 ZIP
    const zipPath = path.join(projectDir, 'project-package.zip');
    await this.createZip(projectDir, zipPath);

    return zipPath;
  }

  /**
   * 生成 README.md
   */
  private generateReadme(project: Project): void {
    const readme = `# ${project.name}

> 由 KIVI AI TaskOS Console 生成 — ${new Date().toLocaleDateString('zh-CN')}

## 项目概述

${project.description || project.taskObjective}

## 项目信息

| 字段 | 值 |
|---|---|
| 项目 ID | ${project.id} |
| 创建时间 | ${project.createdAt} |
| 任务目标 | ${project.taskObjective} |

## 文件结构

\`\`\`
${project.name}/
├── README.md               # 本文件
├── 使用说明.md              # 面向非技术用户的使用指南
├── AI能力调用记录.md         # AI 能力使用记录
├── deliverables/            # 生成的交付物
└── uploads/                 # 用户上传的原始文件
\`\`\`

## 技术说明

本项目由 KIVI AI TaskOS Console 自动生成。系统基于 KIVIDAILYLIFE AI 能力路由规则，
通过 AI API 完成以下自动判断：
- 任务类型诊断
- 知识库检索
- 交付物类型判断
- 能力路由推荐
- 具体能力打分

## AI 能力使用说明

| 项目环节 | 能力类型 | 具体能力 | 来源 | 说明 |
|---|---|---|---|---|
| 任务分诊 | AI API | 规则 2/规则 4 | 本地母库规则 | 判断任务类型和缺口 |
| 知识库检索 | AI API | 规则 30 | 本地母库规则 | 搜索匹配知识卡片 |
| 交付物判断 | AI API | 规则 26 | 本地母库规则 | 判断产出类型 |
| 能力路由 | AI API | 规则 23/25 | 本地母库规则 | 推荐能力类型 |
| 能力打分 | AI API | 规则 24 | 本地母库规则 | 5 维度评分 |
| 文件生成 | AI API | — | Claude 直接生成 | 生成交付物内容 |

## 免责声明

本项目为 AI 生成内容，建议在使用前进行人工审阅和修改。
部分功能为 Demo 模拟状态，不代表真实商用能力。

---

🤖 Generated with [KIVI AI TaskOS Console](https://github.com)
`;
    const projectDir = path.join(config.outputPath, project.id);
    fs.writeFileSync(path.join(projectDir, 'README.md'), readme, 'utf-8');
  }

  /**
   * 生成使用说明.md
   */
  private generateUsageGuide(project: Project): void {
    const guide = `# ${project.name} — 使用说明

> 本文档面向非技术用户，说明项目内容、功能和使用方式。

## 这个项目是什么

${project.description || '基于任务目标「' + project.taskObjective + '」生成的 AI 辅助项目。'}

## 核心任务目标

${project.taskObjective}

## 生成了哪些内容

本项目包含以下交付物（由 AI 自动生成）：

| 文件 | 类型 | 说明 |
|---|---|---|
| README.md | 项目说明 | 面向开发者的技术说明 |
| 使用说明.md | 使用手册 | 本文件，面向非技术用户 |
| AI能力调用记录.md | 能力记录 | AI 能力使用证据 |
| deliverables/ | 交付物 | 核心产出文件 |

## 怎么使用这些交付物

1. **查看生成的文档** — 打开 \`deliverables/\` 目录查看生成的交付物
2. **编辑和调整** — 所有文件为 Markdown/文本格式，可用任何编辑器打开
3. **分享和展示** — 可直接用于汇报、分享或作为进一步工作的基础

## 这个系统和普通 AI 对话的区别

| 特性 | 普通 AI 对话 | KIVI AI TaskOS Console |
|---|---|---|
| 任务诊断 | 直接回答 | 先判断任务类型和缺口 |
| 知识库 | 每次重新说 | 自动检索已有知识 |
| 产出判断 | 默认给文字 | 先确认要什么类型的文件 |
| 能力选择 | 凭感觉 | 5 维度打分，选最优 |
| 质量保证 | 靠运气 | 强制确认门禁 + 执行证据 |
| 可复用性 | 一次性的 | 生成完整项目包 |

## Demo 阶段说明

⚠️ 当前版本为 **MVP Demo**，以下功能暂未实现：
- GitHub 外部能力搜索（需联网搜索 API）
- Multi-Agent 实际并发执行（当前为模拟判断）
- 视频处理
- 多用户认证

## 下一步建议

1. 审阅所有生成文件，修改不满意的地方
2. 如果需要继续完善，可在 KIVI AI TaskOS Console 中发起新任务
3. 将项目中验证有效的知识沉淀到知识库

---

如有问题，请在 KIVI AI TaskOS Console 中重新描述需求。
`;
    const projectDir = path.join(config.outputPath, project.id);
    fs.writeFileSync(path.join(projectDir, '使用说明.md'), guide, 'utf-8');
  }

  /**
   * 创建 ZIP 压缩包
   */
  private createZip(sourceDir: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err: Error) => reject(err));

      archive.pipe(output);

      // 添加目录下的所有文件（排除已有的 ZIP）
      archive.directory(sourceDir, false, (entry) => {
        return entry.name !== 'project-package.zip';
      });

      archive.finalize();
    });
  }
}
