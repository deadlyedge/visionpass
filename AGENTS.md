# AGENTS.md

本文件为 AI Agent、开发者与自动化工具提供 VisionPass 项目的架构规范、上下文理解和开发指导原则。

---

## 1. 项目定位与核心闭环

VisionPass（视觉密语）是一个基于 **浏览器端视觉特征提取（ORB）** 与 **服务端 Hamming 比对** 的最小可验证系统（MVP）。

### 核心业务链路：
1. **创建凭证** (`/create`)：用户选择一张参考图片并输入密语。浏览器端使用 OpenCV.js 提取灰度化及缩放后的 ORB 描述子与关键点，打包为标准 `OrbFeaturePayloadV1` JSON 发送到服务端，服务端生成随机安全 token 并将 payload 与密语持久化至 PostgreSQL，最终为用户生成读取 URL 和二维码。
2. **读取凭证** (`/r/$token`)：用户打开读取链接，选择一张验证图片。浏览器同样提取 ORB 特征后提交给服务端比对接口，服务端从 PostgreSQL 取出参考特征进行纯位运算 Hamming 距离比对，当匹配点数超过阈值（`MIN_GOOD_MATCHES = 25`）时，向客户端安全返回密语。

---

## 2. 关键架构设计与铁律

为确保系统的安全性、轻量化与可部署性，在后续扩展或修改时必须严格遵守以下原则：

1. **零原图传输与存储**：
   - 原始图像（无论参考图还是验证图）**严禁**上传到后端或保存至数据库/对象存储。
   - 所有图像解码、resize（最长边 640px）、灰度转换与 ORB 特征提取均在客户端完成。
2. **服务端无重量级依赖**：
   - 服务端（Vercel Functions）**不引入** OpenCV Node native 绑定或 Python 进程，全部比对逻辑均由 TypeScript 纯位运算（Brian Kernighan 算法）在 `server/matcher/orb-basic.ts` 中实现。
3. **单项目/单仓库部署**：
   - 前端采用 React 19 + Vite + TanStack Router/Query。
   - API 位于 `api/` 目录，直接作为 Vercel Serverless Functions 运行。
   - 本地开发通过 `vite.config.ts` 中的 `apiDevServerPlugin` 模拟 Vercel 接口环境。
4. **状态与元数据隔离**：
   - `/api/credentials/:token` 只返回凭证是否存在（`{ exists: boolean }`），绝不泄露密语或特征集。
   - 密语仅在 `/api/verify` 匹配成功后返回。

---

## 3. 代码结构地图

```text
visionpass/
├── api/                          # Vercel Serverless API 端点
│   ├── credentials.ts            # POST /api/credentials（创建凭证）
│   ├── credentials/[token].ts    # GET /api/credentials/:token（查询凭证元数据）
│   ├── verify.ts                 # POST /api/verify（特征比对与密语揭示）
│   └── health.ts                 # GET /api/health（健康检查）
├── server/                       # 服务端核心逻辑
│   ├── db/                       # Drizzle ORM 配置与 Schema
│   ├── matcher/                  # 独立特征匹配器 (orb-basic.ts)
│   └── validation/               # Zod 请求校验与 Base64 规范检查
├── src/                          # 前端 SPA 源码
│   ├── components/               # UI 组件 (ImagePicker, QrResult, ProcessingState)
│   ├── lib/                      # 工具库 (api.ts, extract-orb.ts, feature-schema.ts, opencv.ts)
│   ├── routes/                   # 页面路由 (create.tsx, read.tsx)
│   ├── styles/                   # 全局样式
│   ├── app.tsx / main.tsx        # 应用入口与 React Query Provider
│   └── router.tsx                # TanStack Router 路由树
├── public/                       # 静态资源 (含 opencv.js 备用库)
├── drizzle/                      # 数据库迁移 SQL 文件
├── biome.json                    # 代码格式化与 Linter 规则
└── vite.config.ts                # Vite 配置与本地 API 中间件
```

---

## 4. 常见开发与调试指令

- **启动本地开发**：`bun dev`（同时启动前端与模拟 API 服务）
- **类型检查与构建**：`bun run build`
- **代码规范检查与修复**：`bunx @biomejs/biome check --write`
- **生成数据库迁移**：`bun run db:generate`
- **应用数据库变更**：`bun run db:push`
