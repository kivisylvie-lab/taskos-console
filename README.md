#   AI TaskOS Console

> **AI 业务解决包交付系统 + AI 能力路由内核** — Web 控制台

## 是什么

  AI TaskOS Console 是一个本地运行的 Web 应用，提供**两种工作模式**：

### 模式 1：AI 能力路由（默认模式）
经典的 AI 任务路由与任务执行闭环系统：
- 创建项目 → 上传文件 → 输入任务目标
- AI 自动判断任务类型、检索知识库、判断交付物类型
- AI 自动推荐能力路由（Prompt / Skill / SubAgent / Hook / MCP）
- 用户确认方案 → AI 生成交付物 → 下载项目包

### 模式 2：客户解决包模式（Business Solution Mode）🆕
面向企业客户的完整业务解决方案交付系统：
- **客户需求输入** → **真实痛点拆解** → **数据与资料判断**
- **业务动作定义** → **AI 组合方案** → **能力与工具选择**
- **多 Agent / 人工审批** → **风险与指标判断**
- **解决包封装** → **客户使用培训** → **指标验证与知识沉淀**

**一句话**：客户业务需求 → 真实痛点 → AI 组合方案 → 可用解决包 → 客户培训 → 指标验证 → 能力沉淀

AI 能力路由是系统**内核**；客户解决包模式是系统的**商业交付外层**。

## 快速开始

### 前置条件

- Node.js 20+
- DeepSeek API Key（或其他兼容 OpenAI API 的 Key）

### 安装运行

```bash
# 1. 进入项目目录
cd projects/ KIVI-taskos-console

# 2. 安装依赖
npm install

# 3. 配置 API Key
cp .env.example .env
# 编辑 .env，填入你的 API Key

# 4. 启动开发服务器
npm run dev
```

前端运行在 http://localhost:5173，后端运行在 http://localhost:3001。

### 无需 API Key 的体验方式

点击首页的 **🏢 加载客户解决包演示** 或 **📦 加载供应链演示案例** 按钮，即可在不配置 API Key 的情况下完整体验系统流程。

## 技术架构

```
浏览器 (React SPA :5173) → Express 服务器 (:3001) → AI API (DeepSeek/OpenAI/Anthropic)
                                  ↓
                           DAILYLIFE 母库规则 (只读)
```

### 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Tailwind CSS + Vite |
| 后端 | Node.js + Express 4 + TypeScript |
| AI | 多平台支持（DeepSeek / OpenAI / Anthropic / Gemini / OpenRouter / Ollama） |
| 打包 | archiver (ZIP) |
| 上传 | multer |

## 项目结构

```
 -taskos-console/
├── server/                          # 后端
│   ├── index.ts                     # Express 入口
│   ├── config.ts                    # 配置读取
│   ├── types.ts                     # 共享类型（含 BS 模式专用类型）
│   ├── routes/                      # API 路由
│   └── services/                    # 核心服务
├── client/                          # 前端
│   └── src/
│       ├── App.tsx                  # 主应用 + 双模式步骤路由
│       ├── components/
│       │   ├── Layout.tsx           # 页面布局
│       │   ├── StepIndicator.tsx    # 步骤进度条（双模式标签）
│       │   ├── steps/               # 18 个步骤组件（默认 + BS）
│       │   └── shared/              # 共享组件
│       ├── store/                   # 状态管理
│       ├── types/                   # 类型定义
│       ├── data/                    # Demo 数据 + 场景匹配引擎
│       └── utils/                   # API 工具
├── business-solution-mode/          # 客户解决包模式资源
│   ├── templates/                   # 解决包模板
│   └── examples/                    # 演示案例
├── solution-packages/               # 生成的解决包输出
├── output/                          # 运行时项目输出
└── package.json
```

## 15 步流程（双模式）

