import { useEffect, useRef } from 'react'

export interface KeypointsCanvasProps {
	keypoints: Array<{ x: number; y: number }>
	sourceWidth: number
	sourceHeight: number
	className?: string
}

export function KeypointsCanvas({
	keypoints,
	sourceWidth,
	sourceHeight,
	className = 'absolute inset-0 pointer-events-none w-full h-full',
}: KeypointsCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		// 同步真实渲染尺寸
		canvas.width = sourceWidth || 640
		canvas.height = sourceHeight || 480

		ctx.clearRect(0, 0, canvas.width, canvas.height)

		if (!keypoints || keypoints.length === 0) return

		// 绘制科技感翡翠绿星空点阵
		for (const pt of keypoints) {
			// 外层柔和光晕
			ctx.beginPath()
			ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2)
			ctx.fillStyle = 'rgba(16, 185, 129, 0.35)'
			ctx.fill()

			// 核心明亮点
			ctx.beginPath()
			ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2)
			ctx.fillStyle = '#34d399'
			ctx.fill()
		}
	}, [keypoints, sourceWidth, sourceHeight])

	return <canvas ref={canvasRef} className={className} />
}
