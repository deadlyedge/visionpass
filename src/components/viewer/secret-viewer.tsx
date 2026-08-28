import { Check, Copy, Sparkles, Unlock } from 'lucide-react'
import { useState } from 'react'

export interface SecretPayload {
	format?: 'plain' | 'markdown' | 'tiptap_json'
	content: string
}

export interface SecretViewerProps {
	secret: string | SecretPayload
	onCopy?: () => void
}

export function SecretViewer({ secret, onCopy }: SecretViewerProps) {
	const [copied, setCopied] = useState(false)

	const plainText = typeof secret === 'string' ? secret : secret.content

	const handleCopy = async () => {
		if (!plainText) return
		try {
			await navigator.clipboard.writeText(plainText)
			setCopied(true)
			onCopy?.()
			setTimeout(() => setCopied(false), 2000)
		} catch (err) {
			console.warn('复制失败:', err)
		}
	}

	return (
		<div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
			{/* 背景装饰微光 */}
			<div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
						<Unlock className="w-6 h-6" />
					</div>
					<div>
						<h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
							<span>验证通过！密语已解锁</span>
							<Sparkles className="w-4 h-4 text-emerald-300" />
						</h3>
						<p className="text-xs text-slate-400">
							RANSAC 几何一致性与特征匹配达标
						</p>
					</div>
				</div>

				<button
					type="button"
					onClick={handleCopy}
					className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95"
				>
					{copied ? (
						<>
							<Check className="w-3.5 h-3.5 text-emerald-400" />
							<span className="text-emerald-400">已复制</span>
						</>
					) : (
						<>
							<Copy className="w-3.5 h-3.5 text-slate-400" />
							<span>复制密语</span>
						</>
					)}
				</button>
			</div>

			{/* 密语文本容器 (纯文本多行渲染，预留富文本结构) */}
			<div className="p-5 bg-slate-950 border border-slate-800/80 rounded-xl">
				<div className="text-xs text-slate-500 mb-2 font-mono">
					DECRYPTED_MESSAGE:
				</div>
				<p className="text-base text-slate-100 whitespace-pre-wrap leading-relaxed font-normal select-all">
					{plainText}
				</p>
			</div>

			{/* 底部导航 */}
			<div className="pt-2 flex items-center justify-between text-xs text-slate-500">
				<span>视觉安全密语 · 阅后即走</span>
				<a
					href="/create"
					className="text-indigo-400 hover:text-indigo-300 font-medium transition flex items-center gap-1"
				>
					创建自己的视觉凭证 →
				</a>
			</div>
		</div>
	)
}