| 阶段 | 步骤 | 默认模式标签 | 客户解决包模式标签 |
|------|------|-------------|-------------------|
| **需求输入** | Step 01 | 输入任务 | 客户需求输入 |
| | Step 02 | 场景匹配 | 资料上传 / URL |
| | Step 03 | 资料补充 | 场景匹配 |
| | Step 04 | 项目设置 | 用户确认流程 |
| **方案判断** | Step 05 | 任务类型判断 | **真实痛点拆解** |
| | Step 06 | 知识库检索 | 数据与资料判断 |
| | Step 07 | 交付物类型 | **业务动作定义** |
| | Step 08 | 能力前置检查 | **AI 组合方案** ⭐ |
| | Step 09 | 能力路由 | **风险与指标判断** |
| | Step 10 | 确认方案 | 用户确认执行方案 |
| **解决包交付** | Step 11 | 执行生成 | **解决包生成** |
| | Step 12 | 质量检查 | **客户使用说明生成** |
| | Step 13 | 生成交付物 | 汇报材料生成 |
| | Step 14 | 调用记录与汇报 | AI能力调用记录生成 |
| | Step 15 | 评估与沉淀 | **指标验证与沉淀** |

⭐ **Step 08 是客户解决包模式的核心**——原有的 Prompt / RAG / Skill / Tool / MCP / 自动化 / 多 Agent / 人工审批 / 指标复盘 在此作为实现客户解决包的能力组合内核。

## 客户解决包模式 10 步核心流程

```
1. 场景匹配      →  判断客户需求属于哪个业务场景
2. 真实痛点拆解  →  拆解表层需求背后的真实业务痛点
3. 数据与资料判断 →  判断解决痛点需要哪些数据
4. 业务动作定义  →  定义每个痛点对应的具体业务动作
5. AI 组合方案   →  组合 Prompt/RAG/Skill/Tool/MCP/Agent/Hook
6. 能力与工具选择 →  选择具体能力和工具（本地/外部/自建）
7. 解决包封装    →  封装为客户可直接使用的业务应用
8. 客户使用培训  →  生成客户使用说明（非技术人员可理解）
9. 运行与指标验证 →  用指标判断是否真的解决问题
10. 复盘与沉淀   →  沉淀行业模板/Skill/Agent/Prompt/解决包模板
```

## AI 能力使用说明

| 项目环节 | 能力类型 | 具体能力 | 来源 | 为什么选这个能力类型 |
|---|---|---|---|---|
| 场景匹配 | 本地引擎 | 20 场景模糊匹配引擎 | 项目内工具 | 前端实时匹配，不依赖 AI |
| 任务分诊 / 痛点拆解 | Prompt (AI API) |  DAILYLIFE 规则 2/4 | 本地母库规则 | 一次性诊断，Prompt 够用 |
| 知识库检索 | Prompt (AI API) |  DAILYLIFE 规则 30 | 本地母库规则 | 语义搜索，需要 AI 判断 |
| 交付物判断 / 业务动作 | Prompt (AI API) |  DAILYLIFE 规则 26 | 本地母库规则 | 类型判断需 AI |
| AI 组合方案 | Prompt (AI API) |  DAILYLIFE 规则 23/24/25 | 本地母库规则 | 能力类型选择 + 具体能力评分 |
| 多 Agent 审查 | SubAgent | 13 种 Agent 类型 |  DAILYLIFE 规则 29 | 多专业角色独立判断 |
| 文件生成 | Prompt (AI API) | 交付物生成 | AI 直接生成 | 内容生成 |
| 项目打包 | Tool (自动化) | archiver | 项目内工具 | ZIP 打包 |


## 客户解决包模式专用能力

| 能力类型 | 在 BS 模式中的作用 | 当前状态 |
|---------|-------------------|---------|
| 多 Agent | 供应链 Agent / 财务 Agent / 老板视角 Agent / 质量审查 Agent 分别独立审查 | Demo 模拟 |
| 人工审批 | 4 步审批流程（供应链经理 → 采购总监 → 财务经理 → CEO） | Demo 模拟 |
| 指标验证 | 8 项 KPI 基线 vs 目标值对比 | Demo 模拟 |
| MCP 接入 | 识别需要接入 ERP/WMS 的真实环境需求 | 已识别，未接入 |

## 汇报材料说明

- README.md（本文件）：给开发者理解项目结构和运行方式
- 使用说明.md：给非技术人员理解系统功能和操作
- 项目汇报材料.md：给老板/决策者快速理解项目价值
- business-solution-mode/templates/：客户解决包模式模板文件

