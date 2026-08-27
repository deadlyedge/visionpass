import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Lock, Unlock, AlertCircle, KeyRound, ShieldAlert } from "lucide-react";
import { ImagePicker } from "../components/image-picker";
import { ProcessingState } from "../components/processing-state";
import { extractOrbFeatures } from "../lib/extract-orb";
import { getCredentialMeta, verifyCredential } from "../lib/api";

interface ReadPageProps {
  token: string;
}

export function ReadPage({ token }: ReadPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string>("");
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: meta, isLoading: isCheckingMeta, error: metaError } = useQuery({
    queryKey: ["credentialMeta", token],
    queryFn: () => getCredentialMeta(token),
    retry: false,
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("请先选择验证图片");
      setErrorMessage(null);
      setVerificationFailed(false);
      setRevealedSecret(null);

      const { payload, previewUrl: scaledPreview } = await extractOrbFeatures(
        file,
        (msg) => setProgressMsg(msg)
      );
      setPreviewUrl(scaledPreview);

      setProgressMsg("正在与服务端参考特征进行匹配比对...");
      return await verifyCredential({ token, feature: payload });
    },
    onSuccess: (result) => {
      setProgressMsg("");
      if (result.matched) {
        setRevealedSecret(result.secret);
      } else {
        setVerificationFailed(true);
      }
    },
    onError: (err: any) => {
      setProgressMsg("");
      setErrorMessage(err.message || "验证过程发生错误，请重试");
    },
  });

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setErrorMessage(null);
    setVerificationFailed(false);
  };

  if (isCheckingMeta) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <ProcessingState message="正在验证凭证有效性..." />
      </div>
    );
  }

  if (metaError || !meta?.exists) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full w-14 h-14 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">凭证不存在或链接无效</h2>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            未找到与该 Token 关联的视觉凭证记录，可能该链接已失效或格式有误。
          </p>
          <div className="pt-2">
            <a href="/create" className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-700">
              创建新的视觉凭证
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-medium text-emerald-400 mb-2">
          <Lock className="w-3.5 h-3.5" />
          <span>视觉密语验证已就绪</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">验证并解锁密语</h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          请上传与创建者参考画面一致的图片，比对通过后将揭示密语。
        </p>
      </div>

      {revealedSecret ? (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400">
              <Unlock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-400">验证通过！密语已解锁</h3>
              <p className="text-xs text-slate-400">图像视觉特征匹配成功</p>
            </div>
          </div>
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-500 mb-1 font-medium">解密内容：</div>
            <p className="text-base font-medium text-slate-100 whitespace-pre-wrap select-all">{revealedSecret}</p>
          </div>
          <div className="pt-2 flex justify-end">
            <a href="/create" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition">
              前往创建自己的视觉凭证 →
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); verifyMutation.mutate(); }} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-sm">
          <ImagePicker
            label="上传验证图片"
            previewUrl={previewUrl}
            onFileSelect={handleFileSelect}
            disabled={verifyMutation.isPending}
          />
          {verificationFailed && (
            <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-300 text-sm space-y-1">
              <div className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                验证未通过
              </div>
              <p className="text-xs text-amber-400/80">
                图片未能通过验证，请使用与参考视觉主体一致的图片重试。
              </p>
            </div>
          )}
          {errorMessage && (
            <div className="flex items-start gap-3 p-4 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
          {verifyMutation.isPending && <ProcessingState message={progressMsg || "正在验证..."} />}
          <button
            type="submit"
            disabled={!file || verifyMutation.isPending}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-sm"
          >
            <KeyRound className="w-4 h-4" />
            验证并读取密语
          </button>
        </form>
      )}
    </div>
  );
}
