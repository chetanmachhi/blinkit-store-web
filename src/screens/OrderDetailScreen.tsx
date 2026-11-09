import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Phone,
  Clock,
  MapPin,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
} from "lucide-react";
import { orderApi } from "../api/order.service";
import { IOrder, IOrderItem, IStatusHistoryEntry, OrderStatus, PaymentStatus } from "../types/domain";
import { formatRupees } from "../utils/money";
import { StatusBadge } from "../components/common/StatusBadge";
import dayjs from "dayjs";
import { RiderAssignCard } from "../components/orders/RiderAssignCard";
import { Package } from "lucide-react";

export const OrderDetailScreen: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<IOrder | null>(null);
  const [internalNote, setInternalNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = async () => {
    if (!orderId) return;
    setIsLoading(true);
    try {
      const res = await orderApi.getOrder(orderId);
      setOrder(res.data);
      setInternalNote(res.data.internalNote || "");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || "Failed to load order.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleSaveNote = async () => {
    if (!orderId) return;
    setIsSavingNote(true);
    try {
      await orderApi.updateInternalNote(orderId, internalNote);
      await fetchOrder();
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleUpdatePayment = async (status: PaymentStatus) => {
    if (!orderId) return;
    setActionLoading(true);
    try {
      await orderApi.updatePaymentStatus(orderId, status);
      await fetchOrder();
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusTransition = async (nextStatus: OrderStatus) => {
    if (!orderId) return;
    setActionLoading(true);
    try {
      await orderApi.updateStatus(orderId, { status: nextStatus });
      await fetchOrder();
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950/30">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
        <h2 className="mt-2 text-base font-semibold text-rose-900 dark:text-rose-200">
          Order Not Found
        </h2>
        <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">{error}</p>
        <button
          onClick={() => navigate("/orders")}
          className="mt-4 inline-flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Orders</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/orders")}
            className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold font-mono text-gray-900 dark:text-white">
                #{order.orderNumber}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Placed on {dayjs(order.createdAt).format("DD MMMM YYYY, hh:mm A")}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <Printer className="h-4 w-4" />
            <span>Print Receipt Slip</span>
          </button>

          {order.status === "accepted" && (
            <button
              onClick={() => handleStatusTransition("preparing")}
              disabled={actionLoading}
              className="inline-flex items-center space-x-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Start packing
            </button>
          )}

          {order.status === "preparing" && (
            <button
              onClick={() => handleStatusTransition("out_for_delivery")}
              disabled={actionLoading}
              className="inline-flex items-center space-x-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Handed to rider
            </button>
          )}

          {order.status === "out_for_delivery" && (
            <button
              onClick={() => handleStatusTransition("delivered")}
              disabled={actionLoading}
              className="inline-flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Mark Delivered
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Order Items ({order.items.length})
            </h2>
            <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-700">
              {order.items.map((item: IOrderItem, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40">
                      <Package className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        {item.unit} • {formatRupees(item.price)} each
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {formatRupees(item.lineTotal)}
                    </span>
                    <p className="text-[11px] text-gray-500">× {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Item Subtotal</span>
                  <span>{formatRupees(order.bill.itemTotal)}</span>
                </div>
                {order.bill.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount Applied</span>
                    <span>-{formatRupees(order.bill.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Delivery Fee</span>
                  <span>{formatRupees(order.bill.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Handling Fee</span>
                  <span>{formatRupees(order.bill.handlingFee)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                  <span>Grand Total</span>
                  <span>{formatRupees(order.bill.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Timeline
            </h2>
            <div className="mt-4 space-y-4">
              {order.statusHistory.map((hist: IStatusHistoryEntry, i: number) => (
                <div key={i} className="flex items-start space-x-3 text-xs">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold uppercase text-gray-900 dark:text-white">
                        {hist.status.split("_").join(" ")}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {dayjs(hist.at).format("DD MMM, hh:mm A")}
                      </span>
                    </div>
                    {hist.note && (
                      <p className="mt-0.5 text-gray-600 dark:text-gray-300">{hist.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <RiderAssignCard order={order} onAssigned={setOrder} />

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Customer & Delivery Details
            </h2>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="text-gray-500">Customer Name</span>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {order.customer.name}
                </p>
              </div>

              <div>
                <span className="text-gray-500">Contact Number</span>
                <p className="mt-0.5">
                  <a
                    href={`tel:${order.customer.phone}`}
                    className="inline-flex items-center space-x-1.5 font-mono font-semibold text-emerald-600 hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>{order.customer.phone}</span>
                  </a>
                </p>
              </div>

              <div className="border-t border-gray-100 pt-3 dark:border-gray-700">
                <span className="text-gray-500">Delivery Address</span>
                <div className="mt-1 flex items-start space-x-1.5 text-gray-700 dark:text-gray-300">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span>{order.deliveryAddress.addressLine}</span>
                </div>
              </div>

              {order.notes && (
                <div className="border-t border-gray-100 pt-3 dark:border-gray-700">
                  <span className="text-gray-500">Delivery Instructions</span>
                  <p className="mt-1 rounded bg-amber-50 p-2 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Payment Information
            </h2>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Payment Method</span>
                <span className="font-semibold uppercase text-gray-900 dark:text-white">
                  {order.paymentMethod}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Payment Status</span>
                <span
                  className={`font-semibold uppercase ${
                    order.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
              {order.paymentStatus !== "paid" && (
                <button
                  onClick={() => handleUpdatePayment("paid")}
                  disabled={actionLoading}
                  className="mt-2 w-full rounded-lg border border-emerald-600 py-1.5 font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                >
                  Mark as Paid (Cash Collected)
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Internal note
            </h2>
            <p className="mt-1 text-[11px] text-gray-500">
              Only visible to store staff and managers
            </p>
            <div className="mt-3">
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Add notes e.g. Customer requested extra bag..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleSaveNote}
                disabled={isSavingNote}
                className="mt-2 flex w-full items-center justify-center space-x-1.5 rounded-lg border border-gray-300 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {isSavingNote ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Save note</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
