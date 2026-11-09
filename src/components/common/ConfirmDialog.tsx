import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title: string;
  description?: string;
  message?: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  variant?: "danger" | "default";
  isLoading?: boolean;
  onConfirm: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  isOpen,
  onOpenChange,
  onClose,
  title,
  description,
  message,
  confirmLabel,
  confirmText,
  cancelLabel = "Cancel",
  isDestructive,
  variant,
  isLoading = false,
  onConfirm,
}) => {
  const isModalOpen = Boolean(open ?? isOpen);
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const desc = description || message || "";
  const btnLabel = confirmLabel || confirmText || "Confirm";
  const destructive = Boolean(isDestructive || variant === "danger");

  return (
    <Dialog.Root open={isModalOpen} onOpenChange={(val) => (!val ? handleClose() : null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-bg-card p-6 shadow-2xl border border-border space-y-4 focus:outline-none">
          <div className="flex items-start gap-3">
            {destructive && (
              <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-status-danger shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
            )}
            <div className="space-y-1 flex-1">
              <Dialog.Title className="text-lg font-bold text-text-primary">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-text-muted leading-relaxed">
                {desc}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                onClick={handleClose}
                className="text-text-muted hover:text-text-primary p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-text-primary hover:bg-bg-muted transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 ${
                destructive
                  ? "bg-status-danger hover:bg-rose-600"
                  : "bg-brand hover:bg-brand-hover"
              }`}
            >
              {isLoading && (
                <div className="w-3 h-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {btnLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
