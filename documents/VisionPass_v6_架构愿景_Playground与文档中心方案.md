# VisionPass 架构升级与新特性实施方案 (v6.0)

本文档规划了 VisionPass 的界面重构、愿景展示、Playground 迁移、在线文档中心及响应式体验升级的完整技术方案。

---

## 🎯 需求与目标概述

1. **响应式设计 (Responsive UI/UX)**：适配移动端、平板与桌面端（采用 Tailwind CSS v4 移动优先断点），优化导航栏（汉堡菜单/底部栏）、海报生成器拖拽、扫码窗口以及排版布局。
2. **功能迁移至 Playground (`/playground` 或 `/playground/create` & `/playground/read`)**：
   - 将现有凭证创建、海报生成、扫码流式校验等交互式工具归整收敛至 **Playground (工作台/体验区)**。
   - 保持原有的 `/r/$token` 直达校验链接向下兼容。
3. **首页 (`/`) 愿景重构 (Vision & Value Proposition)**：
   - 打造高科技感、直观且引人入胜的 Landing Page。
   - 深入探讨物理世界与数字世界的桥梁：为什么需要“视觉密语”？（物体即密钥、零隐私上云、抗封锁海报、去中心化物理寻宝/机密投递）。
   - 吸引开发者与极客共同参与开源生态建设。
4. **在线文档中心 (`/docs` 或 `/documents`)**：
   - 系统化阐述项目的演进脉络：
     1. **愿景与哲学**：隐私优先的物理世界零知识交互。
     2. **核心算法深度解析**：ORB 特征提取、Lowe's Ratio Test、DLT 单应性矩阵求解、RANSAC 几何内点检验、AES-256-GCM 与 HMAC-SHA-256 双 Token 机制。
     3. **全栈技术选型**：TanStack Start、Web Worker + OpenCV.js WASM、PostgreSQL + Drizzle、纯 TypeScript 几何引擎。
     4. **代码架构与全景蓝图**：模块边界、数据流时序图（创建/扫码验证）、Server Functions 设计。
5. **开源生态与 GitHub 链接**：
   - 全局 Header、Footer 及 Landing Page/Docs 显著位置集成 GitHub 仓库链接、Star 引导、版本标号与开源贡献指南。

---

## 🗺️ 路由与架构演进设计

### 1. 路由体系规划

| 路径 | 页面定位 | 核心内容 |
|---|---|---|
| `/` | 首页 / 愿景展示 | Hero 视觉区、核心痛点与愿景、3大核心支柱 (零云存储/物理即密钥/几何校验)、架构特性概览、开发者生态入口、Playground 引导 CTA |
| `/playground` | 体验工坊 (Playground) | 集合「创建视觉凭证」与「扫描/口令验证」两个子功能或 Tab 切换页，内嵌实时 Canvas 特征点动态演示 |
| `/docs` (或 `/documents`) | 开发者与原理文档 | 侧边栏/分类导航：<br>1. 概述与愿景 (`vision`)<br>2. 核心算法与数学原理 (`algorithm`)<br>3. 技术栈架构与选型 (`tech-stack`)<br>4. 代码架构与时序全景 (`architecture`) |
| `/read` | 独立扫码/验证入口 | 快捷跳转或直接嵌入流式扫码工作流（兼容旧外链） |
| `/r/$token` | Token 专用直达校验页 | 原有直达读取页，继续保持路由向下兼容 |

---

## 📐 详细模块设计方案

### 模块一：全局导航与响应式布局升级 (`src/routes/__root.tsx`)

- **顶部导航栏 (Header)**：
  - **Brand Logo & Version**：`VisionPass v6.0`
  - **桌面端导航**：
    - 首页 (`/`)
    - 演练场 (`/playground` - 整合创建与读取)
    - 技术文档 (`/docs`)
    - GitHub 仓库（带 Star 图标外链，支持新窗口打开）
  - **移动端适配**：
    - 折叠式汉堡菜单（Mobile Dropdown Menu）或响应式浮动底部栏。
    - 触控友好的大按钮（Min Tap Target 44x44px）。
