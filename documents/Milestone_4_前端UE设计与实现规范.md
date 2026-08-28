# Milestone 4 前端 UE 设计与实现规范（基于上一代模型分析与产品级演进）

## 0. 概述与定位

本设计文档旨在深入剖析上一代验证模型前端实现（`references/secret-word-front`）的交互设计、状态流转、摄像头流式处理与富文本机制，提炼其优秀实践与交互缺陷；同时紧密结合 `documents/重构实施方案_v5.1.md` 的架构原则（TanStack Start 全栈、双 Token 安全模型、Web Worker 异步特征流水线、单参考图与 QR Mask 隔离、纯 Server Functions 通信），为 **Milestone 4（产品级功能扩展）** 提供详尽、可直接落地的 UE（用户体验 / 用户界面）交互与工程实现指导。

> **关于密语内容格式的设计决策**：
> 上一代系统引入了体积庞大的 Tiptap 富文本套件。经评估，当前阶段（v5.1）聚焦于轻量极速的核心体验，密语以**纯文本（Plain Text）为主**，严格避免引入繁重的富文本编辑器依赖；同时在数据结构与展示层**预留 `format?: 'plain' | 'markdown' | 'json'` 扩展接口**，将完整富文本编辑与图文混排归入未来演进方向。

---

## 1. 上一代前端（`secret-word-front`）深度逆向分析

### 1.1 核心交互流程与组件架构

上一代系统主要包含 `/make`（创建密语卡片）与 `/get`（读取与验证密语）两个独立页面，其核心模块与交互链路如下：

```text
references/secret-word-front/
├── components/
│   ├── MakeCard.tsx          # 制作卡片：摄像头预览、ORB实时提取与冻结选定、Passcode输入、Tiptap富文本编辑、提交
│   ├── GetWords.tsx          # 获取密语：Passcode防抖监听、摄像头轮询抽帧比对、音频反馈、密语查看
│   ├── SelectCamera.tsx      # 多摄像头设备下拉切换器
│   ├── Editor.tsx & Viewer.tsx # Tiptap 富文本编辑模态窗与只读展示器
│   └── minimal-tiptap/       # 定制化的 Tiptap 2.x 富文本工具栏与扩展
├── hooks/
│   ├── useCamera.ts              # 摄像头设备枚举与当前 deviceId 状态管理
│   ├── useOrbProcessingStream.ts # 定时器驱动从 Webcam 抽帧并在 Canvas 执行 OpenCV ORB
│   └── useFrameProcessor.ts      # 结合 Passcode 状态触发 HTTP POST /vTag 轮询比对
└── lib/
    └── orbProcessor.ts       # 主线程直接运行 OpenCV.js 进行灰度化、ORB(500) 检测、绘制关键点与生成二维数组
```

### 1.2 上一代设计的亮点与值得继承的 UE 元素

1. **直观的特征点视觉反馈（ORB Keypoints Visualization）**：
   - 上一代在摄像头捕获或抽帧时，通过 `cv.drawKeypoints(src, keypoints, dst)` 在 Canvas 上实时绘制 ORB 关键点散点图，并直接反馈覆盖在视频画面上方。
   - **用户心理价值**：用户能直观看到画面中哪些纹理被“锁住”和“提取”，对“视觉暗号”建立强烈的科技感和安全信任感。
2. **多摄像头无缝切换能力（`SelectCamera`）**：
   - 监听 `navigator.mediaDevices.enumerateDevices()`，对移动端的前置/后置（`facingMode: "environment"`）以及多摄模组提供清晰的下拉切换。
3. **沉浸式验证成功的感官反馈**：
   - 验证命中时，通过播放提示音（`/audio/beep.mp3`）搭配动态展开的卡片，提供明确的正向反馈。

### 1.3 上一代设计的严重缺陷与演进痛点

