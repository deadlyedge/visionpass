import React from "react";
import { Loader2 } from "lucide-react";

interface ProcessingStateProps {
  message: string;
}

export const ProcessingState: React.FC<ProcessingStateProps> = ({ message }) => {
  return (
    <div className="flex items-center gap-3 p-4 bg-slate-900 border border-indigo-500/30 rounded-xl text-indigo-200">
      <Loader2 className="w-5 h-5 animate-spin text-indigo-400 shrink-0" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};
