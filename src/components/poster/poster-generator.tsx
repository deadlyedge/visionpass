import {
	ArrowDownLeft,
	ArrowDownRight,
	ArrowUpLeft,
	ArrowUpRight,
	Layers,
	Share2,
} from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useRef, useState } from 'react'
import { PosterExportDialog } from './poster-export-dialog'
import { QrOverlayDraggable, type QrOverlayMeta } from './qr-overlay-draggable'

export interface PosterGeneratorProps {
	referenceImageUrl: string
	readUrl: string
	displayPasscode?: string
	onClose?: () => void
}

export function PosterGenerator({
	referenceImageUrl,
	readUrl,
	displayPasscode,
}: PosterGeneratorProps) {
	const containerRef = useRef<HTMLDivElement | null>(null)
	const [containerSize, setContainerSize] = useState<{
		width: number
		height: number
	}>({ width: 400, height: 300 })
	const [qrDataUrl, setQrDataUrl] = useState<string>('')
	// 默认边长比例从 0.24 减半至 0.12 (面积缩小至原先的 1/4)
	const [overlayMeta, setOverlayMeta] = useState<QrOverlayMeta>({
		x: 0.84,
		y: 0.84,
		sizeRatio: 0.12,
	})
	const [isExporting, setIsExporting] = useState(false)
	const [exportedPosterUrl, setExportedPosterUrl] = useState<string | null>(
		null,
	)

	// 生成纯口令 (displayPasscode) 的二维码，无冗余库内 margin (margin: 0)
	useEffect(() => {
		const qrContent = displayPasscode || readUrl
		QRCode.toDataURL(qrContent, {
			width: 512,
			margin: 0,
			color: {
				dark: '#0f172a',
				light: '#ffffff',
			},
		})
			.then((url) => setQrDataUrl(url))
			.catch((err) => console.error('生成二维码失败:', err))
	}, [displayPasscode, readUrl])

	// 监听容器自适应宽高
	useEffect(() => {
		const updateSize = () => {
			if (containerRef.current) {
				const { clientWidth, clientHeight } = containerRef.current
				if (clientWidth > 0 && clientHeight > 0) {
					setContainerSize({ width: clientWidth, height: clientHeight })
				}
			}
		}
		updateSize()
		window.addEventListener('resize', updateSize)
		return () => window.removeEventListener('resize', updateSize)
	}, [])

	// 快捷四角对齐 (基于当前容器比例精确换算)
	const snapCorner = (corner: 'TL' | 'TR' | 'BL' | 'BR') => {
		const { width, height } = containerSize
		if (width <= 0 || height <= 0) return

		const sizePx = width * overlayMeta.sizeRatio
		const padX = 0.02
		const padY = (height * 0.02) / height

		const maxX = Math.max(0, (width - sizePx) / width - padX)
		const maxY = Math.max(0, (height - sizePx) / height - padY)

		switch (corner) {
			case 'TL':
				setOverlayMeta({ ...overlayMeta, x: padX, y: padY })
				break
			case 'TR':
				setOverlayMeta({ ...overlayMeta, x: maxX, y: padY })
				break
			case 'BL':
				setOverlayMeta({ ...overlayMeta, x: padX, y: maxY })
				break
			case 'BR':
				setOverlayMeta({ ...overlayMeta, x: maxX, y: maxY })
				break
		}
	}

	// 离线全尺寸合成导出海报 (带 3 像素紧凑精致白色边框)
	const handleExport = async () => {
		setIsExporting(true)
		try {
			const refImg = new Image()
			refImg.crossOrigin = 'anonymous'
			await new Promise((resolve, reject) => {
				refImg.onload = resolve
				refImg.onerror = reject
				refImg.src = referenceImageUrl
			})

			const qrImg = new Image()
			await new Promise((resolve, reject) => {
				qrImg.onload = resolve
				qrImg.onerror = reject
				qrImg.src = qrDataUrl
			})

			const naturalW = refImg.naturalWidth || refImg.width
			const naturalH = refImg.naturalHeight || refImg.height

			const exportCanvas = document.createElement('canvas')
			exportCanvas.width = naturalW
			exportCanvas.height = naturalH
			const ctx = exportCanvas.getContext('2d')
			if (!ctx) throw new Error('无法创建导出画布')

			// 1. 绘制高清底图
			ctx.drawImage(refImg, 0, 0, naturalW, naturalH)

			// 2. 计算严格正方形的 QR Code 像素尺寸 (基于 naturalW * sizeRatio)
			const qrSize = naturalW * overlayMeta.sizeRatio
			const qrX = naturalW * overlayMeta.x
			const qrY = naturalH * overlayMeta.y

			// 按比例缩放并保持 3px 左右的紧凑白边 (最少 3 像素)
			const borderPx = Math.max(3, Math.round(naturalW * 0.003))

			// 绘制白色边框背景
			ctx.fillStyle = '#ffffff'
			ctx.fillRect(
				qrX - borderPx,
				qrY - borderPx,
				qrSize + borderPx * 2,
				qrSize + borderPx * 2,
			)

			// 绘制等比例 QR 码
			ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

			// 3. 底部呈现纯粹口令字符串 (居中紧随 QR 下方)
			if (displayPasscode) {
				ctx.save()
				const fontSize = Math.max(12, Math.round(qrSize * 0.15))
				ctx.font = `bold ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
				ctx.fillStyle = '#0f172a'
				ctx.textAlign = 'center'
				ctx.textBaseline = 'top'
				ctx.fillText(
					displayPasscode,
					qrX + qrSize / 2,
					qrY + qrSize + borderPx + 3,
				)
				ctx.restore()
			}

			const fullDataUrl = exportCanvas.toDataURL('image/png', 0.95)
			setExportedPosterUrl(fullDataUrl)
		} catch (err) {
			console.error('海报导出失败:', err)
		} finally {
			setIsExporting(false)
		}
	}

	return (
		<div className="space-y-6">
			{/* 控制栏 */}
			<div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3">
				<div className="flex items-center gap-2 text-xs text-slate-400">
					<Layers className="w-4 h-4 text-indigo-400" />
					<span>拖拽二维码调整位置，或使用快捷对齐：</span>
				</div>

				<div className="flex items-center gap-1.5">
					<button
						type="button"
						onClick={() => snapCorner('TL')}
						title="左上角"
						className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
					>
						<ArrowUpLeft className="w-3.5 h-3.5" />
					</button>
					<button
						type="button"
						onClick={() => snapCorner('TR')}
						title="右上角"
						className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
					>
						<ArrowUpRight className="w-3.5 h-3.5" />
					</button>
					<button
						type="button"
						onClick={() => snapCorner('BL')}
						title="左下角"
						className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
					>
						<ArrowDownLeft className="w-3.5 h-3.5" />
					</button>
					<button
						type="button"
						onClick={() => snapCorner('BR')}
						title="右下角"
						className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
					>
						<ArrowDownRight className="w-3.5 h-3.5" />
					</button>
				</div>
			</div>

			{/* 可视化海报画布预览容器 */}
			<div
				ref={containerRef}
				className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl select-none"
			>
				<img
					src={referenceImageUrl}
					alt="Poster Reference"
					onLoad={() => {
						if (containerRef.current) {
							setContainerSize({
								width: containerRef.current.clientWidth,
								height: containerRef.current.clientHeight,
							})
						}
					}}
					className="w-full h-auto block object-cover max-h-[65vh] mx-auto pointer-events-none"
				/>

				{qrDataUrl && containerSize.width > 0 && (
					<QrOverlayDraggable
						containerWidth={containerSize.width}
						containerHeight={containerSize.height}
						qrDataUrl={qrDataUrl}
						overlayMeta={overlayMeta}
						onChange={setOverlayMeta}
					/>
				)}
			</div>

			{/* 导出按钮 */}
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={handleExport}
					disabled={isExporting || !qrDataUrl}
					className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-sm"
				>
					{isExporting ? (
						<span>正在渲染高清海报...</span>
					) : (
						<>
							<Share2 className="w-4 h-4" />
							<span>生成并导出带二维码的分享海报</span>
						</>
					)}
				</button>
			</div>

			{/* 导出弹窗 */}
			<PosterExportDialog
				isOpen={!!exportedPosterUrl}
				onClose={() => setExportedPosterUrl(null)}
				posterDataUrl={exportedPosterUrl}
			/>
		</div>
	)
}
