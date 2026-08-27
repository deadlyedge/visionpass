import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Shield, AlertCircle } from "lucide-react";
import { ImagePicker } from "../components/image-picker";
import { ProcessingState } from "../components/processing-state";
import { QrResult } from "../components/qr-result";
import { extractOrbFeatures } from "../lib/extract-orb";
import { createCredential } from "../lib/api";

export function CreatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string>("");
  const [progressMsg, setProgressMsg] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdReadUrl, setCreatedReadUrl] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("请先选择一张图片");
      if (!secret.trim()) throw new Error("请输入密语内容");

      setErrorMessage(null);

      // Step 1: Extract ORB features in browser
      const { payload, previewUrl: scaledPreview } = await extractOrbFeatures(
        file,
        (msg) => setProgressMsg(msg)
      );
      setPreviewUrl(scaledPreview);

      // Step 2: Send secret and feature payload to backend
      setProgressMsg("正在保存凭证并生成二维码...");
      const res = await createCredential({
        secret: secret.trim(),
        feature: payload,
      });

      return res;
    },
    onSuccess: (data) => {
      setProgressMsg("");
      setCreatedReadUrl(data.readUrl);
    },
    onError: (err: any) => {
      setProgressMsg("");
      setErrorMessage(err.message || "创建凭证失败，请重试");
    },
  });

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setSecret("");
    setCreatedReadUrl(null);
    setErrorMessage(null);
    setProgressMsg("");
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-medium text-indigo-400 mb-2">
          <Shield className="w-3.5 h-3.5" />
          <span>视觉密语 · 最小可验证模型 (MVP)</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          创建视觉密语
        </h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          上传一张参考图片并留下密语。后续只有持有相同画面的读取者才能解锁密语。
        </p>
      </div>

      {createdReadUrl ? (
        <QrResult readUrl={createdReadUrl} onReset={handleReset} />
      ) : (
        <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-sm">
          {/* Image Picker */}
          <ImagePicker
            label="1. 上传参考图片"
            previewUrl={previewUrl}
            onFileSelect={handleFileSelect}
            disabled={mutation.isPending}
          />

          {/* Secret Textarea */}
          <div className="space-y-2">
            <label htmlFor="secret-input" className="block text-sm font-medium text-slate-300">
              2. 填写待封存的密语
            </label>
            <textarea
              id="secret-input"
              rows={3}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              disabled={mutation.isPending}
              placeholder="输入需要保护的秘密文本、口令或私人留言 (最多1000字)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none disabled:opacity-50"
            />
            <div className="text-right text-xs text-slate-500">
              {secret.length}/1000 字
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-start gap-3 p-4 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Processing State */}
          {mutation.isPending && (
            <ProcessingState message={progressMsg || "处理中..."} />
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!file || !secret.trim() || mutation.isPending}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-sm"
          >
            <Sparkles className="w-4 h-4" />
            提取图像特征并创建
          </button>
        </form>
      )}
    </div>
  );
}
