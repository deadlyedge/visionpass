# VisionPass - 视觉密语 (Visual Passcode)

VisionPass 是一个基于图像特征识别的端到端视觉密语系统（MVP）。用户可以通过上传一张参考图片来封存一段密语，接收方只有提供相同或高度相似画面的图片，才能通过特征比对解锁并查看密语。

系统基于 **TanStack Start (Nitro + Vite)** 全栈框架构建，采用 **Server Functions (`createServerFn`)** 实现端到端类型安全的零 API RPC 通信。

---

## 🌟 核心特性

- **隐私优先（零原图上传）**：图片仅在浏览器主线程进行灰度化与 ORB 描述子提取，原始图片永远不会上传到服务器或存储在数据库中。
- **纯 Server Functions 通信**：无需独立 `api/` 路由与手动 `fetch`，全量使用 TanStack Start `createServerFn` 进行类型安全的前后端 RPC 调用。
- **纯位运算比对**：服务端无复杂外部依赖，通过高性能 Hamming 距离算法（Brian Kernighan 快速位运算）在 Node.js 中高效比对。
- **全栈同构与代码共享**：Zod 数据 Schema、类型与校验工具在前端与后端无缝共享，自动享受 Tree-shaking 保护。
- **动态二维码生成**：凭证创建后本地自动生成带有安全 Token 的访问链接和二维码。

---

## 🛠️ 技术栈

- **全栈框架**：[TanStack Start](https://tanstack.com/start) (React 19, TypeScript, Bun, Vite, Nitro)
- **路由与数据请求**：TanStack Router, TanStack Query
- **图像算法**：OpenCV.js (浏览器端 ORB 关键点与描述子提取，多 CDN 自动容灾)
- **数据库 & ORM**：PostgreSQL (Neon / Supabase / 自建), Drizzle ORM
- **样式与 UI**：Tailwind CSS v4, Lucide React
- **代码规范**：Biome

---

## 🚀 本地开发指南

### 1. 准备工作

确保已安装 [Bun](https://bun.sh/)（推荐）或 Node.js (>= 20)。

```bash
# 克隆仓库并进入目录
git clone <your-repo-url>
cd visionpass

# 安装依赖
bun install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写 PostgreSQL 数据库连接串：

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/visionpass
APP_ORIGIN=http://localhost:3000
```

### 3. 初始化数据库

使用 Drizzle 将数据表结构同步到本地或远程数据库：

```bash
bun run db:push
```

### 4. 启动全栈开发服务

```bash
bun dev
```

本地服务启动后访问 `http://localhost:3000`。TanStack Start 会同时提供前端 SPA 与 Server Functions 的全栈 HMR 热更新支持。

---

## ☁️ Vercel 部署指南

本项目原生支持一键部署到 Vercel：

### 步骤 1：准备 PostgreSQL 数据库
推荐使用以下任意托管 PostgreSQL 数据库：
- [Neon](https://neon.tech/)（推荐，Serverless 弹性伸缩和连接池支持）
- [Supabase](https://supabase.com/)
- 自建 PostgreSQL 实例

获取数据库连接串（例如 `postgres://user:password@ep-xyz.neon.tech/neondb?sslmode=require`）。

### 步骤 2：初始化远程数据库表结构
在本地将远程 `DATABASE_URL` 填入 `.env` 后运行：

```bash
bun run db:push
```

### 步骤 3：部署到 Vercel

1. 将代码推送到 GitHub 仓库。
2. 登录 [Vercel 控制台](https://vercel.com/)，导入该 GitHub 仓库。
3. **Environment Variables**（环境变量）中配置以下两项：
   - `DATABASE_URL`：填写 PostgreSQL 连接字符串。
   - `APP_ORIGIN`：填写你的 Vercel 生产域名（如 `https://your-visionpass-domain.vercel.app`）。
4. 点击 **Deploy** 开始全自动构建与部署。

---

## 📋 脚本清单

| 命令 | 说明 |
|---|---|
| `bun dev` | 启动 TanStack Start 全栈开发服务器 |
| `bun run build` | 执行 TypeScript 类型检查与全栈生产打包 |
| `bun run preview` | 预览生产全栈打包产物 |
| `bun run db:push` | 将 Drizzle Schema 直接同步到 PostgreSQL |
| `bun run db:generate` | 生成 Drizzle SQL 迁移脚本 |
| `bunx @biomejs/biome check` | 执行代码规范与格式检查 |

---

## 📄 License

MIT
