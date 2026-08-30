# AGENTS.md

本文件为 AI Agent、开发者与自动化工具提供 VisionPass 项目的架构规范、上下文理解和开发指导原则。

---

## 1. 项目定位与核心闭环

VisionPass（视觉密语）是一个基于 **浏览器端视觉特征提取（ORB）** 与 **服务端 RANSAC 空间几何内点一致性比对** 的现代全栈视觉密语系统。

### 核心业务链路：
1. **首页愿景与导航** (`/`)：介绍“物理万物即数字密钥”的哲学、零原图上云隐私保障以及实际落地场景，引导用户进入 Playground 或阅读技术文档。
2. **体验工坊** (`/playground`)：
   - **创建凭证** (`/playground?tab=create`)：用户选择一张参考图片并输入密语。浏览器端使用 Web Worker 隔离的高速 OpenCV.js WASM 提取灰度化及缩放后的 ORB 描述子与关键点，打包为标准 `OrbFeaturePayloadV1` JSON，通过 TanStack Start **Server Function (`createCredentialFn`)** 发送到服务端，服务端生成随机安全 token 并将 payload 与密语持久化至 PostgreSQL，最终为用户生成读取 URL、易读口令及可拖拽排版的分享海报。
   - **扫码与验证** (`/playground?tab=verify`)：用户调起摄像头，通过原生 `BarcodeDetector` + `jsQR` 双引擎毫秒级识别口令，无缝切入连续视频流并在前端实时提取 ORB 特征，以 800ms 频率通过 **Server Function (`verifyCredentialFn`)** 提交给服务端。
3. **技术白皮书** (`/docs`)：系统化解析愿景、ORB / Lowe's Ratio / RANSAC 空间单应性矩阵算法公式、全栈选型与时序全景。
4. **直达验证凭证** (`/r/$token`)：用户打开专用读取链接，支持直接调起摄像头或相册图片完成特征比对与密语实时解密。

---

## 2. 关键架构设计与铁律

为确保系统的安全性、轻量化与可部署性，在后续扩展或修改时必须严格遵守以下原则：

1. **零原图传输与存储**：
   - 原始图像（无论参考图还是验证图）**严禁**上传到后端或保存至数据库/对象存储。
   - 所有图像解码、resize（最长边 640px）、灰度转换与 ORB 特征提取均在客户端 Web Worker 独立线程内完成。
2. **无独立 REST API 目录，纯 Server Functions 通信**：
   - 全面废弃独立的 `api/` 目录与手动 `fetch`。
   - 所有的前后端通信统一采用 TanStack Start 提供的类型安全 **`createServerFn`**。
   - 服务端逻辑统一收敛在 `src/server/` 中，由 Nitro 负责统一打包与 Tree-shaking。
3. **服务端无重量级依赖**：
   - 服务端**不引入** OpenCV Node native 绑定或 Python 进程，全部比对逻辑均由 TypeScript 纯位运算（Brian Kernighan 算法）与高斯消元法在 `src/server/matcher/` 中实现。
4. **状态与元数据隔离与 AEAD 加密**：
   - `getCredentialMetaFn({ data: { token } })` 只返回凭证是否存在（`{ exists: boolean }`），绝不泄露密语或特征集。
   - 数据库存储使用 HMAC-SHA-256 加盐 Token 哈希索引与 AES-256-GCM 密文落盘。
   - 密语仅在 `verifyCredentialFn` 几何匹配（Inliers 达标）通过后由服务端实时解密返回。
5. **集中常量定义**：
   - 版本号、应用名称及 GitHub 仓库链接统一在 `src/lib/constants.ts` 中的 `CONSTANTS.APP` 下定义与维护，避免在各组件与路由中硬编码。

---

## 3. 代码结构地图

```text
visionpass/
├── src/
│   ├── routes/                   # TanStack Router 路由树
│   │   ├── __root.tsx            # 全局布局 (Header, Footer, 导航及常量消费)
│   │   ├── index.tsx             # 首页愿景展示与 CTA
│   │   ├── playground.tsx        # /playground 体验工坊 (创建与扫码比对)
│   │   ├── docs.tsx              # /docs 技术与算法白皮书
│   │   ├── create.tsx            # /create 重定向至 playground
│   │   ├── read.tsx              # /read 重定向至 playground
│   │   └── r.$token.tsx          # /r/:token 直达验证与解密页
│   ├── components/               # UI 组件集
│   │   ├── playground/           # Playground 拆分模块 (CreateSection, ReadSection)
│   │   ├── poster/               # 拖拽海报生成器 (PosterGenerator, QrOverlayDraggable)
│   │   ├── scanner/              # 扫码与摄像头源切换 (QrScannerView, CameraSourceSelect)
│   │   ├── viewer/               # 密语展示器与 ORB 星空散点 (SecretViewer, KeypointsCanvas)
│   │   ├── image-picker.tsx      # 本地图片选择器
│   │   └── qr-result.tsx         # 凭证生成结果与海报入口
│   ├── server/                   # 服务端独占逻辑 (Nitro 统一打包)
│   │   ├── crypto/               # CSPRNG Token、HMAC-SHA-256 与 AES-256-GCM
│   │   ├── db/                   # Drizzle ORM 配置与 Schema (PostgreSQL)
│   │   ├── matcher/              # 纯 TypeScript 几何匹配引擎 (KNN, Lowe Ratio, RANSAC)
│   │   ├── security/             # IP 滑动窗口限流与安全防护
│   │   └── functions/            # createServerFn 实现集 (create, meta, verify)
│   ├── lib/                      # 前后端通用工具与客户端库
│   │   ├── constants.ts          # 全局配置常量 (APP 版本、GitHub、Token 长度、匹配阈值)
│   │   ├── extract-orb.ts        # 浏览器端 ORB 特征提取桥接
│   │   ├── feature-codec.ts      # Base64 描述子编解码
│   │   ├── feature-schema.ts     # Zod 凭证与特征协议 (OrbFeaturePayloadV1)
│   │   └── vision-worker-client.ts# Web Worker 异步调度客户端
│   ├── workers/                  # Web Worker 图像流水线 (OpenCV.js WASM)
│   ├── hooks/                    # 核心 React Hooks (useCameraStream, useLiveOrbMatcher 等)
│   └── styles/                   # 全局样式
├── drizzle/                      # 数据库迁移 SQL 文件
├── tests/                        # 单元测试集 (Crypto, Matcher, Security)
├── biome.json                    # 代码格式化与 Linter 规则
└── package.json                  # 项目依赖与元数据配置
```

---

## 4. 常见开发与调试指令

- **启动本地开发**：`bun dev`（前后端全栈 HMR 实时热更新）
- **运行单元测试**：`bun test`
- **类型检查与构建**：`bun run build`
- **代码规范检查与修复**：`bunx @biomejs/biome check --write src/`
- **生成数据库迁移**：`bun run db:generate`
- **应用数据库变更**：`bun run db:push`