| 维度 | 上一代（Legacy）实现缺陷 | v5.1 演进设计规范 |
|---|---|---|
| **主线程阻塞** | OpenCV.js 直接在主线程执行 `detectAndCompute` 与 `toDataURL`，导致低端移动设备高频抽帧（500ms/次）时 UI 掉帧、发热与卡顿。 | **Web Worker 隔离流水线**：所有 OpenCV 解码、预处理与 ORB 提取全部在独立 Worker 线程执行，主线程帧率保持 60fps。 |
| **网络风暴与暴力轮询** | 在 `/get` 页面输入 passcode 后，定时器每 1000ms 盲目向后端发送一次完整的 `number[][]` 特征向量请求，未做特征充足性门禁，无并发保护。 | **端侧门禁 + 状态机管控**：Worker 检查 `keypoints.count >= MIN_KEYPOINTS` 才允许触发验证；使用单飞 Promise 拦截重复并发。 |
| **安全与凭证定位单一** | 仅依赖纯手工输入的短暗号 `pass_code`（如 4 位字符串），易被暴力枚举与嗅探。 | **URL Token + QR 扫码直达 + 短 Passcode 兜底**：主通道通过 CSPRNG 随机生成的 `publicToken` 扫码免输入直达；辅以易读 `displayPasscode`。 |
| **参考图形态单一** | 只能实时从摄像头抓取，无法导入本地相册高清图；不支持带二维码海报生成与导出。 | **双源输入（相册/相机）+ 拖拽式带 QR 覆盖层海报合成 + QR Mask 隔离**。 |
| **包体积与依赖冗余** | 引入过重的 Tiptap 全家桶（ProseMirror 核心及几十个扩展插件），导致前端初次加载包体积膨胀。 | **轻量化原则**：现阶段采用标准多行文本/预留格式化接口，不打入庞大编辑器依赖。 |
| **前后端序列化损耗** | 将描述子转为 `number[][]`（大体积嵌套 JSON），网络传输体积巨大。 | **紧凑 Base64URL 紧凑编码（`FeaturePayloadV1`）**，结合 Server Functions 传输。 |

---

## 2. Milestone 4 核心交互与 UE 架构设计

Milestone 4 的核心任务包括两大模块：
1. **带 QR 覆盖层的分享海报生成器（Poster Generator with QR Overlay & Dragging）**
2. **多模态读取与验证交互页（QR 扫码识别 + 实时相机/文件验证 + 手动 Passcode 兜底）**

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Milestone 4 核心 UE 交互视图                                               │
├─────────────────────────────────────┬─────────────────────────────────────┤
│ 1. 凭证创建与海报分享 (/create)       │ 2. 凭证验证与读取 (/r/$token, /read) │
├─────────────────────────────────────┼─────────────────────────────────────┤
│  [步骤 1: 选取/拍摄参考图]            │  [入口 A: 扫码直达 /r/$token]        │
│    └─ 实时提取 ORB 特征 (Worker)    │    └─ 自动加载凭证元数据 (MetaFn)     │
│  [步骤 2: 输入密语文本 (预留富文本)]  │  [入口 B: 手动入口 /read]            │
│  [步骤 3: 预留并激活凭证]             │    ├─ 原生 BarcodeDetector 相机扫码   │
│  [步骤 4: 交互式海报生成器]           │    └─ 或手动输入 10~12位 Passcode    │
│    ├─ 原图画布预览                  │  [步骤 C: 上传/实时对准验证画面]      │
│    ├─ QR 覆盖层自由拖拽与吸附       │    ├─ Worker 实时/单次提取 ORB 特征   │
│    ├─ 自动生成 QR Mask 保护主特征   │    └─ Server Function 几何比对      │
│    └─ 一键导出高清分享海报 PNG       │  [步骤 D: 解密展示与听觉反馈]         │
└─────────────────────────────────────┴─────────────────────────────────────┘
```


---

## 3. 详细交互设计：带 QR 覆盖层海报生成器

### 3.1 业务价值与用户心智
用户创建密语凭证后，往往希望将“参考图案”与“读取二维码”合成一张精美的**视觉解密卡片/海报**分享给朋友或社交网络。朋友收到海报后：
1. 先扫码卡片上的二维码，拉起验证网页；
2. 再用手机摄像头对准海报中的主体画面，即可解锁密语。

### 3.2 交互流程与状态机

```text
[创建成功] ──► 切换至 [海报编辑模式]
                    │
                    ├─ 1. 显示参考图底图（保持原图比例）
                    ├─ 2. 覆盖可拖拽的 QR 码浮层（带半透明毛玻璃边框与位置指示）
                    ├─ 3. 支持预设位置快捷切换（左下、右下、左上、右上）
                    ├─ 4. 手指/鼠标按住 QR 码可在参考图范围内任意自由拖拽
                    │
                    ▼
           [点击“导出分享海报”]
                    │
                    ├─ 前端 Canvas 离线全分辨率重绘（原图 + QR Code + 定位角标）
                    ├─ 触发浏览器原生下载 / 移动端长按保存图片弹窗
                    └─ 自动向服务端同步 `qrOverlayMeta`（以备生成 QR Mask 隔离区域）
