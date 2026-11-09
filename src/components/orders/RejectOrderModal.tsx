import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, X } from "lucide-react";
import { IOrder } from "../../types/domain";
import { orderApi } from "../../api/order.service";

interface RejectOrderModalProps {
  order: IOrder | null;
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onReject?: (orderId: string, reason: string) => Promise<void>;
  onSuccess?: () => void;
}

export const RejectOrderModal: React.FC<RejectOrderModalProps> = ({
  order,
  open,
  isOpen,
  onOpenChange,
  onClose,
  onReject,
  onSuccess,
}) => {
  const isModalOpen = Boolean(open ?? isOpen);
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const [selectedChip, setSelectedChip] = useState<string>("Out of stock");
  const [customReason, setCustomReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chips = [
    "Out of stock",
    "Store closing soon",
    "Address too far",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    const finalReason = selectedChip === "Other" ? customReason.trim() : selectedChip;
    if (!finalReason) return;

    try {
      setIsSubmitting(true);
      if (onReject) {
        await onReject(order._id, finalReason);
      } else {
        await orderApi.rejectOrder(order._id, finalReason);
      }
      if (onSuccess) onSuccess();
      handleClose();
      setCustomReason("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog.Root open={isModalOpen} onOpenChange={(val) => (!val ? handleClose() : null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-bg-card p-6 shadow-2xl border border-border space-y-5 focus:outline-none">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-status-danger">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-text-primary">
                  Reject Order #{order.orderNumber}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-text-muted">
                  The customer will be notified and reserved items restored to stock.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button onClick={handleClose} className="text-text-muted hover:text-text-primary p-1">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-2">
                Rejection Reason
              </label>
              <div className="grid grid-cols-2 gap-2">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setSelectedChip(chip)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border text-left transition-all ${
                      selectedChip === chip
                        ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40"
                        : "bg-bg-muted/50 text-text-primary border-border hover:border-border"
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {selectedChip === "Other" && (
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                  Specify Reason
                </label>
                <input
                  type="text"
                  required
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter custom rejection reason"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg-muted text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-text-primary hover:bg-bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (selectedChip === "Other" && !customReason.trim())}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting && (
                  <div className="w-3 h-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                Reject Order
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
