import { useMutation } from '@tanstack/react-query'
import { AlertCircle, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '../../i18n'
import { extractOrbFeatures } from '../../lib/extract-orb'
import { createCredentialFn } from '../../server/functions/credentials'
import { ImagePicker } from '../image-picker'
import { ProcessingState } from '../processing-state'
import { QrResult } from '../qr-result'

interface CreateSectionProps {
	onSwitchToVerify?: () => void
}

export function CreateSection({ onSwitchToVerify }: CreateSectionProps) {
	const { t } = useI18n()
	const [file, setFile] = useState<File | null>(null)
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)
	const [secret, setSecret] = useState<string>('')
	const [progressMsg, setProgressMsg] = useState<string>('')
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [createdResult, setCreatedResult] = useState<{
		readUrl: string
		displayPasscode?: string
	} | null>(null)

	const mutation = useMutation({
		mutationFn: async () => {
			if (!file) throw new Error('请先选择一张参考图片')
			if (!secret.trim()) throw new Error('请输入待保护的密语内容')

			setErrorMessage(null)

			// Step 1: Web Worker 异步提取 ORB 特征
			const { payload, previewUrl: scaledPreview } = await extractOrbFeatures(
				file,
				(msg) => setProgressMsg(msg),
			)
			setPreviewUrl(scaledPreview)

			// Step 2: 提交特征与密语至 Server Function
			setProgressMsg('正在加密密文并激活凭证...')
			const res = await createCredentialFn({
				data: {
					secret: secret.trim(),
					feature: payload,
				},
			})

			return res
		},
		onSuccess: (data) => {
			setProgressMsg('')
			setCreatedResult({
				readUrl: data.readUrl,
				displayPasscode: data.displayPasscode,
			})
		},
		onError: (err: any) => {
			setProgressMsg('')
			setErrorMessage(err.message || '创建凭证失败，请重试')
		},
	})

	const handleFileSelect = (selectedFile: File) => {
		setFile(selectedFile)
		setPreviewUrl(URL.createObjectURL(selectedFile))
		setErrorMessage(null)
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		mutation.mutate()
	}

	const handleReset = () => {
		setFile(null)
		setPreviewUrl(null)
		setSecret('')
		setCreatedResult(null)
		setErrorMessage(null)
		setProgressMsg('')
	}

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			{createdResult ? (
				<div className="space-y-4">
					<QrResult
						readUrl={createdResult.readUrl}
						displayPasscode={createdResult.displayPasscode}
						referenceImageUrl={previewUrl}
						onReset={handleReset}
					/>
					{onSwitchToVerify && (
						<div className="text-center pt-2">
							<button
								type="button"
								onClick={onSwitchToVerify}
								className="text-xs text-indigo-400 hover:text-indigo-300 underline"
							>
								已生成口令？前往「扫码与比对模式」测试解锁 →
							</button>
						</div>
					)}
				</div>
			) : (
				<form
					onSubmit={handleSubmit}
					className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md"
				>
					{/* Image Picker */}
					<ImagePicker
						label={t('playground.create.step1')}
						previewUrl={previewUrl}
						onFileSelect={handleFileSelect}
						disabled={mutation.isPending}
					/>

					{/* Secret Input */}
					<div className="space-y-2">
						<label
							htmlFor="secret-input"
							className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
						>
							{t('playground.create.step2')}
						</label>
						<textarea
							id="secret-input"
							rows={3}
							value={secret}
							onChange={(e) => setSecret(e.target.value)}
							placeholder={t('playground.create.secretPlaceholder')}
							disabled={mutation.isPending}
							className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
						/>
						<div className="flex items-center justify-between text-[11px] text-slate-500">
							<span>{t('playground.create.secretLabel')}</span>
							<span>{secret.length} 字</span>
						</div>
					</div>

					{/* Error Alert */}
					{errorMessage && (
						<div className="flex items-start gap-3 p-4 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-xs animate-in fade-in">
							<AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
							<span>{errorMessage}</span>
						</div>
					)}

					{/* Processing Indicator */}
					{mutation.isPending && (
						<ProcessingState
							message={progressMsg || t('playground.create.extracting')}
						/>
					)}

					{/* Submit Button */}
					<button
						type="submit"
						disabled={!file || !secret.trim() || mutation.isPending}
						className="w-full py-4 px-4 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium rounded-2xl transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 text-sm"
					>
						<Sparkles className="w-4 h-4" />
						{mutation.isPending
							? t('playground.create.extracting')
							: t('playground.create.extractBtn')}
					</button>

					<div className="p-4 bg-slate-950/50 border border-slate-800/60 rounded-xl space-y-1.5 text-[11px] text-slate-400">
						<p className="font-medium text-slate-300">
							💡 {t('playground.create.tip')}
						</p>
					</div>
				</form>
			)}
		</div>
	)
}