```

### 3.3 QR 覆盖层与 Mask 隔离规范（防误匹设计）
为防止二维码的高对比度黑白方块干扰 ORB 图像特征匹配，系统必须在海报合成与特征提取时实施 **QR Mask 隔离原则**：
- **元数据格式**：
  ```ts
  export type QrOverlayMeta = {
    x: number;      // 归一化坐标 0.0 ~ 1.0 (左上角)
    y: number;      // 归一化坐标 0.0 ~ 1.0
    width: number;  // 归一化宽度 (例如 0.25)
    height: number; // 归一化高度
  };
  ```
- **特征提取隔离**：当对“带海报”的图片进行提取时，Worker 在灰度化之后，将 `[x, y, width, height]` 区域在 `cv.Mat` 中涂黑（置 0）生成 Mask，确保 ORB 特征点仅落在背景主体真实物体上，杜绝因二维码图案相似而导致的特征污染。

### 3.4 交互细节与视觉组件规格

- **QR 覆盖层组件 (`QrOverlayDraggable`)**：
  - **默认位置**：右下角，留有 4% 的安全内边距（Padding）。
  - **拖拽边界约束**：QR 覆盖层整体必须严格限制在底图矩形内部（`0 <= x <= 1 - width`, `0 <= y <= 1 - height`）。
  - **辅助对齐吸附（Snapping）**：当拖拽接近四角（阈值 5%）时，自动产生平滑吸附效果。
  - **样式规范**：QR 码自带白色底色（Quiet Zone）与 1px 细微柔和阴影，确保在任何深浅背景底图上均清晰可扫。

---

## 4. 详细交互设计：多模态读取与验证页

### 4.1 路由规划与导航体系

- **`/r/$token`**：**扫码直达页**（主路径）。通过二维码直接携带 `publicToken`，页面加载后自动通过 `getCredentialMetaFn` 校验凭证有效性，就绪后直接展示验证取景器。
- **`/read`**：**手动检索/扫码页**（备用路径）。提供给没有直接打开链接的用户，支持**实时相机扫码**或**手动输入 10~12 位 `displayPasscode`**。

### 4.2 `/read` 路由交互设计（扫码与手动口令）

```text
┌─────────────────────────────────────────────────────────┐
│                    /read 页面交互布局                    │
├─────────────────────────────────────────────────────────┤
│  [ Tab 切换: 📷 扫码识别  |  ⌨️ 口令输入 ]               │
│                                                         │
│  ┌─ Tab 1: 📷 扫码识别 ──────────────────────────────┐  │
│  │  • 调起后置摄像头，显示扫描框与激光扫描线动效       │  │
│  │  • 优先调用原生 `BarcodeDetector` API              │  │
│  │  • Fallback: 基于 `@zxing/browser` 备用解码         │  │
│  │  • 识别成功 -> 自动重定向跳转至 /r/<publicToken>   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Tab 2: ⌨️ 口令输入 ──────────────────────────────┐  │
│  │  • 输入框 (格式如: VP-8X92-KLA3)                   │  │
│  │  • 自动大写转换与去除多余空格/连字符               │  │
│  │  • 点击“查询凭证” -> 校验成功后进入验证界面         │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 4.3 `/r/$token` 验证交互设计（实时对准 vs 本地上传）

在验证模式下，借鉴上一代的实时反馈优势，同时结合现代化的 Web Worker 性能保障：

1. **双输入模式无缝切换**：
   - **模式 A：实时对准比对（Live Camera Stream）**
     - 调起摄像头后，底部提供“开始对准识别”开关。
     - 开启后，前端以 **800ms 间隔**从视频流抓取帧，发送给 Web Worker 异步提取特征。
     - 关键帧特征点数达标（`keypoints.count >= 25`）时，在 Canvas 画面上**高亮绘制 ORB 关键点星空点阵**（绿色微光散点）。
     - 自动触发 `verifyCredentialFn`。若服务端返回 `matched: false`，画面显示黄色呼吸边框“继续对准主体...”；若返回 `matched: true`，立即播放“Beep”提示音，定格画面并展示解密内容。
   - **模式 B：相册/文件选择（Photo Upload）**
     - 适用于用户已将参考物拍成照片存放在相册中的场景，体验与 MVP 保持一致。

