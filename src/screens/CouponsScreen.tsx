import React, { useState, useEffect } from "react";
import { Plus, Tag, Edit2, Trash2, BarChart2, Loader2, Calendar } from "lucide-react";
import { couponApi } from "../api/coupon.service";
import { ICoupon } from "../types/domain";
import { formatRupees, formatRupeesShort } from "../utils/money";
import { CouponFormModal } from "../components/coupons/CouponFormModal";
import { CouponUsageDrawer } from "../components/coupons/CouponUsageDrawer";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import dayjs from "dayjs";

export const CouponsScreen: React.FC = () => {
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCouponForEdit, setSelectedCouponForEdit] = useState<ICoupon | null>(null);
  const [selectedCouponForUsage, setSelectedCouponForUsage] = useState<ICoupon | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<ICoupon | null>(null);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await couponApi.list();
      setCoupons(res.data);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleDelete = async () => {
    if (!couponToDelete) return;
    try {
      await couponApi.delete(couponToDelete._id);
      setCouponToDelete(null);
      await fetchCoupons();
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Promotions & Coupons
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Create discount offers and track redemption statistics
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          <span>New Coupon</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Coupon Code</th>
                <th className="px-4 py-3 font-semibold">Discount</th>
                <th className="px-4 py-3 font-semibold">Min Order</th>
                <th className="px-4 py-3 font-semibold">Validity</th>
                <th className="px-4 py-3 font-semibold">Redemptions</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                    <span className="mt-2 block">Loading coupons...</span>
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    No active discount coupons found. Create your first promo code.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr
                    key={coupon._id}
                    className="hover:bg-gray-50/80 transition-colors dark:hover:bg-gray-700/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Tag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <span className="font-mono font-bold text-gray-900 dark:text-white">
                            {coupon.code}
                          </span>
                          <p className="text-[11px] text-gray-500">{coupon.description}</p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {coupon.type === "percent"
                          ? `${coupon.value}% off`
                          : `${formatRupeesShort(coupon.value)} off`}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {coupon.type === "percent"
                          ? coupon.maxDiscount
                            ? `up to ${formatRupeesShort(coupon.maxDiscount)}`
                            : "no cap"
                          : "flat"}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {formatRupees(coupon.minOrderAmount)}
                    </td>

                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      <div className="flex items-center space-x-1 text-[11px]">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>
                          {dayjs(coupon.validFrom).format("DD MMM")} -{" "}
                          {dayjs(coupon.validTo).format("DD MMM YYYY")}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedCouponForUsage(coupon)}
                        className="inline-flex items-center space-x-1 rounded bg-gray-100 px-2 py-0.5 font-semibold text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      >
                        <BarChart2 className="h-3 w-3" />
                        <span>{coupon.usedCount} used</span>
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold ${
                          coupon.isActive
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedCouponForUsage(coupon)}
                          className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="View Usage"
                        >
                          <BarChart2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedCouponForEdit(coupon)}
                          className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setCouponToDelete(coupon)}
                          className="rounded p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CouponFormModal
        isOpen={isCreateOpen || Boolean(selectedCouponForEdit)}
        onClose={() => {
          setIsCreateOpen(false);
          setSelectedCouponForEdit(null);
        }}
        coupon={selectedCouponForEdit}
        onSuccess={fetchCoupons}
      />

      <CouponUsageDrawer
        isOpen={Boolean(selectedCouponForUsage)}
        onClose={() => setSelectedCouponForUsage(null)}
        coupon={selectedCouponForUsage}
      />

      <ConfirmDialog
        isOpen={Boolean(couponToDelete)}
        onClose={() => setCouponToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Coupon"
        message={`Are you sure you want to deactivate and soft-delete promo coupon "${couponToDelete?.code}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
