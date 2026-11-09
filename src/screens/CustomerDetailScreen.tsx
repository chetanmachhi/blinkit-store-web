import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { customerApi } from "../api/customer.service";
import { ICustomerDetail } from "../types/domain";
import { formatRupees } from "../utils/money";
import { StatusBadge } from "../components/common/StatusBadge";
import dayjs from "dayjs";

export const CustomerDetailScreen: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ICustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    setIsLoading(true);
    customerApi
      .getById(customerId)
      .then((res: any) => setData(res?.profile ? res : (res?.data || null)))
      .catch((err: any) => {
        setError(err.response?.data?.error?.message || err.message || "Failed to load customer.");
      })
      .finally(() => setIsLoading(false));
  }, [customerId]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950/30">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
        <h2 className="mt-2 text-base font-semibold text-rose-900 dark:text-rose-200">
          Customer Not Found
        </h2>
        <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">{error}</p>
        <button
          onClick={() => navigate("/customers")}
          className="mt-4 inline-flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Customers</span>
        </button>
      </div>
    );
  }

  const { profile, addresses, recentOrders, stats } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate("/customers")}
          className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {profile.name}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Registered customer since {dayjs(profile.createdAt).format("MMMM YYYY")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Total Orders
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {stats.orderCount}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Delivered Orders
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.deliveredCount}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Cancelled Orders
          </p>
          <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {stats.cancelledCount}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Lifetime Spend
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatRupees(stats.totalSpent)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Contact Profile
            </h2>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="text-gray-500">Phone Number</span>
                <p className="mt-0.5">
                  <a
                    href={`tel:${profile.phone}`}
                    className="inline-flex items-center space-x-1 font-mono font-semibold text-emerald-600 hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>{profile.phone}</span>
                  </a>
                </p>
              </div>

              <div>
                <span className="text-gray-500">Email Address</span>
                <p className="mt-0.5 flex items-center space-x-1 text-gray-800 dark:text-gray-200">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  <span>{profile.email}</span>
                </p>
              </div>

              <div>
                <span className="text-gray-500">Account Status</span>
                <p className="mt-0.5 font-semibold text-emerald-600">Active</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Saved Delivery Addresses ({addresses.length})
            </h2>
            <div className="mt-3 space-y-2.5">
              {addresses.length === 0 ? (
                <p className="text-xs text-gray-500">No saved addresses on file.</p>
              ) : (
                addresses.map((addr, i) => (
                  <div
                    key={i}
                    className="flex items-start space-x-2 rounded-lg bg-gray-50 p-2.5 text-xs dark:bg-gray-900/40"
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <div>
                      {addr.label && (
                        <span className="font-semibold uppercase text-gray-800 dark:text-gray-200">
                          {addr.label}
                        </span>
                      )}
                      <p className="text-gray-600 dark:text-gray-300">{addr.addressLine}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Recent Orders (Last 10)
          </h2>

          <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-700">
            {recentOrders.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-500">
                This customer has not placed any orders yet.
              </p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between py-3 text-xs"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-gray-900 dark:text-white">
                        #{order.orderNumber}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">
                      {order.items.length} {order.items.length === 1 ? "item" : "items"} • {dayjs(order.createdAt).format("DD MMM YYYY, hh:mm A")}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatRupees(order.totalAmount)}
                    </span>
                    <Link
                      to={`/orders/${order._id}`}
                      className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
