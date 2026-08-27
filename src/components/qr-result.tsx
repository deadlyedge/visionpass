import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, ExternalLink, RefreshCw } from "lucide-react";

interface QrResultProps {
  readUrl: string;
  onReset: () => void;
}

export const QrResult: React.FC<QrResultProps> = ({ readUrl, onReset }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(readUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: "#020617",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("生成二维码失败:", err));
  }, [readUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(readUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("复制失败", e);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center space-y-6 shadow-xl">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-emerald-400">视觉凭证创建成功！</h3>
        <p className="text-sm text-slate-400">
          扫描二维码或通过读取链接打开，上传原图即可读取密语。
        </p>
      </div>

      <div className="p-4 bg-white rounded-xl shadow-inner inline-block">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="Visual Secret QR Code" className="w-56 h-56 rounded" />
        ) : (
          <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-sm">
            正在生成二维码...
          </div>
        )}
      </div>

      <div className="w-full space-y-3">
        <div className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 break-all">
          <span className="flex-1 select-all">{readUrl}</span>
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 transition-colors shrink-0 flex items-center gap-1"
            title="复制链接"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-sans">已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="font-sans">复制</span>
              </>
            )}
          </button>
        </div>

        <div className="flex gap-3">
          <a
            href={readUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
          >
            <ExternalLink className="w-4 h-4" />
            打开读取页
          </a>
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
            创建新凭证
          </button>
        </div>
      </div>
    </div>
  );
};
