import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { orderApi } from "../api/order.service";
import { IOrder, IOrderItem, OrderStatus, PaymentStatus } from "../types/domain";
import { useAuthStore, AuthState } from "../store/authStore";
import { formatRupees } from "../utils/money";
import { StatusBadge } from "../components/common/StatusBadge";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";

import { Pagination } from "../types/api";

export const OrdersScreen: React.FC = () => {
  const activeStoreId = useAuthStore((state: AuthState) => state.activeStoreId);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    pages: 1,
    hasNext: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOrders = async (page = 1) => {
    if (!activeStoreId) return;
    setIsLoading(true);
    try {
      const res = await orderApi.listOrders(activeStoreId, {
        page,
        limit: 20,
        status: statusFilter ? (statusFilter as OrderStatus) : undefined,
        paymentStatus: paymentStatusFilter
          ? (paymentStatusFilter as PaymentStatus)
          : undefined,
        q: searchQuery.trim() || undefined,
      });
      setOrders(res.data.items);
      setPagination(res.data.pagination);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchOrders(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [activeStoreId, searchQuery, statusFilter, paymentStatusFilter]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Order History"
        description={isLoading ? "Loading orders…" : `${pagination.total.toLocaleString("en-IN")} orders`}
      />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order # or phone..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="placed">Placed</option>
            <option value="accepted">Accepted</option>
            <option value="preparing">Packing</option>
            <option value="out_for_delivery">Out For Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Payments</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Order #</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Date & Time</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Rider</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                    <span className="mt-2 block">Loading orders...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => navigate(`/orders/${order._id}`)}
                    className="cursor-pointer hover:bg-gray-50/80 transition-colors dark:hover:bg-gray-700/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">
                      #{order.orderNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {order.customer.name}
                      </div>
                      <div className="font-mono text-[11px] text-gray-500">
                        {order.customer.phone}
                      </div>
                    </td>
                    <td className="max-w-[260px] px-4 py-3 text-gray-600 dark:text-gray-300">
                      <span className="font-medium">
                        {order.items.length} item{order.items.length === 1 ? "" : "s"}
                      </span>
                      <p className="truncate text-[11px] text-gray-400" title={order.items.map((i: IOrderItem) => `${i.quantity}× ${i.name}`).join(", ")}>
                        {order.items.map((i: IOrderItem) => i.name).join(", ")}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">
                      <div>{dayjs(order.createdAt).format("DD MMM YYYY")}</div>
                      <div className="text-[11px] text-gray-400">
                        {dayjs(order.createdAt).format("hh:mm A")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="font-semibold uppercase text-gray-800 dark:text-gray-200">
                        {order.paymentMethod}
                      </div>
                      <div
                        className={`text-[10px] font-semibold uppercase ${
                          order.paymentStatus === "paid"
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {order.paymentStatus}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">
                      {order.rider ? (
                        <span className="font-medium text-gray-800 dark:text-gray-200">{order.rider.name}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                      {formatRupees(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/orders/${order._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center space-x-1 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {pagination.total === 0
              ? "No orders"
              : `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total.toLocaleString("en-IN")}`}
            <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
            Page {pagination.page} of {pagination.totalPages || pagination.pages || 1}
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchOrders(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => fetchOrders(pagination.page + 1)}
              disabled={pagination.page >= (pagination.totalPages || pagination.pages || 1) || isLoading}
              className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
