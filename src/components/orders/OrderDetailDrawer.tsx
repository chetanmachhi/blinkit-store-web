import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  Phone,
  Printer,
  MapPin,
  Clock,
  FileText,
  User,
  CreditCard,
  Save,
} from "lucide-react";
import dayjs from "dayjs";
import { IOrder, PaymentStatus } from "../../types/domain";
import { formatRupees } from "../../utils/money";
import { StatusBadge } from "../common/StatusBadge";
import { orderService } from "../../api/order.service";
import { RiderAssignCard } from "./RiderAssignCard";

interface OrderDetailDrawerProps {
  order: IOrder | null;
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onOrderUpdated?: (updated?: IOrder) => void;
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  order,
  open,
  isOpen,
  onOpenChange,
  onClose,
  onOrderUpdated,
}) => {
  const isDrawerOpen = Boolean(open ?? isOpen);
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };
  const [internalNote, setInternalNote] = useState<string>(order?.internalNote || "");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  React.useEffect(() => {
    if (order) {
      setInternalNote(order.internalNote || "");
    }
  }, [order]);

  if (!order) return null;

  const handleSaveNote = async () => {
    try {
      setIsSavingNote(true);
      const updated = await orderService.updateNote(order._id, internalNote);
      if (onOrderUpdated) onOrderUpdated(updated);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleTogglePayment = async () => {
    const nextStatus: PaymentStatus =
      order.paymentStatus === "paid" ? "pending" : "paid";
    try {
      setIsUpdatingPayment(true);
      const updated = await orderService.updatePayment(order._id, nextStatus);
      if (onOrderUpdated) onOrderUpdated(updated);
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog.Root open={isDrawerOpen} onOpenChange={(val) => (!val ? handleClose() : null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs animate-fade-in no-print" />
        <Dialog.Content className="fixed top-0 bottom-0 right-0 z-50 w-full max-w-xl bg-bg-card border-l border-border shadow-2xl flex flex-col focus:outline-none animate-slide-left">
          <div className="flex items-center justify-between p-5 border-b border-border bg-bg-muted/30 no-print">
            <div>
              <div className="flex items-center gap-2">
                <Dialog.Title className="text-lg font-bold text-text-primary">
                  {order.orderNumber}
                </Dialog.Title>
                <StatusBadge status={order.status} size="sm" />
              </div>
              <Dialog.Description className="text-xs text-text-muted mt-0.5">
                Placed on {dayjs(order.createdAt).format("MMM D, YYYY h:mm A")}
              </Dialog.Description>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-bg-card hover:bg-bg-muted text-xs font-semibold text-text-primary transition-colors"
                title="Print Order Receipt"
              >
                <Printer className="w-3.5 h-3.5 text-brand" />
                Print
              </button>
              <Dialog.Close asChild>
                <button
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-muted"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <RiderAssignCard compact order={order} onAssigned={(u) => onOrderUpdated?.(u)} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-border bg-bg-muted/20 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase">
                  <User className="w-3.5 h-3.5 text-brand" />
                  Customer Details
                </div>
                <div className="text-sm font-semibold text-text-primary">
                  {order.customer.name}
                </div>
                <a
                  href={`tel:${order.customer.phone}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline mt-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {order.customer.phone}
                </a>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-bg-muted/20 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase">
                  <CreditCard className="w-3.5 h-3.5 text-brand" />
                  Payment Details
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Method:</span>
                  <span className="font-semibold uppercase">{order.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Status:</span>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={order.paymentStatus} size="sm" />
                    <button
                      onClick={handleTogglePayment}
                      disabled={isUpdatingPayment}
                      className="text-[10px] text-brand hover:underline font-bold"
                    >
                      Mark {order.paymentStatus === "paid" ? "Pending" : "Paid"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-bg-muted/20 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase mb-1">
                <MapPin className="w-3.5 h-3.5 text-brand" />
                Delivery Address
              </div>
              <p className="text-xs font-medium text-text-primary leading-relaxed">
                {order.deliveryAddress.addressLine}
              </p>
              {order.deliveryAddress.landmark && (
                <p className="text-[11px] text-text-muted">
                  Landmark: {order.deliveryAddress.landmark}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-text-muted uppercase mb-3">
                Order Items ({order.items.length})
              </h4>
              <div className="rounded-xl border border-border divide-y divide-border overflow-hidden bg-bg-card">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-bg-muted border border-border shrink-0 flex items-center justify-center text-text-muted font-bold text-[10px]">
                          IMG
                        </div>
                      )}
                      <div className="truncate">
                        <div className="font-semibold text-text-primary truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-text-muted">
                          {item.unit} &bull; {formatRupees(item.price)} each
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-text-primary">
                        {formatRupees(item.lineTotal)}
                      </div>
                      <div className="text-[11px] text-text-muted font-medium">
                        Qty: {item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-bg-muted/30 space-y-2 text-xs">
              <div className="flex justify-between text-text-muted">
                <span>Items Subtotal</span>
                <span>{formatRupees(order.bill.itemTotal)}</span>
              </div>
              {order.bill.discount > 0 && (
                <div className="flex justify-between text-brand font-medium">
                  <span>Discount ({order.couponCode || "Coupon"})</span>
                  <span>-{formatRupees(order.bill.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-text-muted">
                <span>Delivery Fee</span>
                <span>{order.bill.deliveryFee === 0 ? "FREE" : formatRupees(order.bill.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Handling Fee</span>
                <span>{formatRupees(order.bill.handlingFee)}</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between font-bold text-sm text-text-primary">
                <span>Grand Total</span>
                <span>{formatRupees(order.bill.grandTotal)}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-text-muted uppercase mb-2">
                Internal Staff Note
              </h4>
              <div className="space-y-2">
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Private notes visible only to store team (e.g., customer requested eco-bag)..."
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg-muted/40 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand resize-none h-20"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNote}
                    disabled={isSavingNote || internalNote === (order.internalNote || "")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-colors disabled:opacity-40"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Note
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-text-muted uppercase mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand" />
                Status Timeline
              </h4>
              <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border pl-6 text-xs">
                {order.statusHistory.map((h, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-brand ring-4 ring-bg-card" />
                    <div className="font-bold text-text-primary capitalize">
                      {h.status.replace(/_/g, " ")}
                    </div>
                    <div className="text-[11px] text-text-muted">
                      {dayjs(h.at).format("h:mm:ss A &bull; MMM D")}
                      {h.note && <span> &bull; {h.note}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      <div className="print-only p-8 text-black bg-white">
        <div className="text-center pb-4 border-b">
          <h1 className="text-2xl font-black">BLINKIT DARK STORE</h1>
          <p className="text-xs">Order Dispatch Slip</p>
        </div>
        <div className="py-4 space-y-1 text-sm">
          <div><strong>Order Number:</strong> {order.orderNumber}</div>
          <div><strong>Date:</strong> {dayjs(order.createdAt).format("YYYY-MM-DD HH:mm")}</div>
          <div><strong>Customer:</strong> {order.customer.name} ({order.customer.phone})</div>
          <div><strong>Address:</strong> {order.deliveryAddress.addressLine}</div>
          <div><strong>Payment:</strong> {order.paymentMethod.toUpperCase()} ({order.paymentStatus.toUpperCase()})</div>
        </div>
        <table className="w-full text-left text-sm border-t border-b my-4">
          <thead>
            <tr>
              <th className="py-2">Item</th>
              <th className="py-2">Qty</th>
              <th className="py-2 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it, i) => (
              <tr key={i}>
                <td className="py-1">{it.name} ({it.unit})</td>
                <td className="py-1">{it.quantity}</td>
                <td className="py-1 text-right">{formatRupees(it.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-right text-base font-bold">
          Total: {formatRupees(order.bill.grandTotal)}
        </div>
      </div>
    </Dialog.Root>
  );
};
