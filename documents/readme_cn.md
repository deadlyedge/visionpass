# VisionPass - 视觉密语 (Visual Passcode) v0.7.0

[English README](../README.md) | 简体中文

VisionPass 是一个基于端侧视觉特征提取与服务端几何一致性检验的现代化全栈视觉密语系统。用户可通过一张参考图片将机密文本安全封存，接收方只有通过相机对准相同或高度相似的物理画面（或上传相册画面），才能通过 ORB 特征与 RANSAC 单应性矩阵几何内点校验解锁并查看密语。

系统基于 **TanStack Start (React 19 + Nitro + Vite + Bun)** 现代全栈体系构建，前后端通过类型安全的 **Server Functions (`createServerFn`)** 进行同构通信，遵循**零原图上传**、**双 Token 去中心化解耦**与 **AES-256-GCM AEAD 服务端受控加密**等核心工业级安全原则。

---

## 🌟 核心特性与架构亮点

1. **隐私优先（零原图上云）**：
   - 所有图片解码、缩放（最长边 640px）、灰度转换与 ORB 特征提取均在客户端独立 **Web Worker** 线程中完成，原始图片绝不上传或存储到服务端/数据库。
2. **纯 TypeScript 工业级几何匹配引擎**：
   - 服务端零 C++/Python 依赖，纯 TypeScript 高性能实现 **Hamming KNN 检索 + Lowe's Ratio Test + DLT/高斯消元法 + RANSAC 2D 单应性矩阵（Homography）几何内点校验**，单次比对耗时 $\le 5\text{ms}$，有效拦截相似物体错配与纹理欺骗。
3. **双 Token 安全模型与 AEAD 密语加密**：
   - 采用 `publicToken`（CSPRNG 16 字节）+ `displayPasscode`（Base32 易读口令），数据库仅存储 `HMAC-SHA-256(TOKEN_PEPPER, token)` 单向哈希，杜绝明文凭证泄露；
   - 密语采用标准 **AES-256-GCM** 加密存储，仅在几何特征比对达标后由服务端实时解密放行。
4. **去中心化与抗封阻海报分享生态**：
   - 二维码仅编码纯口令（`displayPasscode`），与部署域名彻底解耦，生成的二维码矩阵稀疏、易扫描、抗封锁；
   - 支持拖拽式带 QR 覆盖层的分享海报生成与离线 Canvas 全分辨率 PNG 导出。
5. **沉浸式连续摄像头流式体验（Continuous Camera Session）**：
   - 结合原生 `BarcodeDetector` 与高性能 `jsQR` 双引擎实现毫秒级秒扫；
   - 扫码命中口令后，摄像头视频流保持连续运行，无缝切入实时画面 ORB 星空散点微光渲染（`KeypointsCanvas`）与自动抽帧比对，彻底告别黑屏卡顿。
6. **响应式设计、国际化与 Playground / Docs 中心**：
   - **首页愿景展示**：深度阐述“让物理万物成为数字密钥”的哲学与应用场景；
   - **Playground (体验工坊)**：一站式创建凭证海报与流式扫码比对；
   - **在线技术白皮书 (`/docs`)**：从物理愿景、数学算法、全栈选型到时序全景的系统化说明；
   - **国际化 (i18n)**：支持中英文无缝切换；
   - **集中式常量配置**：版本号与 GitHub 仓库信息统一收敛至 `CONSTANTS.APP`。

---

## 🛠️ 技术栈

