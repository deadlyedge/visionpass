import { Move } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

export interface QrOverlayMeta {
	x: number // 归一化 0~1 (左上角相对于容器宽度的 x 比例)
	y: number // 归一化 0~1 (左上角相对于容器高度的 y 比例)
	sizeRatio: number // 归一化正方形边长相对于容器宽度的比例
}

export interface QrOverlayDraggableProps {
	containerWidth: number
	containerHeight: number
	qrDataUrl: string
	overlayMeta: QrOverlayMeta
	onChange: (newMeta: QrOverlayMeta) => void
	disabled?: boolean
}

export function QrOverlayDraggable({
	containerWidth,
	containerHeight,
	qrDataUrl,
	overlayMeta,
	onChange,
	disabled = false,
}: QrOverlayDraggableProps) {
	const overlayRef = useRef<HTMLDivElement | null>(null)
	const [isDragging, setIsDragging] = useState(false)
	const dragStartRef = useRef<{
		startX: number
		startY: number
		initialX: number
		initialY: number
	}>({
		startX: 0,
		startY: 0,
		initialX: 0,
		initialY: 0,
	})

	// 强制正方形：边长基于 containerWidth * sizeRatio
	const pixelSize = containerWidth * overlayMeta.sizeRatio
	const pixelLeft = containerWidth * overlayMeta.x
	const pixelTop = containerHeight * overlayMeta.y

	const handlePointerDown = (e: React.PointerEvent) => {
		if (disabled) return
		e.preventDefault()
		e.stopPropagation()

		setIsDragging(true)
		dragStartRef.current = {
			startX: e.clientX,
			startY: e.clientY,
			initialX: overlayMeta.x,
			initialY: overlayMeta.y,
		}
		;(e.target as HTMLElement).setPointerCapture(e.pointerId)
	}

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!isDragging || disabled) return
			e.preventDefault()

			const deltaX = e.clientX - dragStartRef.current.startX
			const deltaY = e.clientY - dragStartRef.current.startY

			const deltaNormX = deltaX / containerWidth
			const deltaNormY = deltaY / containerHeight

			let newX = dragStartRef.current.initialX + deltaNormX
			let newY = dragStartRef.current.initialY + deltaNormY

			// 边界限制 (保证正方形整体在容器矩形范围内)
			const maxPixelX = Math.max(0, containerWidth - pixelSize)
			const maxPixelY = Math.max(0, containerHeight - pixelSize)
			const maxX = containerWidth > 0 ? maxPixelX / containerWidth : 0
			const maxY = containerHeight > 0 ? maxPixelY / containerHeight : 0

			newX = Math.max(0, Math.min(maxX, newX))
			newY = Math.max(0, Math.min(maxY, newY))

			// 吸附逻辑 (四角阈值 4%)
			const snapThreshold = 0.04
			if (newX < snapThreshold) newX = 0.03
			if (newX > maxX - snapThreshold) newX = maxX - 0.03
			if (newY < snapThreshold) newY = 0.03
			if (newY > maxY - snapThreshold) newY = maxY - 0.03

			onChange({
				...overlayMeta,
				x: Number(newX.toFixed(3)),
				y: Number(newY.toFixed(3)),
			})
		},
		[
			isDragging,
			disabled,
			containerWidth,
			containerHeight,
			pixelSize,
			overlayMeta,
			onChange,
		],
	)

	const handlePointerUp = (e: React.PointerEvent) => {
		if (isDragging) {
			setIsDragging(false)
			try {
				;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
			} catch (_err) {}
		}
	}

	return (
		<div
			ref={overlayRef}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerUp}
			style={{
				width: `${pixelSize}px`,
				height: `${pixelSize}px`,
				transform: `translate3d(${pixelLeft}px, ${pixelTop}px, 0)`,
			}}
			className={`absolute top-0 left-0 touch-none select-none cursor-move transition-shadow p-[3px] bg-white rounded-sm ${
				isDragging
					? 'ring-2 ring-indigo-500 shadow-indigo-500/30 scale-105 z-30'
					: 'shadow-md z-20'
			}`}
		>
			<img
				src={qrDataUrl}
				alt="QR Code"
				className="w-full h-full object-contain pointer-events-none block"
			/>
			{/* 拖拽指示悬浮标 */}
			<div className="absolute -top-2 -right-2 bg-indigo-600 text-white p-1 rounded-full shadow pointer-events-none">
				<Move className="w-2.5 h-2.5" />
			</div>
		</div>
	)
}
