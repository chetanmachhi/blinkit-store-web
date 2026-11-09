import { createPortal } from "react-dom";
import React, { useEffect, useState } from "react";
import { X, Loader2, Tag, ShoppingBag } from "lucide-react";
import { ICoupon } from "../../types/domain";
import { couponApi, ICouponUsageResponse } from "../../api/coupon.service";
import { formatRupees } from "../../utils/money";
import dayjs from "dayjs";

interface CouponUsageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: ICoupon | null;
}

export const CouponUsageDrawer: React.FC<CouponUsageDrawerProps> = ({
  isOpen,
  onClose,
  coupon,
}) => {
  const [usageData, setUsageData] = useState<ICouponUsageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && coupon) {
      setIsLoading(true);
      setError(null);
      couponApi
        .getUsage(coupon._id)
        .then((res: any) => {
          setUsageData(res.data || null);
        })
        .catch((err: any) => {
          setError(err.response?.data?.error?.message || err.message || "Failed to load coupon usage.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setUsageData(null);
    }
  }, [isOpen, coupon]);

  if (!isOpen || !coupon) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-xl dark:bg-gray-800">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Tag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Coupon Usage: {coupon.code}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {coupon.description}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isLoading && (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                  {error}
                </div>
              )}

              {!isLoading && usageData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Total Times Used
                      </p>
                      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                        {usageData.totalOrders}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Total Savings
                      </p>
                      <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupees(usageData.totalDiscountGiven)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Recent Redemptions
                    </h3>
                    {usageData.recentOrders.length === 0 ? (
                      <div className="mt-4 rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-gray-700">
                        No orders have redeemed this coupon yet.
                      </div>
                    ) : (
                      <div className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
                        {usageData.recentOrders.map((order: any) => (
                          <div key={order._id} className="p-3 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-semibold text-gray-900 dark:text-white">
                                {order.orderNumber}
                              </span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                -{formatRupees(order.bill?.discount ?? 0)}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-gray-500 dark:text-gray-400">
                              <span>{order.customer?.name}</span>
                              <span>{dayjs(order.createdAt).format("DD MMM YYYY, hh:mm A")}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
