import { Camera } from 'lucide-react'

export interface CameraSourceSelectProps {
	devices: MediaDeviceInfo[]
	activeDeviceId: string | undefined
	onSelectDevice: (deviceId: string) => void
	disabled?: boolean
}

export function CameraSourceSelect({
	devices,
	activeDeviceId,
	onSelectDevice,
	disabled = false,
}: CameraSourceSelectProps) {
	if (devices.length <= 1) return null

	return (
		<div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs text-slate-300">
			<Camera className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
			<select
				value={activeDeviceId}
				onChange={(e) => onSelectDevice(e.target.value)}
				disabled={disabled}
				className="bg-transparent border-none text-slate-200 text-xs focus:outline-none cursor-pointer pr-1"
			>
				{devices.map((device, idx) => (
					<option
						key={device.deviceId}
						value={device.deviceId}
						className="bg-slate-900 text-slate-200"
					>
						{device.label || `摄像头 ${idx + 1}`}
					</option>
				))}
			</select>
		</div>
	)
}
