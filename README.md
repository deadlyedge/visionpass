# VisionPass - 视觉密语 (Visual Passcode)

VisionPass 是一个基于图像特征识别的端到端视觉密语系统（MVP）。用户可以通过上传一张参考图片来封存一段密语，接收方只有提供相同或高度相似画面的图片，才能通过特征比对解锁并查看密语。

---

## 🌟 核心特性

- **隐私优先（零原图上传）**：图片仅在浏览器主线程进行灰度化与 ORB 描述子提取，原始图片永远不会上传到服务器或存储在数据库中。
- **纯位运算比对**：服务端无复杂外部依赖，通过高性能 Hamming 距离算法（Brian Kernighan 快速位运算）在 Node.js 中高效比对。
- **单仓全栈极简部署**：基于 React 19 + Vite + TanStack Router/Query + Vercel Functions + PostgreSQL 构建，支持一键部署至 Vercel。
- **动态二维码生成**：凭证创建后自动生成带有安全 Token 的访问链接和二维码。

---

## 🛠️ 技术栈

- **前端**：React 19, TypeScript, Vite, Tailwind CSS, Lucide React
- **路由与请求**：TanStack Router, TanStack Query
- **图像算法**：OpenCV.js (浏览器端 ORB 关键点与描述子提取)
- **后端服务**：Vercel Serverless Functions (Node.js)
- **数据库 & ORM**：PostgreSQL (Neon / Supabase / 自建), Drizzle ORM
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
APP_ORIGIN=http://localhost:5173
```

### 3. 初始化数据库

使用 Drizzle 将数据表推送同步到数据库：

```bash
bun run db:push
```

### 4. 启动本地开发服务

```bash
bun dev
```

本地服务启动后访问 `http://localhost:5173`。开发服务器已内置 API 代理中间件，支持直接在本地调试 `/api/*` 服务端接口。

---

## ☁️ Vercel 部署指南

本项目可直接部署到 Vercel，无需独立运行后端服务。

### 步骤 1：准备 PostgreSQL 数据库
推荐使用以下任意托管 PostgreSQL 数据库：
- [Neon](https://neon.tech/)（推荐，具备 Serverless 弹性伸缩和连接池）
- [Supabase](https://supabase.com/)
- 自建 PostgreSQL 实例

获取数据库连接串（例如 `postgres://user:password@ep-xyz.neon.tech/neondb?sslmode=require`）。

### 步骤 2：初始化远程数据库表结构
在本地配置好远程 `DATABASE_URL` 后运行：

```bash
bun run db:push
```

### 步骤 3：部署到 Vercel

1. 将代码推送到 GitHub 仓库。
2. 登录 [Vercel 控制台](https://vercel.com/)，点击 **Add New...** -> **Project** 并导入你的 GitHub 仓库。
3. **Framework Preset** 选择 **Vite**。
4. **Environment Variables**（环境变量）中配置以下两项：
   - `DATABASE_URL`：填写步骤 1 中的 PostgreSQL 连接字符串。
   - `APP_ORIGIN`：填写你的 Vercel 生产域名（如 `https://your-visionpass-domain.vercel.app`）。
5. 点击 **Deploy** 开始部署。

部署完成后即可通过生产域名体验完整的视觉密语创建与验证全流程！

---

## 📋 脚本清单

| 命令 | 说明 |
|---|---|
| `bun dev` | 启动本地 Vite 开发服务器（含 API Mock 中间件） |
| `bun run build` | 检查 TypeScript 类型并执行生产打包 |
| `bun run preview` | 预览生产打包产物 |
| `bun run db:push` | 将 Drizzle Schema 直接同步到 PostgreSQL |
| `bun run db:generate` | 生成 Drizzle SQL 迁移脚本 |
| `bunx @biomejs/biome check` | 执行代码规范与格式检查 |

---

## 📄 License

MIT