2. **验证结果多态展示**：
   - **验证中（Matching）**：卡片边缘微光脉冲，文字提示“正在进行 RANSAC 单应性几何校验...”。
   - **验证失败（Failed）**：温和的黄色/琥珀色卡片提示，给出明确指导性文案（如：“光线较暗或视角偏差过大，请保持正面并包含画面完整主体”），避免用户产生挫败感；**绝不泄露匹配分值或密钥元数据**。
   - **验证通过（Success）**：金色/翡翠绿边框展开，触发动效与轻快音效，呈现解锁后的解密卡片。

---

## 5. 前端核心模块组件设计与代码接口规范

### 5.1 组件清单与目录组织

```text
src/
├── components/
│   ├── poster/
│   │   ├── poster-generator.tsx       # 海报合成容器与画布管理
│   │   ├── qr-overlay-draggable.tsx   # 拖拽式二维码浮层组件
│   │   └── poster-export-dialog.tsx   # 导出预览与下载弹窗
│   ├── scanner/
│   │   ├── qr-scanner-view.tsx        # 原生/ZXing 摄像头扫码组件
│   │   └── camera-source-select.tsx   # 摄像头多设备切换器
│   ├── viewer/
│   │   ├── secret-viewer.tsx          # 密语解锁内容展示器 (当前文本渲染，预留富文本协议)
│   │   └── keypoints-canvas.tsx       # 实时 ORB 散点微光渲染画布
│   ├── image-picker.tsx               # 增强版图片/相机选择器
│   └── processing-state.tsx           # 状态加载组件
├── hooks/
│   ├── use-camera-stream.ts           # 现代化摄像头流与权限管理
│   ├── use-barcode-scanner.ts         # 原生 BarcodeDetector + ZXing 扫码 Hook
│   └── use-live-orb-matcher.ts        # 实时抽帧、Worker 提取与单飞比对 Hook
└── routes/
    ├── create.tsx                     # 创建页 (集成海报生成)
    ├── read.tsx                       # 手动口令/扫码导航页
    └── r.$token.tsx                   # 扫码直达验证页
```

### 5.2 核心 Hook 与组件接口规范

#### 1. `useCameraStream`
管理摄像头 MediaStream 实例、设备枚举与前后置切换：
```ts
export interface UseCameraStreamOptions {
  idealFacingMode?: 'user' | 'environment';
  aspectRatio?: number; // 默认 4/3 或 16/9
}

export function useCameraStream(options?: UseCameraStreamOptions): {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  devices: MediaDeviceInfo[];
  activeDeviceId: string | undefined;
  setActiveDeviceId: (deviceId: string) => void;
  isStreaming: boolean;
  startStream: () => Promise<void>;
  stopStream: () => void;
  error: string | null;
};
```

#### 2. `useBarcodeScanner`
自动探测支持的二维码扫描器（优先浏览器原生 `BarcodeDetector`，若不支持降级至 `@zxing/browser`）：
```ts
export function useBarcodeScanner(options: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  onDetected: (tokenOrUrl: string) => void;
}): {
  isScanning: boolean;
  scannerEngine: 'native' | 'zxing' | 'unsupported';
};
```

#### 3. `useLiveOrbMatcher`
实时视频抽帧调度器，内部自动调用 `visionWorkerClient`，保障主线程不卡顿并实施并发单飞保护：
```ts
export function useLiveOrbMatcher(options: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  active: boolean;
  intervalMs?: number; // 默认 800ms
  onKeypointsExtracted?: (keypoints: Array<{ x: number; y: number }>, width: number, height: number) => void;
  onFeatureReady: (payload: FeaturePayloadV1) => Promise<boolean>; // 返回 true 表示比对命中，停止后续抽帧
}): {
  isProcessingFrame: boolean;
  lastExtractedCount: number;
};
```

