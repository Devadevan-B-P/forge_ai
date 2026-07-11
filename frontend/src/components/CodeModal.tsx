import { X, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function CodeModal({
  title,
  code,
  onClose,
}: {
  title: string;
  code: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h4 className="font-medium text-sm">{title}</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={copy}
              className="p-1.5 rounded-lg hover:bg-panel text-slate-400 hover:text-white transition"
              title="Copy"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-panel text-slate-400 hover:text-white transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <pre className="p-5 text-xs text-slate-200 overflow-auto whitespace-pre-wrap">
          {code}
        </pre>
      </div>
    </div>
  );
}
