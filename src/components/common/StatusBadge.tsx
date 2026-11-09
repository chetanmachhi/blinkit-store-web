import React from "react";
import { OrderStatus, PaymentStatus } from "../../types/domain";

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus | string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
}) => {
  const normalized = status.toLowerCase();

  let styles = "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300";
  let label: string = status;

  switch (normalized) {
    case "placed":
      styles = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
      label = "New";
      break;
    case "accepted":
      styles = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
      label = "Accepted";
      break;
    case "preparing":
      styles = "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
      label = "Packing";
      break;
    case "out_for_delivery":
      styles = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800";
      label = "Out for Delivery";
      break;
    case "delivered":
      styles = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
      label = "Delivered";
      break;
    case "cancelled":
      styles = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
      label = "Cancelled";
      break;
    case "paid":
      styles = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
      label = "Paid";
      break;
    case "pending":
      styles = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
      label = "Pending";
      break;
    case "refunded":
      styles = "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
      label = "Refunded";
      break;
    case "failed":
      styles = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
      label = "Failed";
      break;
    case "active":
      styles = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
      label = "Active";
      break;
    case "inactive":
      styles = "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400";
      label = "Inactive";
      break;
    case "low_stock":
      styles = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 font-semibold";
      label = "Low Stock";
      break;
  }

  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-xs font-medium" : "px-2.5 py-1 text-xs font-semibold";

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border ${styles} ${sizeClasses}`}
    >
      {label}
    </span>
  );
};
