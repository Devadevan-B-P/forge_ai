import { X, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

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

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(5,5,5,0.85)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl overflow-hidden animate-modal-in"
        style={{
          background: "#0E1014",
          border: "1px solid #22252B",
          boxShadow: "0 0 80px rgba(95,169,255,0.07), 0 24px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header — always visible, close button never overlaps */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid #22252B" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-2 h-2 rounded-full bg-[#5FA9FF] shrink-0" />
            <span className="text-sm font-mono text-white truncate">{title}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button
              onClick={copy}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{
                background: copied ? "rgba(61,217,164,0.12)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${copied ? "rgba(61,217,164,0.3)" : "#22252B"}`,
                color: copied ? "#3DD9A4" : "#9CA3AF",
              }}
              title="Copy code"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 text-[#9CA3AF] hover:text-white"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #22252B" }}
              title="Close (Esc)"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Code body — scrollable independently */}
        <div className="overflow-auto flex-1">
          <pre
            className="p-5 text-xs leading-relaxed whitespace-pre-wrap font-mono"
            style={{ color: "#CBD5E1" }}
          >
            {code}
          </pre>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 shrink-0 flex items-center justify-between"
          style={{ borderTop: "1px solid #22252B" }}
        >
          <span className="text-[11px] text-[#9CA3AF]">
            Press <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "#22252B", border: "1px solid #33373F" }}>Esc</kbd> or click outside to close
          </span>
          <span className="text-[11px] text-[#5FA9FF]">{code.split("\n").length} lines</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
