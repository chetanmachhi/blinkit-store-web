import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Clock, X } from "lucide-react";
import { IOrder } from "../../types/domain";
import { orderApi } from "../../api/order.service";

interface AcceptOrderModalProps {
  order: IOrder | null;
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onAccept?: (orderId: string, prepMinutes: number) => Promise<void>;
  onSuccess?: () => void;
}

export const AcceptOrderModal: React.FC<AcceptOrderModalProps> = ({
  order,
  open,
  isOpen,
  onOpenChange,
  onClose,
  onAccept,
  onSuccess,
}) => {
  const isModalOpen = Boolean(open ?? isOpen);
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const [selectedMinutes, setSelectedMinutes] = useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chips = [10, 15, 20, 30];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      setIsSubmitting(true);
      if (onAccept) {
        await onAccept(order._id, selectedMinutes);
      } else {
        await orderApi.acceptOrder(order._id, selectedMinutes);
      }
      if (onSuccess) onSuccess();
      handleClose();
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
              <div className="p-2.5 rounded-full bg-brand-soft text-brand">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-text-primary">
                  Accept Order #{order.orderNumber}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-text-muted">
                  Select estimated preparation duration before rider dispatch.
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
                Preparation Time (Minutes)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {chips.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMinutes(m)}
                    className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                      selectedMinutes === m
                        ? "bg-brand text-white border-brand shadow-sm bg-emerald-600"
                        : "bg-bg-muted/50 text-text-primary border-border hover:border-brand/40"
                    }`}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-bg-muted/40 border border-border text-xs text-text-muted flex justify-between">
              <span>Customer: <strong className="text-text-primary">{order.customer.name}</strong></span>
              <span>Items: <strong className="text-text-primary">{order.items.length}</strong></span>
            </div>

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
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5"
              >
                {isSubmitting && (
                  <div className="w-3 h-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                Confirm & Accept
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
