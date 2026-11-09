import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Power,
} from "lucide-react";
import { storeApi } from "../api/store.service";
import { IStore } from "../types/domain";
import { useAuthStore, AuthState } from "../store/authStore";
import { paiseToRupeeString, rupeeStringToPaise } from "../utils/money";

export const StoreSettingsScreen: React.FC = () => {
  const activeStoreId = useAuthStore((state: AuthState) => state.activeStoreId);
  const storeRole = useAuthStore((state: AuthState) => state.storeRole);
  const isOwner = storeRole === "owner";

  const [, setStore] = useState<IStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPauseSaving, setIsPauseSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState("");
  const [minOrderStr, setMinOrderStr] = useState("");
  const [deliveryFeeStr, setDeliveryFeeStr] = useState("");
  const [freeAboveStr, setFreeAboveStr] = useState("");
  const [handlingFeeStr, setHandlingFeeStr] = useState("");
  const [avgPrepMinutes, setAvgPrepMinutes] = useState("");
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");

  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);
  const [pausedReason, setPausedReason] = useState("");

  const fetchStore = async () => {
    if (!activeStoreId) return;
    setIsLoading(true);
    try {
      const res = await storeApi.getStore(activeStoreId);
      const s = res.data;
      if (s) {
        setStore(s);
        setName(s.name);
        setPhone(s.phone);
        setAddress(s.address);
        setLat(s.location.lat.toString());
        setLng(s.location.lng.toString());
        setDeliveryRadiusKm(s.deliveryRadiusKm.toString());
        setMinOrderStr(paiseToRupeeString(s.minOrderAmount));
        setDeliveryFeeStr(paiseToRupeeString(s.deliveryFee));
        setFreeAboveStr(paiseToRupeeString(s.freeDeliveryAbove));
        setHandlingFeeStr(paiseToRupeeString(s.handlingFee));
        setAvgPrepMinutes(s.avgPrepMinutes.toString());
        setOpensAt(s.opensAt);
        setClosesAt(s.closesAt);
        setIsAcceptingOrders(s.isAcceptingOrders);
        setPausedReason(s.pausedReason || "");
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || "Failed to load store.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStore();
  }, [activeStoreId]);

  const handleToggleAccepting = async () => {
    if (!activeStoreId) return;
    setIsPauseSaving(true);
    setMessage(null);
    setError(null);
    try {
      const nextState = !isAcceptingOrders;
      await storeApi.setAcceptingOrders(activeStoreId, {
        isAcceptingOrders: nextState,
        reason: nextState ? undefined : pausedReason || "Temporarily paused by store manager",
      });
      setIsAcceptingOrders(nextState);
      setMessage(
        nextState
          ? "Store is now LIVE and accepting customer orders."
          : "Store is now PAUSED. Incoming customer orders are temporarily blocked."
      );
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || "Failed to toggle status.");
    } finally {
      setIsPauseSaving(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStoreId || !isOwner) return;

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      await storeApi.updateSettings(activeStoreId, {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        location: {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
        },
        deliveryRadiusKm: parseFloat(deliveryRadiusKm),
        minOrderAmount: rupeeStringToPaise(minOrderStr),
        deliveryFee: rupeeStringToPaise(deliveryFeeStr),
        freeDeliveryAbove: rupeeStringToPaise(freeAboveStr),
        handlingFee: rupeeStringToPaise(handlingFeeStr),
        avgPrepMinutes: parseInt(avgPrepMinutes, 10),
        opensAt,
        closesAt,
      });
      setMessage("Store settings saved successfully.");
      await fetchStore();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || "Failed to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Store Operations & Settings
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Configure fulfillment boundaries, fees, service times, and outlet status
        </p>
      </div>

      {message && (
        <div className="flex items-center space-x-2 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Order Receiving Switch (Emergency Kitchen Pause)
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              When toggled OFF, customers will be shown &quot;Store is not accepting orders&quot;
              and checkout will be prevented.
            </p>
          </div>

          <button
            onClick={handleToggleAccepting}
            disabled={isPauseSaving}
            className={`inline-flex items-center space-x-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-sm ${
              isAcceptingOrders
                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20"
                : "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-500/20"
            }`}
          >
            {isPauseSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            <span>{isAcceptingOrders ? "Store Is Accepting Orders" : "Store Is PAUSED"}</span>
          </button>
        </div>

        {!isAcceptingOrders && (
          <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            <span className="font-semibold">Pause Reason:</span>{" "}
            {pausedReason || "Kitchen busy / high backlog"}
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Outlet Profile & Location
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Outlet Name
              </label>
              <input
                type="text"
                value={name}
                disabled={!isOwner}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Contact Phone
              </label>
              <input
                type="text"
                value={phone}
                disabled={!isOwner}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Physical Address
              </label>
              <input
                type="text"
                value={address}
                disabled={!isOwner}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Latitude Coordinates
              </label>
              <input
                type="text"
                value={lat}
                disabled={!isOwner}
                onChange={(e) => setLat(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-mono disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Longitude Coordinates
              </label>
              <input
                type="text"
                value={lng}
                disabled={!isOwner}
                onChange={(e) => setLng(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-mono disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Delivery Radius, Timing & Pricing
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Delivery Radius (km)
              </label>
              <input
                type="number"
                step="0.1"
                value={deliveryRadiusKm}
                disabled={!isOwner}
                onChange={(e) => setDeliveryRadiusKm(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Average Prep Time (Minutes)
              </label>
              <input
                type="number"
                value={avgPrepMinutes}
                disabled={!isOwner}
                onChange={(e) => setAvgPrepMinutes(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Min Order Amount (₹)
              </label>
              <input
                type="text"
                value={minOrderStr}
                disabled={!isOwner}
                onChange={(e) => setMinOrderStr(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Base Delivery Fee (₹)
              </label>
              <input
                type="text"
                value={deliveryFeeStr}
                disabled={!isOwner}
                onChange={(e) => setDeliveryFeeStr(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Free Delivery Above (₹)
              </label>
              <input
                type="text"
                value={freeAboveStr}
                disabled={!isOwner}
                onChange={(e) => setFreeAboveStr(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Handling Fee (₹)
              </label>
              <input
                type="text"
                value={handlingFeeStr}
                disabled={!isOwner}
                onChange={(e) => setHandlingFeeStr(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Store Opens At (24h)
              </label>
              <input
                type="text"
                value={opensAt}
                disabled={!isOwner}
                placeholder="06:00"
                onChange={(e) => setOpensAt(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Store Closes At (24h)
              </label>
              <input
                type="text"
                value={closesAt}
                disabled={!isOwner}
                placeholder="23:30"
                onChange={(e) => setClosesAt(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
              />
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Save Configuration Changes</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
