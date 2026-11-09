import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { subscribeToast } from "../../api/client";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToast((message, type) => {
      const id = `${Date.now()}_${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    });

    return unsubscribe;
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg text-sm transition-all duration-200 animate-slide-in ${
            toast.type === "success"
              ? "bg-white dark:bg-bg-card border-brand/30 text-text-primary"
              : toast.type === "error"
              ? "bg-white dark:bg-bg-card border-status-danger/40 text-text-primary"
              : "bg-white dark:bg-bg-card border-border text-text-primary"
          }`}
        >
          {toast.type === "success" && (
            <CheckCircle2 className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          )}
          {toast.type === "error" && (
            <AlertCircle className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
          )}
          {toast.type === "info" && (
            <Info className="w-5 h-5 text-accent-violet shrink-0 mt-0.5" />
          )}

          <div className="flex-1 font-medium leading-snug">{toast.message}</div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-text-muted hover:text-text-primary p-0.5"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
