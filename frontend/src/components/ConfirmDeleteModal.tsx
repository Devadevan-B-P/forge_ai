import { X, AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ConfirmDeleteModal({
  title,
  message,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(5,5,5,0.85)", backdropFilter: "blur(12px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md flex flex-col rounded-2xl overflow-hidden animate-modal-in"
        style={{
          background: "#0E1014",
          border: "1px solid #22252B",
          boxShadow: "0 0 80px rgba(239,68,68,0.05), 0 24px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid #22252B" }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={18} />
            <span className="text-sm font-semibold text-white">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 text-[#9CA3AF] hover:text-white"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #22252B" }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 text-sm text-[#9CA3AF] leading-relaxed">
          {message}
        </div>

        {/* Action Buttons */}
        <div
          className="px-5 py-4 shrink-0 flex items-center justify-end gap-3"
          style={{ borderTop: "1px solid #22252B", background: "#0A0B0E" }}
        >
          <button
            onClick={onClose}
            className="text-xs px-4 py-2 rounded-lg font-medium border border-[#22252B] bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="text-xs px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/10 transition-all duration-200"
          >
            Permanently Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
