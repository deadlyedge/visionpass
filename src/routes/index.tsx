import { createFileRoute, Link } from '@tanstack/react-router'
import {
	ArrowRight,
	BookOpen,
	Camera,
	Code2,
	Cpu,
	Lock,
	Shield,
	Sparkles,
	Zap,
} from 'lucide-react'

export const Route = createFileRoute('/')({
	component: LandingPage,
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

export function LandingPage() {
	return (
		<div className="w-full space-y-20 sm:space-y-28 py-10 sm:py-16">
			{/* HERO SECTION */}
			<section className="relative px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-8">
				{/* Background Glow */}
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />

				{/* Pill Badge */}
				<div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-medium text-indigo-300 backdrop-blur-md shadow-sm">
					<Sparkles className="w-3.5 h-3.5 text-indigo-400" />
					<span>VisionPass v6.0 · 全栈物理密语系统</span>
				</div>

				{/* Main Title */}
				<div className="space-y-4 max-w-4xl mx-auto">
					<h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
						让现实世界的万物
						<br />
						<span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
							成为你的数字密钥
						</span>
					</h1>
					<p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
						无需在物体上张贴任何二维码或标记。基于端侧 Web Worker
						视觉特征提取与服务端 RANSAC
						单应性几何一致性检验，实现真正的零隐私上云交互。
					</p>
				</div>

				{/* Primary Call to Actions */}
				<div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
					<Link
						to="/playground"
						search={{ tab: 'create' }}
						className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 text-sm group"
					>
						<Sparkles className="w-4 h-4 text-indigo-200 group-hover:rotate-12 transition-transform" />
						<span>立即体验演练场 (Playground)</span>
						<ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
					</Link>

					<Link
						to="/docs"
						search={{ section: 'vision' }}
						className="w-full sm:w-auto px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500 text-slate-200 hover:text-white font-medium rounded-2xl transition duration-200 flex items-center justify-center gap-2 text-sm"
					>
						<BookOpen className="w-4 h-4 text-slate-400" />
						<span>探索架构与算法白皮书</span>
					</Link>

					<a
						href={GITHUB_REPO_URL}
						target="_blank"
						rel="noreferrer"
						className="w-full sm:w-auto px-5 py-3.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-medium rounded-2xl transition duration-200 flex items-center justify-center gap-2 text-sm"
					>
						<GithubIcon className="w-4 h-4" />
						<span>GitHub 源码</span>
					</a>
				</div>
			</section>

			{/* WHY VISIONPASS - PAIN POINTS & PILLARS */}
			<section className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
				<div className="text-center space-y-3">
					<div className="text-xs font-mono uppercase tracking-wider text-indigo-400">
						THE PARADIGM SHIFT
					</div>
					<h2 className="text-2xl sm:text-3xl font-extrabold text-white">
						为什么我们需要“视觉密语”？
					</h2>
					<p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
						传统密码容易遗忘，二维码容易被截屏滥发。物理物体的独特空间纹理提供了不可篡改的现场凭据。
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Pillar 1 */}
					<div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4 hover:border-slate-700 transition">
						<div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
							<Shield className="w-5 h-5" />
						</div>
						<h3 className="text-base font-bold text-white">
							零原图上云与隐私隔离
						</h3>
						<p className="text-xs text-slate-400 leading-relaxed">
							绝不将用户相片上传至云端服务器。图片仅在浏览器端独立 Web Worker
							中提取 ORB 数学特征，从根源上杜绝隐私照片泄漏风险。
						</p>
					</div>

					{/* Pillar 2 */}
					<div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4 hover:border-slate-700 transition">
						<div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400">
							<Camera className="w-5 h-5" />
						</div>
						<h3 className="text-base font-bold text-white">
							物体即密钥 (Object as Key)
						</h3>
						<p className="text-xs text-slate-400 leading-relaxed">
							无论是特定角度的纪念相框、一幅手绘插画、还是实体包装盒，物体天然的灰度梯度与微观几何就是解开密语的专属物理锁。
						</p>
					</div>

					{/* Pillar 3 */}
					<div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4 hover:border-slate-700 transition">
						<div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
							<Lock className="w-5 h-5" />
						</div>
						<h3 className="text-base font-bold text-white">
							RANSAC 空间几何内点检验
						</h3>
						<p className="text-xs text-slate-400 leading-relaxed">
							结合 Lowe's 比值过滤与 2D 单应性矩阵（Homography）拟合，纯
							TypeScript 高性能过滤杂乱背景与低劣错配，抗纹理欺骗。
						</p>
					</div>
				</div>
			</section>

			{/* TECHNICAL HIGHLIGHTS */}
			<section className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
				<div className="bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-8">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
						<div className="space-y-1">
							<h3 className="text-xl font-bold text-white">
								硬核全栈工程架构与工业级标准
							</h3>
							<p className="text-xs text-slate-400">
								专为 Serverless 与现代多端设备打造的无状态、零 C++/Python
								依赖技术栈。
							</p>
						</div>
						<Link
							to="/docs"
							search={{ section: 'tech-stack' }}
							className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0 font-medium"
						>
							查看技术选型细节 →
						</Link>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						<div className="space-y-2">
							<div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
								<Code2 className="w-4 h-4" />
								<span>TanStack Start</span>
							</div>
							<p className="text-xs text-slate-400 leading-relaxed">
								React 19 + Nitro + Vite，类型安全的同构{' '}
								<code>createServerFn</code> 通信。
							</p>
						</div>

						<div className="space-y-2">
							<div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
								<Zap className="w-4 h-4" />
								<span>OpenCV.js WASM</span>
							</div>
							<p className="text-xs text-slate-400 leading-relaxed">
								Web Worker 隔离多线程运算，主线程稳定保持 60 FPS 顺畅响应。
							</p>
						</div>

						<div className="space-y-2">
							<div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
								<Cpu className="w-4 h-4" />
								<span>纯 TS 几何引擎</span>
							</div>
							<p className="text-xs text-slate-400 leading-relaxed">
								高斯消元求单应性矩阵与 Hamming 位运算，单次匹配耗时不超过 5ms。
							</p>
						</div>

						<div className="space-y-2">
							<div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
								<Lock className="w-4 h-4" />
								<span>AES-256-GCM AEAD</span>
							</div>
							<p className="text-xs text-slate-400 leading-relaxed">
								HMAC 加盐 Token
								索引，密语强加密落盘，特征比对通过后方才实时解密。
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* USE CASES */}
			<section className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
				<div className="text-center space-y-3">
					<div className="text-xs font-mono uppercase tracking-wider text-indigo-400">
						REAL WORLD USE CASES
					</div>
					<h2 className="text-2xl sm:text-3xl font-extrabold text-white">
						探索无限可能的应用场景
					</h2>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
						<div className="text-2xl">🕵️</div>
						<h4 className="text-sm font-bold text-white">
							线下实景寻宝 / 密室逃脱
						</h4>
						<p className="text-xs text-slate-400 leading-relaxed">
							玩家必须到达特定的现实展品或特定地理实物面前拍照比对，才能解锁通向下一关的机密线索。
						</p>
					</div>

					<div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
						<div className="text-2xl">📦</div>
						<h4 className="text-sm font-bold text-white">高价值实体交接防伪</h4>
						<p className="text-xs text-slate-400 leading-relaxed">
							将重要设备封条或专属印章作为解锁交付密码的钥匙，杜绝未见实物直接冒领或远程代签。
						</p>
					</div>

					<div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
						<div className="text-2xl">💌</div>
						<h4 className="text-sm font-bold text-white">专属浪漫物理信物</h4>
						<p className="text-xs text-slate-400 leading-relaxed">
							将彼此珍视的专属纪念物件（如纪念相框、特定腕表）作为打开私密留言的唯一数字钥匙。
						</p>
					</div>
				</div>
			</section>

			{/* BOTTOM CTA */}
			<section className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
				<div className="p-8 sm:p-12 bg-gradient-to-br from-indigo-950/50 via-slate-900/90 to-violet-950/50 border border-indigo-500/30 rounded-3xl space-y-6 backdrop-blur-md">
					<h2 className="text-2xl sm:text-3xl font-black text-white">
						准备好开启您的视觉密语体验了吗？
					</h2>
					<p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
						无需注册，完全开源。在 Playground
						中体验两张照片之间的数学特征碰撞与安全解密。
					</p>
					<div className="flex flex-wrap items-center justify-center gap-4">
						<Link
							to="/playground"
							search={{ tab: 'create' }}
							className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
						>
							<Sparkles className="w-4 h-4" />
							<span>进入演练场 (Playground)</span>
						</Link>
						<a
							href={GITHUB_REPO_URL}
							target="_blank"
							rel="noreferrer"
							className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium rounded-xl text-sm transition flex items-center gap-2"
						>
							<GithubIcon className="w-4 h-4" />
							<span>参与开源共建</span>
						</a>
					</div>
				</div>
			</section>
		</div>
	)
}
