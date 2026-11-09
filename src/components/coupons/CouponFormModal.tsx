import { createPortal } from "react-dom";
import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { ICoupon } from "../../types/domain";
import { couponApi } from "../../api/coupon.service";
import { useAuthStore } from "../../store/authStore";
import { paiseToRupeeString, rupeeStringToPaise } from "../../utils/money";

interface CouponFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon?: ICoupon | null;
  onSuccess: () => void;
}

export const CouponFormModal: React.FC<CouponFormModalProps> = ({
  isOpen,
  onClose,
  coupon,
  onSuccess,
}) => {
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"percent" | "flat">("percent");
  const [valueStr, setValueStr] = useState("");
  const [maxDiscountStr, setMaxDiscountStr] = useState("");
  const [minOrderStr, setMinOrderStr] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [usageLimit, setUsageLimit] = useState<string>("");
  const [perUserLimit, setPerUserLimit] = useState<string>("1");
  const [isStoreSpecific, setIsStoreSpecific] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (coupon) {
      setCode(coupon.code);
      setDescription(coupon.description);
      setType(coupon.type);
      setValueStr(
        coupon.type === "flat" ? paiseToRupeeString(coupon.value) : coupon.value.toString()
      );
      setMaxDiscountStr(coupon.maxDiscount ? paiseToRupeeString(coupon.maxDiscount) : "");
      setMinOrderStr(paiseToRupeeString(coupon.minOrderAmount));
      setValidFrom(coupon.validFrom ? coupon.validFrom.substring(0, 10) : "");
      setValidTo(coupon.validTo ? coupon.validTo.substring(0, 10) : "");
      setUsageLimit(coupon.usageLimit ? coupon.usageLimit.toString() : "");
      setPerUserLimit(coupon.perUserLimit.toString());
      setIsStoreSpecific(Boolean(coupon.storeId));
      setIsActive(coupon.isActive);
    } else {
      setCode("");
      setDescription("");
      setType("percent");
      setValueStr("");
      setMaxDiscountStr("");
      setMinOrderStr("0");
      const today = new Date().toISOString().substring(0, 10);
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .substring(0, 10);
      setValidFrom(today);
      setValidTo(nextMonth);
      setUsageLimit("");
      setPerUserLimit("1");
      setIsStoreSpecific(true);
      setIsActive(true);
    }
    setError(null);
  }, [coupon, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Coupon code is required.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    if (!valueStr.trim()) {
      setError("Discount value is required.");
      return;
    }
    if (!validFrom || !validTo) {
      setError("Validity dates are required.");
      return;
    }

    const numericValue =
      type === "flat" ? rupeeStringToPaise(valueStr) : Number(valueStr);

    if (type === "percent" && (numericValue <= 0 || numericValue > 100)) {
      setError("Percentage discount must be between 1 and 100.");
      return;
    }

    const payload: any = {
      code: code.trim().toUpperCase(),
      description: description.trim(),
      type,
      value: numericValue,
      minOrderAmount: rupeeStringToPaise(minOrderStr || "0"),
      validFrom: new Date(validFrom).toISOString(),
      validTo: new Date(validTo + "T23:59:59.999Z").toISOString(),
      perUserLimit: Number(perUserLimit) || 1,
      isActive,
      storeId: isStoreSpecific ? activeStoreId : null,
    };

    if (type === "percent" && maxDiscountStr.trim()) {
      payload.maxDiscount = rupeeStringToPaise(maxDiscountStr);
    }
    if (usageLimit.trim()) {
      payload.usageLimit = Number(usageLimit);
    }

    setIsLoading(true);
    setError(null);

    try {
      if (coupon) {
        await couponApi.update(coupon._id, payload);
      } else {
        await couponApi.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || "Failed to save coupon.");
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {coupon ? "Edit Coupon" : "Create Coupon"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-6">
          {error && (
            <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME50"
                className="mt-1 block w-full uppercase rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "percent" | "flat")}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Get 20% off on your first order"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {type === "percent" ? "Discount Percentage (%)" : "Discount Amount (₹)"}
              </label>
              <input
                type="text"
                value={valueStr}
                onChange={(e) => setValueStr(e.target.value)}
                inputMode="decimal"
                placeholder={type === "percent" ? "e.g. 20 (max 100)" : "e.g. 50.00"}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            {type === "percent" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Discount (₹)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={maxDiscountStr}
                  onChange={(e) => setMaxDiscountStr(e.target.value)}
                  placeholder="No cap"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}
            {/* Minimum order applies to both coupon types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Min Order (₹)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={minOrderStr}
                onChange={(e) => setMinOrderStr(e.target.value)}
                placeholder="0.00"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Valid From
              </label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Valid To
              </label>
              <input
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Usage Limit
              </label>
              <input
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="Unlimited"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Per User Limit
              </label>
              <input
                type="number"
                value={perUserLimit}
                onChange={(e) => setPerUserLimit(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={isStoreSpecific}
                onChange={(e) => setIsStoreSpecific(e.target.checked)}
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Restrict to current store only</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Active</span>
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{coupon ? "Save Changes" : "Create Coupon"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
