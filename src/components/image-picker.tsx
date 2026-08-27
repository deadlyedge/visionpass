import { useRef } from "react";
import { Upload } from "lucide-react";

interface ImagePickerProps {
  label: string;
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  label,
  previewUrl,
  onFileSelect,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onFileSelect(file);
    }
  };

  return (
    <div className="w-full space-y-2">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-all duration-200 cursor-pointer overflow-hidden min-h-[220px] ${
          previewUrl
            ? "border-emerald-500/50 bg-slate-900/60"
            : "border-slate-700 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/80"
        } ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />

        {previewUrl ? (
          <div className="relative group w-full flex flex-col items-center">
            <img
              src={previewUrl}
              alt="Selected Preview"
              className="max-h-60 rounded-lg object-contain shadow-md"
            />
            <div className="mt-3 text-xs text-slate-400">点击或拖拽以更换图片</div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-slate-800 rounded-full text-slate-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">
                点击选择图片或拖拽图片至此处
              </p>
              <p className="text-xs text-slate-500 mt-1">支持 PNG, JPG, WebP 格式（推荐具有丰富纹理结构的图片）</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