#### 4. 密语展示器与内容协议 (`SecretViewer`)

为避免现阶段引入庞大的 Tiptap/ProseMirror 依赖，`SecretViewer` 采用结构化协议定义，**当前版本仅对纯文本进行安全换行排版与一键复制**，但数据结构向下兼容未来富文本渲染器：

```ts
// 预留的密语内容数据结构接口
export interface SecretPayload {
  format?: 'plain' | 'markdown' | 'tiptap_json'; // 默认 'plain'
  content: string;
}

export interface SecretViewerProps {
  secret: string | SecretPayload;
  onCopy?: () => void;
}
```

---

## 6. 异常场景处理与用户体验保障原则

1. **摄像头权限受阻/拒绝**：
   - 界面平滑切换为“从系统相册选取”模式，并附带醒目的提示告知用户“可在浏览器地址栏设置中开启相机权限以体验实时对准识别”。
2. **移动端浏览器 Worker/WASM 资源加载慢**：
   - 客户端在根组件渲染时即调用 `visionWorkerClient.preWarm()` 静默预热。
   - 界面提供进度百分比与阶段说明（“正在装载轻量视觉算力引擎...”）。
3. **低质或无纹理参考图防护**：
   - 创建凭证时，Worker 严格校验关键点数。若提取出的点数 `< 20`，立即弹窗引导：“当前画面纹理较为单一（如纯白墙面或天空），建议更换为具有清晰轮廓、建筑或文字图案的图片”。
4. **弱网与请求防重（Debounce / Flight Lock）**：
   - 实时比对过程中，上一帧 Server Function 网络请求未返回前，挂起下一帧的发送，严禁并发请求重叠形成雪崩。

---

## 7. 实施路线与验收清单

| 任务模块 | 实施子项 | 验收标准 |
|---|---|---|
| **海报生成器 (`PosterGenerator`)** | 1. 视口 Canvas 响应式渲染参考图<br>2. 拖拽式 QR 码浮层与边界检测<br>3. 预设四角吸附按钮<br>4. 生成带 Mask 的 `qrOverlayMeta`<br>5. 离线全尺寸合成导出 PNG | • 在桌面端和手机触屏上拖拽 QR 浮层丝滑无抖动<br>• 导出的海报清晰，QR 码可被正常相机识别<br>• 正确提交 `qrOverlayMeta` 至 Server Function |
| **扫码与口令页 (`/read`)** | 1. `BarcodeDetector` / ZXing 扫码视图<br>2. 激光扫描动效与相机切换<br>3. 10~12 位短 Passcode 格式化输入<br>4. 自动路由重定向至 `/r/$token` | • 摄像头对准有效二维码可在 500ms 内自动识别并跳转<br>• 手动输入格式化口令可成功检索凭证 |
| **实时验证流 (`/r/$token`)** | 1. 实时摄像头对准与 800ms 节流抽帧<br>2. Worker 特征点轻量星空动效（Canvas 叠加层）<br>3. 命中时的音效与翡翠绿解密卡片<br>4. 失败时的温和指导性提示 | • 实时对准参考物可在 1~2 秒内自动识别解锁<br>• 全程主线程无掉帧，无 WASM 内存泄漏 |
| **密语内容展示器 (`SecretViewer`)** | 1. 结构化安全渲染与文本排版<br>2. 预留 `format?: 'plain' \| 'markdown'` 扩展接口<br>3. 一键复制密语与新建凭证链接 | • 正确渲染多行换行与空白字符<br>• 一键复制密语正常工作<br>• 不引入额外富文本重依赖，保持轻量体积 |

---

## 8. 总结

本 UE 设计规范在充分吸纳上一代验证模型（`references/secret-word-front`）的**实时视觉反馈、多摄调度与感官互动**优势的基础上，彻底根治了其**主线程阻塞、网络风暴、弱安全模型及无海报生态**的架构硬伤；同时做出了明确的技术裁剪决策——**当前版本密语聚焦于纯文本轻量高效呈现，仅预留富文本协议接口，不引入庞大富文本库**。

通过结合 `重构实施方案_v5.1.md` 的 Web Worker 异步流水线、单参考图极简架构、拖拽式海报生成及多模态读取策略，为 VisionPass 提供了一套专业、高颜值、流畅且工业级稳健的商用产品级交互体系。