- **页脚 (Footer)**：
  - 愿景标语、GitHub 开源协议 (MIT License)、文档快速索引、系统架构技术栈标记。

---

### 模块二：首页愿景与价值呈现 (`src/routes/index.tsx`)

首页应具备现代科技感（Dark 赛博简约风格，辅以 Indigo / Violet 微光渐变与网格背景）：

1. **Hero Section (第一屏)**：
   - **主标语**：让现实世界的万物，成为你的数字密钥。
   - **副标语**：基于浏览器端 ORB 视觉特征提取与服务端 RANSAC 几何单应性校验的零知识物理密语系统。
   - **交互 CTA**：
     - `立即体验 Playground`（前往 `/playground`）
     - `阅读架构与算法文档`（前往 `/docs`）
     - `Star on GitHub`
2. **痛点与愿景 (Why VisionPass?)**：
   - **对比传统密码/2FA**：密码容易被遗忘，二维码容易被直接转发现实截屏。而物理物体的视觉特征（例如特定角度的笔记本封面、桌面摆件、艺术画作）具备天然物理共场属性。
   - **物理即密钥 (Physical Object as Key)**：无需对物体做破坏性标记或贴二维码，物体本身的纹理几何就是密语锁。
   - **零原图传输（Privacy-First）**：绝不上传任何原始相片到服务器，所有特征提取均在浏览器端 Web Worker 内完成。
3. **三大技术护城河 (How It Works)**：
   - **端侧 WASM 特征引擎**：OpenCV.js Web Worker，毫秒级灰度缩放与 ORB 描述子生成。
   - **服务端纯 TS 几何一致性引擎**：Hamming KNN + Lowe's Ratio + RANSAC 单应性矩阵拟合，杜绝纹理伪造。
   - **双 Token 与 AEAD 密码学保障**：HMAC 加盐索引 + AES-256-GCM 密语加密，仅当且仅当几何内点达标后实时放行。
4. **典型应用场景**：
   - 🕵️ **实景寻宝 / 密室逃脱 / 线下解谜**：到达指定实物面前拍照才能解锁下一关线索。
   - 📦 **物理交接与防伪验证**：结合物理实体特征封存交接密码或验证信息。
   - 💌 **浪漫物理信物**：将对彼此有意义的专属物件（如纪念相框、特定手表表盘）作为打开私密留言的唯一钥匙。
5. **开发者共建与开源生态**：
   - 为什么开源？推动端侧计算机视觉与去中心化安全结合的探索。
   - 贡献指南与模块扩展指引。

---

### 模块三：Playground 统一工作台 (`src/routes/playground.tsx`)

将原先分散在 `/create` 和 `/read` 的交互整合进更具专业感和探索性的 Playground：

1. **双模式切换 (Tab / Segment Control)**：
   - 模式 A：**创建凭证 (Create VisionPass)**
     - 图片拖拽/选择与摄像头拍摄
     - 实时预览 ORB 特征点散点分布（点数指示器、提取耗时）
     - 密语输入与海报/QR 自定义排版与导出
   - 模式 B：**验证/扫码解锁 (Verify & Scan)**
     - 连续摄像头流式扫码 + 实时 800ms ORB 抽帧比对
     - 支持相册照片手动上传比对
     - 实时匹配质量（匹配点数、RANSAC 几何内点数、Homography 匹配状态）反馈
2. **向下兼容**：
   - 原 `/create` 路由可保留重定向至 `/playground?tab=create` 或直接展示创建页面。
   - 原 `/read` 路由可保留重定向至 `/playground?tab=read`。

---

### 模块四：在线技术文档系统 (`src/routes/docs.tsx`)

提供精美的结构化技术文档，分为四个递进章节：

#### 1. 愿景与安全哲学 (`/docs?section=vision`)
- 物体作为物理锚点（Physical Anchor）。
- 威胁模型（Threat Model）分析：抗中间人劫持、抗数据库拖库明文泄露、抗重放攻击。
- 零原图上云的合规与隐私收益。