- **全栈框架**：[TanStack Start](https://tanstack.com/start) (React 19, TypeScript, Bun, Vite, Nitro)
- **路由与状态管理**：TanStack Router (类型安全路由树), TanStack Query
- **端侧图像计算**：OpenCV.js WASM (Web Worker 独立线程隔离, 零阻塞 60fps 交互)
- **QR 编码与解码**：`qrcode` (海报/独立码生成), `jsQR` (跨平台通用极速扫码识别)
- **密码学与安全**：Node.js Crypto (`aes-256-gcm`, `hmac-sha256`), 内存滑动窗口限流
- **数据库 & ORM**：PostgreSQL (Neon / Supabase / 自建), Drizzle ORM
- **样式与组件**：Tailwind CSS v4, Lucide React
- **国际化 (i18n)**：轻量级 React Context i18n 体系
- **代码规范 & 质量**：Biome

---

## 📁 目录结构

```text
visionpass/
├── src/
│   ├── routes/                   # TanStack Router 路由树
│   │   ├── __root.tsx            # 全局根布局 (Header, Navigation, Footer, 常量注入, i18n Provider)
│   │   ├── index.tsx             # 首页愿景与价值呈现 Landing Page
│   │   ├── playground.tsx        # /playground 体验工坊 (创建与扫码验证 Tab 切换)
│   │   ├── docs.tsx              # /docs 开发者与算法技术白皮书
│   │   ├── create.tsx            # /create 重定向至 /playground?tab=create
│   │   ├── read.tsx              # /read 重定向至 /playground?tab=verify
│   │   └── r.$token.tsx          # /r/:token 专用直达验证与解密页
│   ├── components/               # 交互组件集
│   │   ├── playground/           # Playground 模块 (CreateSection, ReadSection)
│   │   ├── poster/               # 拖拽式海报生成器 (PosterGenerator, QrOverlayDraggable)
│   │   ├── scanner/              # 摄像头扫码与多设备切换器 (QrScannerView, CameraSourceSelect)
│   │   ├── viewer/               # 密语展示器与 ORB 星空散点渲染 (SecretViewer, KeypointsCanvas)
│   │   ├── image-picker.tsx      # 本地相册与拍照选择器
│   │   ├── qr-result.tsx         # 凭证生成结果与模式切换
│   │   └── processing-state.tsx  # 状态加载组件
│   ├── hooks/                    # 核心 React Hooks
│   │   ├── use-camera-stream.ts  # 现代化摄像头 MediaStream 状态与设备管理
│   │   ├── use-barcode-scanner.ts# 原生 BarcodeDetector + jsQR 双引擎扫码 Hook
│   │   └── use-live-orb-matcher.ts# 视频流 800ms 抽帧、Worker 提取与单飞防并发比对 Hook
│   ├── workers/                  # Web Worker 图像特征提取流水线
│   │   ├── opencv.worker.ts      # OpenCV.js WASM 图像缩放、灰度化、ORB 特征提取
│   │   └── worker-types.ts       # Worker 消息协议定义
│   ├── server/                   # 服务端独占逻辑 (Nitro 统一打包)
│   │   ├── crypto/               # CSPRNG Token 生成、HMAC 哈希与 AES-256-GCM 加解密
│   │   ├── db/                   # Drizzle ORM 配置与 Schema (PostgreSQL)
│   │   ├── matcher/              # 纯 TypeScript 几何匹配引擎 (KNN, Lowe Ratio, RANSAC)
│   │   ├── security/             # IP 滑动窗口限流与安全防护
│   │   ├── functions/            # TanStack Start createServerFn (create, meta, verify)
│   │   └── utils/                # 结构化服务端日志输出
│   ├── i18n/                     # 国际化语言包与 React Context Provider
│   │   ├── locales/              # 中英文词条字典 (zh.ts, en.ts)
│   │   └── index.tsx             # I18nProvider 与 useI18n Hook
│   └── lib/                      # 前后端共享工具库
│       ├── constants.ts          # 全局配置常量 (APP 版本与 GitHub 链接、Token 长度、匹配阈值)
│       ├── feature-codec.ts      # 二进制描述子 Base64URL 编码解码
│       ├── feature-schema.ts     # Zod 凭证与特征协议 (OrbFeaturePayloadV1)
│       └── vision-worker-client.ts# 浏览器端 Web Worker 通信客户端
├── tests/                        # 单元测试集 (Crypto, Matcher, Security)
├── drizzle/                      # 数据库迁移 SQL 脚本
└── vite.config.ts                # Vite / Nitro / Tailwind 全栈构建配置
```

---

## 🚀 本地开发指南

### 1. 准备工作

确保已安装 [Bun](https://bun.sh/)（推荐，`>= 1.1`）或 Node.js (`>= 20`)。

```bash
# 克隆仓库并进入目录
git clone https://github.com/deadlyedge/visionpass.git
cd visionpass

# 安装依赖
bun install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```env
# PostgreSQL 数据库连接串 (支持 Neon, Supabase, Vercel Postgres 等)
DATABASE_URL=postgresql://postgres:password@localhost:5432/visionpass

# 应用访问域名
APP_ORIGIN=http://localhost:3000

# (可选) 服务端 Token 加盐密钥与密语主加密 Key (开发环境提供安全 fallback)
# TOKEN_PEPPER=your_custom_pepper_secret
# SECRET_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

### 3. 初始化数据库表结构

使用 Drizzle 将数据表结构同步到 PostgreSQL 数据库：

```bash
bun run db:push
```

### 4. 运行测试套件

```bash
bun test
```

### 5. 启动全栈开发服务

```bash
bun dev
```

本地服务启动后访问 `http://localhost:3000`。TanStack Start 会提供前端 SPA 与 Server Functions 的实时全栈 HMR 热更新。

---

## ☁️ 生产部署指南 (Vercel / Node.js)

本项目原生支持部署至 [Vercel](https://vercel.com/)、Docker 容器或任何 Node.js 运行环境：

### 部署到 Vercel：
1. 将代码推送到 GitHub。
2. 在 Vercel 控制台导入该仓库，框架预设选择 **Other**（或自动识别的 Vite/Nitro）。
3. 配置生产环境变量：
   - `DATABASE_URL`：PostgreSQL 连接串（推荐使用 [Neon](https://neon.tech/) Serverless Postgres）。
   - `APP_ORIGIN`：生产部署域名（如 `https://your-domain.vercel.app`）。
   - `SECRET_ENCRYPTION_KEY`：生产用 32 字节 AES 密钥（64 位 Hex 字符串）。
   - `TOKEN_PEPPER`：生产用 HMAC 加盐密钥。
4. 点击 **Deploy** 完成一键部署。

---

## 📋 脚本清单

| 命令 | 说明 |
|---|---|
| `bun dev` | 启动 TanStack Start 全栈开发服务器 |
| `bun test` | 执行全套自动化单元测试（密码学、RANSAC、限流） |
| `bun run build` | 执行 TypeScript 类型检查与全栈生产打包 |
| `bun run preview` | 本地预览生产全栈打包产物 |
| `bun run db:push` | 将 Drizzle Schema 直接同步到 PostgreSQL |
| `bun run db:generate` | 生成 Drizzle SQL 增量迁移脚本 |
| `bunx @biomejs/biome check` | 执行 Biome 代码规范与格式检查 |

---

## 📄 License

MIT
