import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
	BookOpen,
	Code2,
	Cpu,
	ExternalLink,
	Layers,
	Lock,
	Shield,
	Sparkles,
	Zap,
} from 'lucide-react'
import { z } from 'zod'

const docsSearchSchema = z.object({
	section: z
		.enum(['vision', 'algorithm', 'tech-stack', 'architecture'])
		.optional()
		.default('vision'),
})

export const Route = createFileRoute('/docs')({
	validateSearch: (search) => docsSearchSchema.parse(search),
	component: DocsPage,
})

const GITHUB_REPO_URL = 'https://github.com/chen-fe/visionpass'

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			fill="currentColor"
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
			/>
		</svg>
	)
}

export function DocsPage() {
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })
	const currentSection = search.section || 'vision'

	const setSection = (
		section: 'vision' | 'algorithm' | 'tech-stack' | 'architecture',
	) => {
		navigate({
			search: (prev) => ({
				...prev,
				section,
			}),
		})
	}

	return (
		<div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
			{/* Docs Header */}
			<div className="border-b border-slate-800/80 pb-8 mb-8">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="space-y-2">
						<div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-medium text-indigo-400">
							<BookOpen className="w-3.5 h-3.5" />
							<span>VisionPass 开发者与技术白皮书 (v6.0)</span>
						</div>
						<h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
							从物理愿景到数学算法与全栈实现
						</h1>
						<p className="text-slate-400 text-sm max-w-2xl">
							深入了解 VisionPass 如何通过端侧视觉特征提取、RANSAC
							几何一致性校验与现代全栈架构，打造隐私优先的物理密语系统。
						</p>
					</div>

					<a
						href={GITHUB_REPO_URL}
						target="_blank"
						rel="noreferrer"
						className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-xl text-xs font-medium text-slate-200 hover:text-white transition shadow-sm"
					>
						<GithubIcon className="w-4 h-4" />
						<span>View on GitHub</span>
						<ExternalLink className="w-3 h-3 text-slate-400" />
					</a>
				</div>
			</div>

			{/* Main Layout: Sidebar & Content */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Sidebar Navigation */}
				<div className="lg:col-span-3 sticky top-20 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3 space-y-1 z-10">
					<div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
						文档章节导航
					</div>

					<button
						type="button"
						onClick={() => setSection('vision')}
						className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition text-left ${
							currentSection === 'vision'
								? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
								: 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
						}`}
					>
						<Shield className="w-4 h-4 text-indigo-400 shrink-0" />
						<span>1. 愿景与安全哲学</span>
					</button>

					<button
						type="button"
						onClick={() => setSection('algorithm')}
						className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition text-left ${
							currentSection === 'algorithm'
								? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
								: 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
						}`}
					>
						<Zap className="w-4 h-4 text-amber-400 shrink-0" />
						<span>2. 核心算法与数学原理</span>
					</button>

					<button
						type="button"
						onClick={() => setSection('tech-stack')}
						className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition text-left ${
							currentSection === 'tech-stack'
								? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
								: 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
						}`}
					>
						<Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
						<span>3. 全栈技术选型</span>
					</button>

					<button
						type="button"
						onClick={() => setSection('architecture')}
						className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition text-left ${
							currentSection === 'architecture'
								? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
								: 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
						}`}
					>
						<Layers className="w-4 h-4 text-emerald-400 shrink-0" />
						<span>4. 代码架构与时序图</span>
					</button>
				</div>

				{/* Content Body */}
				<div className="lg:col-span-9 space-y-10">
					{/* SECTION 1: VISION */}
					{currentSection === 'vision' && (
						<article className="space-y-8 animate-in fade-in duration-300">
							<div className="space-y-3">
								<div className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-mono">
									<span>CHAPTER 01</span>
									<span>/</span>
									<span>PHILOSOPHY</span>
								</div>
								<h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
									愿景与安全哲学：为什么现实万物能成为密钥？
								</h2>
							</div>

							<div className="prose prose-invert max-w-none text-slate-300 text-sm sm:text-base leading-relaxed space-y-6">
								<p>
									在数字化浪潮中，我们习惯了使用字符密码、短信验证码和二维码。然而：
								</p>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
									<div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
										<div className="text-red-400 font-semibold flex items-center gap-2 text-sm">
											<span>⚠️ 传统 2FA / 二维码的困境</span>
										</div>
										<p className="text-xs text-slate-400 leading-relaxed">
											二维码本质上只是由黑白方块编码的 URL
											或文本，极易被翻拍、截屏并无损转发给地球另一端的任何人，丧失了“物理共场”的约束力。
										</p>
									</div>

									<div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
										<div className="text-emerald-400 font-semibold flex items-center gap-2 text-sm">
											<span>✨ 物理实体的不可复制性</span>
										</div>
										<p className="text-xs text-slate-400 leading-relaxed">
											桌上的一本书、墙上的油画、街角的铜雕，具有独一无二的纹理、微观特征和光影几何关系。只有亲临现场的人才能捕获这些光学特征。
										</p>
									</div>
								</div>

								<h3 className="text-lg font-bold text-white mt-8 mb-4">
									🛡️ 核心安全准则：零原图上云 (Privacy-First)
								</h3>
								<p>
									绝大部分图像识别系统要求将用户的私密照片直接上传至云端服务器进行推理。这带来了巨大的隐私泄露风险和合规隐患。
								</p>
								<p>
									VisionPass 确立了不可动摇的**第一铁律**：
									<strong className="text-indigo-400 font-medium ml-1">
										原始相片仅在用户设备端停留，图像解码、缩放、灰度化与特征描述子提取全部在浏览器沙箱内完成。
									</strong>
									发送到服务端的仅仅是离散数学点坐标与 256 位 BRIEF
									二进制向量，无法由这些离散点反向还原出原始图像画面。
								</p>

								<div className="p-5 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl space-y-3 mt-6">
									<h4 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
										<Lock className="w-4 h-4" />
										威胁模型与防御矩阵 (Threat Model)
									</h4>
									<ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
										<li>
											<strong>抗数据库拖库 (DB Breach)</strong>
											：凭证索引采用加盐 HMAC 哈希，密语采用 AES-256-GCM
											主密钥加密存储，即使数据库泄漏也无法直接查得明文。
										</li>
										<li>
											<strong>抗中间人篡改 (MITM)</strong>：全程 HTTPS 与端到端
											Server Function 类型系统闭环。
										</li>
										<li>
											<strong>抗单纯纹理欺骗 (Texture Spoofing)</strong>
											：引入单应性矩阵（Homography）几何内点校验，拦截杂乱背景及无关物体的特征点撞库。
										</li>
									</ul>
								</div>
							</div>
						</article>
					)}

					{/* SECTION 2: ALGORITHM */}
					{currentSection === 'algorithm' && (
						<article className="space-y-8 animate-in fade-in duration-300">
							<div className="space-y-3">
								<div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-mono">
									<span>CHAPTER 02</span>
									<span>/</span>
									<span>MATHEMATICAL ALGORITHMS</span>
								</div>
								<h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
									核心算法：从 ORB 特征描述子到 RANSAC 几何内点
								</h2>
							</div>

							<div className="prose prose-invert max-w-none text-slate-300 text-sm sm:text-base leading-relaxed space-y-6">
								<p>
									计算机视觉识别物理物体的核心在于寻找对**尺度变化（Scale）、旋转（Rotation）和光照强度（Illumination）**具备强鲁棒性的局部不变性特征（Local
									Invariant Features）。
								</p>

								{/* Step 1: ORB */}
								<div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
									<div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
										<Sparkles className="w-4 h-4" />
										<span>1. ORB (Oriented FAST & Rotated BRIEF) 特征提取</span>
									</div>
									<p className="text-xs text-slate-300 leading-relaxed">
										ORB 是由 Ethan Rublee 等人在 2011
										年提出的超快速二进制特征描述算法，计算效率是传统 SIFT/SURF
										的数十倍，非常适合在 Web 浏览器端实时计算：
									</p>
									<ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
										<li>
											<strong>oFAST 角点检测</strong>
											：在圆形邻域内比对像素亮度，快速筛选候选特征点，并通过灰度质心法（Intensity
											Centroid）计算主方向角度 theta。
										</li>
										<li>
											<strong>rBRIEF 描述子生成</strong>：根据方向角 theta
											旋转特征点采样点对，生成 256 位（32
											字节）紧凑二进制串。两个描述子之间的相似度可通过极速的
											**Hamming 距离（位异或 + 位计数）** 评估。
										</li>
									</ul>
								</div>

								{/* Step 2: Lowe's Ratio */}
								<div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
									<div className="flex items-center gap-2 text-amber-400 font-bold text-base">
										<Zap className="w-4 h-4" />
										<span>2. Lowe's Ratio Test (KNN 歧义匹配过滤)</span>
									</div>
									<p className="text-xs text-slate-300 leading-relaxed">
										对于验证图中的每个特征描述子
										dq，在参考图特征集合中寻找最近邻描述子 d1（Hamming 距离
										distance(dq, d1)）和次近邻描述子 d2（Hamming 距离
										distance(dq, d2)）。
									</p>
									<div className="p-3 bg-slate-950 font-mono text-xs rounded-xl border border-slate-800 text-amber-300">
										Condition: distance(dq, d1) &lt; 0.75 * distance(dq, d2)
									</div>
									<p className="text-xs text-slate-400">
										如果最近邻与次近邻距离过于接近，说明该特征在画面中存在重复纹理（如格子地砖），必须予以舍弃，仅保留唯一性明确的高质量匹配点对。
									</p>
								</div>

								{/* Step 3: RANSAC Homography */}
								<div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
									<div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
										<Shield className="w-4 h-4" />
										<span>
											3. 2D 单应性矩阵 (Homography) 与 RANSAC 几何一致性检验
										</span>
									</div>
									<p className="text-xs text-slate-300 leading-relaxed">
										即使通过了 Lowe's 比值测试，杂乱背景也可能碰巧产生若干低
										Hamming 距离的假阳性匹配。VisionPass
										引入了空间平面投影几何约束：
									</p>
									<p className="text-xs text-slate-400">
										三维物理世界中同一个平面物体在不同视角下的成像满足 3x3
										单应性矩阵关系 H：
									</p>
									<div className="p-3 bg-slate-950 font-mono text-xs rounded-xl border border-slate-800 text-emerald-300">
										s * [x', y', 1]^T = H * [x, y, 1]^T
									</div>
									<p className="text-xs text-slate-400">
										<strong>RANSAC (Random Sample Consensus) 迭代流程</strong>：
										<br />
										1. 随机选取 4 对不共线的匹配点；
										<br />
										2. 使用 DLT (Direct Linear Transformation)
										与高斯消元法求解矩阵 H；
										<br />
										3.
										将所有参考点投影至验证坐标系，计算几何欧氏重投影误差投影偏差；
										<br />
										4. 统计内点（Inliers）数量，当内点数达到预设阈值（Inliers
										&gt;= 12）且行列式正常时，判定物理画面完全一致，放行密语！
									</p>
								</div>
							</div>
						</article>
					)}

					{/* SECTION 3: TECH STACK */}
					{currentSection === 'tech-stack' && (
						<article className="space-y-8 animate-in fade-in duration-300">
							<div className="space-y-3">
								<div className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-mono">
									<span>CHAPTER 03</span>
									<span>/</span>
									<span>ENGINEERING STACK</span>
								</div>
								<h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
									全栈技术选型：现代 Web 时代的轻量与高性能
								</h2>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3">
									<div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
										<Code2 className="w-4 h-4" />
										<span>TanStack Start (React 19 + Nitro)</span>
									</div>
									<p className="text-xs text-slate-400 leading-relaxed">
										告别传统的独立 API Gateway 与手动 fetch。利用 TanStack Start
										的 <code>createServerFn</code> 实现完全类型安全的前后端 RPC
										通信，自动完成 Tree-shaking 与服务端打包。
									</p>
								</div>

								<div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3">
									<div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
										<Zap className="w-4 h-4" />
										<span>Web Worker + OpenCV.js WASM</span>
									</div>
									<p className="text-xs text-slate-400 leading-relaxed">
										将重量级 WASM 运行时与图像缩放、灰度化及 ORB
										描述子提取移至独立 Worker 线程，主线程保持 60 FPS
										顺滑响应，杜绝任何 UI 掉帧卡顿。
									</p>
								</div>

								<div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3">
									<div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
										<Cpu className="w-4 h-4" />
										<span>纯 TypeScript 工业级几何匹配器</span>
									</div>
									<p className="text-xs text-slate-400 leading-relaxed">
										服务端完全不依赖 Python 脚本或 Node C++
										动态链接库（node-gyp）。使用 TS 纯位运算（Brian Kernighan
										算法）+ 高斯消元实现 RANSAC，单次比对耗时不超过
										5ms，天然适配 Serverless 与 Edge。
									</p>
								</div>

								<div className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3">
									<div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
										<Lock className="w-4 h-4" />
										<span>Drizzle ORM + PostgreSQL + Crypto</span>
									</div>
									<p className="text-xs text-slate-400 leading-relaxed">
										轻量化 ORM 配合原生 Node.js Crypto
										模块（AES-256-GCM、HMAC-SHA-256），实现生产级加密落盘、滑动窗口限流与详尽的验证尝试审计日志。
									</p>
								</div>
							</div>
						</article>
					)}

					{/* SECTION 4: ARCHITECTURE */}
					{currentSection === 'architecture' && (
						<article className="space-y-8 animate-in fade-in duration-300">
							<div className="space-y-3">
								<div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
									<span>CHAPTER 04</span>
									<span>/</span>
									<span>CODE ARCHITECTURE</span>
								</div>
								<h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
									代码架构与数据流时序全景
								</h2>
							</div>

							{/* Directory Map */}
							<div className="space-y-3">
								<h3 className="text-sm font-bold text-white">
									📁 模块职责拓扑
								</h3>
								<pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-300 font-mono overflow-x-auto leading-relaxed">
									{`visionpass/
├── src/
│   ├── routes/              # TanStack Router (/, /playground, /docs, /r/$token)
│   ├── components/          # 交互层 (Playground, ImagePicker, QrResult, Viewer)
│   ├── workers/             # OpenCV.js WASM 图像特征提取 Worker 线程
│   ├── hooks/               # 摄像头流管理、扫码引擎与实时 ORB 抽帧 Hook
│   ├── server/              # Nitro 服务端独占体系
│   │   ├── crypto/          # CSPRNG Token、HMAC-SHA-256 与 AES-256-GCM
│   │   ├── matcher/         # 纯 TS Hamming KNN 与 RANSAC 单应性几何匹配引擎
│   │   ├── db/              # PostgreSQL Drizzle Schema (credentials, audit logs)
│   │   └── functions/       # createServerFn 核心端点 (create, verify, meta)
│   └── lib/                 # 前后端共享编解码、常量与 Zod 协议定义`}
								</pre>
							</div>

							{/* Sequence Explanation */}
							<div className="space-y-4 pt-4 border-t border-slate-800">
								<h3 className="text-sm font-bold text-white">
									🔄 业务闭环时序链路
								</h3>
								<div className="space-y-3 text-xs text-slate-300 leading-relaxed">
									<div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
										<div className="font-semibold text-indigo-300">
											① 凭证创建链路 (Creation Sequence)
										</div>
										<p>
											用户选择本地参考图 → 浏览器 Web Worker 缩放至 640px 提取
											ORB 描述子与坐标 → 打包为 <code>OrbFeaturePayloadV1</code>{' '}
											→ 调用 <code>createCredentialFn</code> → 服务端生成口令并
											AES-256-GCM 加密密语 → 写入 PostgreSQL →
											客户端生成分享海报。
										</p>
									</div>

									<div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
										<div className="font-semibold text-emerald-300">
											② 实时扫码比对链路 (Continuous Verification Sequence)
										</div>
										<p>
											用户调起摄像头 → jsQR/BarcodeDetector 秒级识别口令 →
											保持摄像头连续运行无缝切入实时特征提取 → 800ms 抽帧提交{' '}
											<code>verifyCredentialFn</code> → 服务端取出特征向量执行
											RANSAC 几何一致性检验 → 判定通过后实时解密并返回机密文本。
										</p>
									</div>
								</div>
							</div>
						</article>
					)}
				</div>
			</div>
		</div>
	)
}
