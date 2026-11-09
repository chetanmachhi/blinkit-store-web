import React, { useEffect, useState } from "react";
import { Bike, Loader2, Phone, UserPlus } from "lucide-react";
import { IOrder } from "../../types/domain";
import { IStoreRider, riderApi } from "../../api/order.service";

interface Props {
  order: IOrder;
  onAssigned: (order: IOrder) => void;
  /** Compact variant for the drawer */
  compact?: boolean;
}

/** Statuses in which the store may (re)assign a rider: before pickup, or on the road without one. */
const canAssign = (o: IOrder) =>
  o.status === "accepted" ||
  o.status === "preparing" ||
  (o.status === "out_for_delivery" && !o.riderId);

/**
 * Shows the delivery partner for an order and lets the store assign or change it.
 * Riders can also accept orders themselves from the delivery app.
 */
export const RiderAssignCard: React.FC<Props> = ({ order, onAssigned, compact }) => {
  const [riders, setRiders] = useState<IStoreRider[] | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);

  const assignable = canAssign(order);

  useEffect(() => {
    if (!isPicking || riders) return;
    riderApi
      .list()
      .then((list) => {
        setRiders(list);
        const firstOnline = list.find((r) => r.isOnline && r.id !== order.riderId);
        setSelectedId(firstOnline?.id || list[0]?.id || "");
      })
      .catch(() => setRiders([]));
  }, [isPicking, riders, order.riderId]);

  const assign = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const updated = await riderApi.assign(order._id, selectedId);
      onAssigned(updated);
      setIsPicking(false);
    } finally {
      setSaving(false);
    }
  };

  const wrapper = compact
    ? "rounded-lg border border-border p-3"
    : "rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800";

  return (
    <div className={wrapper}>
      <div className="flex items-center justify-between">
        <h2 className={`${compact ? "text-xs" : "text-sm"} font-bold text-text-primary`}>Delivery partner</h2>
        {order.rider && assignable && !isPicking && (
          <button onClick={() => setIsPicking(true)} className="text-xs font-semibold text-brand hover:underline">
            Change
          </button>
        )}
      </div>

      {order.rider ? (
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Bike className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 text-xs">
            <p className="truncate font-semibold text-text-primary">{order.rider.name}</p>
            <p className="truncate text-text-muted">
              {order.rider.vehicleNumber || "Vehicle not set"}
              {order.pickedUpAt ? " · picked up" : " · heading to store"}
            </p>
          </div>
          <a
            href={`tel:${order.rider.phone}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-brand hover:bg-bg-muted"
          >
            <Phone className="h-3.5 w-3.5" />
            Call
          </a>
        </div>
      ) : (
        !isPicking && (
          <div className="mt-3 text-xs">
            <p className="text-text-muted">
              {assignable
                ? "No rider yet. Riders can accept this order from the delivery app, or assign one now."
                : order.status === "placed"
                ? "Accept the order first, then a rider can be assigned."
                : "No rider was assigned to this order."}
            </p>
            {assignable && (
              <button
                onClick={() => setIsPicking(true)}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand py-2 text-xs font-semibold text-white hover:bg-brand-hover"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Assign rider
              </button>
            )}
          </div>
        )
      )}

      {isPicking && (
        <div className="mt-3 space-y-2 text-xs">
          {riders === null ? (
            <div className="flex items-center gap-2 text-text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading riders…
            </div>
          ) : riders.length === 0 ? (
            <p className="text-text-muted">No rider accounts exist yet.</p>
          ) : (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-xs text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {riders.map((r) => (
                <option key={r.id} value={r.id} disabled={r.id === order.riderId}>
                  {r.name} · {r.isOnline ? "online" : "offline"} · {r.activeOrders} active
                  {r.id === order.riderId ? " (current)" : ""}
                </option>
              ))}
            </select>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setIsPicking(false)}
              className="flex-1 rounded-lg border border-border py-2 font-semibold text-text-primary hover:bg-bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={assign}
              disabled={!selectedId || saving || !riders?.length}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand py-2 font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Assign
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