#### 2. 核心算法与数学原理 (`/docs?section=algorithm`)
- **ORB (Oriented FAST and Rotated BRIEF)**：
  - FAST 角点检测 + 灰度质心法（Intensity Centroid）确定特征点方向。
  - BRIEF 二进制描述子（256 位 = 32 字节）在旋转坐标系下的采样。
- **特征匹配与 Lowe's Ratio Test**：
  - 基于 Hamming 距离的 KNN 最近邻与次近邻距离比值（$d_1 / d_2 \le 0.75$）过滤歧义点。
- **RANSAC 与 2D 单应性矩阵（Homography）几何校验**：
  - 为什么仅靠 Hamming 距离是不够的（重复纹理、杂乱背景误配）。
  - DLT（Direct Linear Transformation）4 对内点求解 $3 \times 3$ 单应性矩阵 $H$。
  - 空间几何投影误差校验：$\| \mathbf{x}' - H \mathbf{x} \| < \epsilon$，统计最大一致性内点集（Inliers $\ge 12$）。

#### 3. 全栈技术选型与实现考量 (`/docs?section=tech-stack`)
- **前端与框架**：TanStack Start、TanStack Router、Tailwind CSS v4、Lucide 图标。
- **端侧多线程**：Web Worker + OpenCV.js WASM 独立线程隔离，避免高负载图像计算导致 UI 掉帧。
- **服务端无状态轻量化**：纯 TypeScript 实现 Hamming 比对与高斯消元求矩阵，免除 Node-gyp 与 C++ 原生动态链接库在 Serverless 环境下的部署困境。
- **数据持久化**：PostgreSQL + Drizzle ORM，轻量存储 Base64 编码的特征向量。

#### 4. 代码架构与时序图全景 (`/docs?section=architecture`)
- 前后端目录划分与职责边界。
- 凭证创建链路时序图（Client -> Worker -> Server Function -> PostgreSQL）。
- 凭证验证链路时序图（Camera/File -> Worker -> Server Function -> RANSAC Matcher -> Decrypt -> Return Secret）。
- 安全加固机制（Token Pepper 加盐、AES-256-GCM、IP 限流中间件）。

---

## 📱 响应式设计与移动端体验优化细则

1. **断点规范 (Tailwind CSS v4)**：
   - 移动端 (`< 640px`)：全屏利用、1 列网格排版、底栏/浮动操作、扫码器自适应占满宽度。
   - 平板端 (`640px ~ 1024px`)：自适应 2 列，边距与字体缩放。
   - 桌面端 (`> 1024px`)：宽屏双列交互（左侧上传/相机，右侧特征点信息与结果卡片）。
2. **触摸手势与设备兼容**：
   - 海报拖拽 QR 覆盖层支持 Touch 事件与 Pointer 事件统一处理。
   - 扫码组件根据手机后置/前置摄像头智能预设 `facingMode: "environment"`。

---

## 🛠️ 实施步骤计划 (Implementation Plan)

1. **Step 1: 编写设计与架构文档**（当前文档及各章节详细文字）。
2. **Step 2: 响应式根布局与导航重构 (`__root.tsx`)**：
   - 添加 GitHub 链接、Docs 链接、Playground 链接。
   - 实现移动端响应式折叠菜单或移动栏。
3. **Step 3: 建设首页愿景 Landing Page (`index.tsx`)**：
   - 实现科技感视觉 Hero、痛点愿景模块、算法特性卡片、应用场景展示与 CTA。
4. **Step 4: 创建 Playground 页面 (`playground.tsx`)**：
   - 迁移并整合凭证创建与流式扫码/验证功能，支持流畅的 Tab 切换与移动端排版。
5. **Step 5: 构建系统化技术文档页面 (`docs.tsx`)**：
   - 模块化组织愿景、算法公式与原理、技术栈、架构图与代码时序。
6. **Step 6: 代码质量与测试验证**：
   - 执行 Biome 检查，运行现存单元测试，验证构建与全栈热更。
