import { Download, Sparkles, X } from 'lucide-react'

export interface PosterExportDialogProps {
	isOpen: boolean
	onClose: () => void
	posterDataUrl: string | null
}

export function PosterExportDialog({
	isOpen,
	onClose,
	posterDataUrl,
}: PosterExportDialogProps) {
	if (!isOpen || !posterDataUrl) return null

	const handleDownload = () => {
		const a = document.createElement('a')
		a.href = posterDataUrl
		a.download = `VisionPass-Poster-${Date.now()}.png`
		a.click()
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
			<div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
				{/* 关闭按钮 */}
				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
				>
					<X className="w-5 h-5" />
				</button>

				<div className="space-y-1">
					<h3 className="text-lg font-bold text-white flex items-center gap-2">
						<Sparkles className="w-5 h-5 text-indigo-400" />
						<span>视觉密语分享海报已生成</span>
					</h3>
					<p className="text-xs text-slate-400">
						长按或点击下载保存海报，分享给好友即可扫码解锁密语。
					</p>
				</div>

				{/* 预览图 */}
				<div className="max-h-[60vh] overflow-hidden rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center p-2">
					<img
						src={posterDataUrl}
						alt="Exported Poster"
						className="max-h-[56vh] w-auto object-contain rounded-lg shadow-md"
					/>
				</div>

				{/* 操作按钮 */}
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
					>
						返回编辑
					</button>
					<button
						type="button"
						onClick={handleDownload}
						className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
					>
						<Download className="w-4 h-4" />
						保存海报至本地
					</button>
				</div>
			</div>
		</div>
	)
}
