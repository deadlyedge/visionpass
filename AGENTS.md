# AGENTS.md

本文件为 AI Agent、开发者与自动化工具提供 VisionPass 项目的架构规范、上下文理解和开发指导原则。

---

## 1. 项目定位与核心闭环

VisionPass（视觉密语）是一个基于 **浏览器端视觉特征提取（ORB）** 与 **服务端 Hamming 比对** 的全栈最小可验证系统（MVP）。

### 核心业务链路：
1. **创建凭证** (`/create`)：用户选择一张参考图片并输入密语。浏览器端使用 CDN 托管的高速 OpenCV.js 提取灰度化及缩放后的 ORB 描述子与关键点，打包为标准 `OrbFeaturePayloadV1` JSON，通过 TanStack Start **Server Function (`createCredentialFn`)** 发送到服务端，服务端生成随机安全 token 并将 payload 与密语持久化至 PostgreSQL，最终为用户生成读取 URL 和二维码。
2. **读取凭证** (`/r/$token`)：用户打开读取链接，选择一张验证图片。浏览器同样提取 ORB 特征后通过 **Server Function (`verifyCredentialFn`)** 提交给服务端，服务端从 PostgreSQL 取出参考特征进行纯位运算 Hamming 距离比对，当匹配点数超过阈值（`MIN_GOOD_MATCHES = 25`）时，向客户端安全返回密语。

---

## 2. 关键架构设计与铁律

为确保系统的安全性、轻量化与可部署性，在后续扩展或修改时必须严格遵守以下原则：

1. **零原图传输与存储**：
   - 原始图像（无论参考图还是验证图）**严禁**上传到后端或保存至数据库/对象存储。
   - 所有图像解码、resize（最长边 640px）、灰度转换与 ORB 特征提取均在客户端完成。
2. **无独立 REST API 目录，纯 Server Functions 通信**：
   - 全面废弃独立的 `api/` 目录与手动 `fetch`。
   - 所有的前后端通信统一采用 TanStack Start 提供的类型安全 **`createServerFn`**。
   - 服务端逻辑统一收敛在 `src/server/` 中，由 Nitro 负责统一打包与 Tree-shaking。
3. **服务端无重量级依赖**：
   - 服务端**不引入** OpenCV Node native 绑定或 Python 进程，全部比对逻辑均由 TypeScript 纯位运算（Brian Kernighan 算法）在 `src/server/matcher/orb-basic.ts` 中实现。
4. **状态与元数据隔离**：
   - `getCredentialMetaFn({ data: { token } })` 只返回凭证是否存在（`{ exists: boolean }`），绝不泄露密语或特征集。
   - 密语仅在 `verifyCredentialFn` 匹配成功后返回。

---

## 3. 代码结构地图

```text
visionpass/
├── src/
│   ├── routes/                   # TanStack Router 路由树
│   │   ├── __root.tsx            # 全局布局 (Header, Footer)
│   │   ├── index.tsx             # 首页入口
│   │   ├── create.tsx            # /create 创建凭证
│   │   └── r.$token.tsx          # /r/:token 读取与验证凭证
│   ├── components/               # UI 组件 (ImagePicker, QrResult, ProcessingState)
│   ├── server/                   # 服务端独占逻辑 (Nitro 统一打包)
│   │   ├── db/                   # Drizzle ORM 配置与 Schema (PostgreSQL)
│   │   │   ├── client.ts
│   │   │   └── schema.ts
│   │   ├── matcher/              # 纯位运算 Hamming 比对器 (orb-basic.ts)
│   │   └── functions/            # createServerFn 实现集 (create, meta, verify)
│   ├── lib/                      # 前后端通用工具与客户端库
│   │   ├── extract-orb.ts        # 浏览器端 ORB 提取
│   │   ├── feature-codec.ts      # Base64 编码解码
│   │   ├── feature-schema.ts     # Zod 数据校验协议与类型
│   │   └── opencv.ts             # OpenCV.js 多 CDN 预热加载器
│   ├── styles/                   # 全局样式
│   ├── router.tsx                # 路由实例定义
│   ├── client.tsx                # 客户端入口
│   └── ssr.tsx                   # SSR 渲染入口
├── drizzle/                      # 数据库迁移 SQL 文件
├── biome.json                    # 代码格式化与 Linter 规则
├── app.config.ts                 # TanStack Start / Nitro / Vite 配置文件
└── drizzle.config.ts             # Drizzle Kit 配置文件
```

---

## 4. 常见开发与调试指令

- **启动本地开发**：`bun dev`（前后端全栈 HMR 实时热更新）
- **类型检查与构建**：`bun run build`
- **代码规范检查与修复**：`bunx @biomejs/biome check --write`
- **生成数据库迁移**：`bun run db:generate`
- **应用数据库变更**：`bun run db:push`
