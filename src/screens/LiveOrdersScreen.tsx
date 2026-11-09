import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import {
  Bell,
  Volume2,
  VolumeX,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  CookingPot,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Bike,
  RefreshCw,
} from "lucide-react";
import { orderApi } from "../api/order.service";
import { IOrder, OrderStatus } from "../types/domain";
import { useAuthStore, AuthState } from "../store/authStore";
import { useSoundStore } from "../store/soundStore";
import { playNewOrderBeep } from "../utils/sound";
import { formatRupees } from "../utils/money";
import { AcceptOrderModal } from "../components/orders/AcceptOrderModal";
import { RejectOrderModal } from "../components/orders/RejectOrderModal";
import { OrderDetailDrawer } from "../components/orders/OrderDetailDrawer";

const POLL_MS = 10000;
const URGENT_AFTER_MIN = 2;

/*
 * PERFORMANCE NOTES (this is the most-used screen, keep scrolling at 60fps):
 * - No box-shadows / rings / hover shadow transitions on cards: with 60+ cards they made
 *   Chrome repaint the whole column on every scroll frame (measured 55% janky frames at 4x CPU).
 * - Cards use `contain` + `content-visibility: auto` so off-screen cards are not painted.
 * - No infinite pulse animations on this page.
 * - Cards are memoised and polls that return identical data do not re-render the board.
 */
const CARD_STYLE: React.CSSProperties = {
  contain: "layout paint style",
  contentVisibility: "auto",
  containIntrinsicSize: "auto 220px",
};

type Tone = "rose" | "blue" | "amber" | "emerald";

/** Static class maps so Tailwind can see every class at build time. */
const TONES: Record<Tone, { column: string; header: string; dot: string; count: string; title: string }> = {
  rose: {
    column: "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-[#2a1a22]",
    header: "border-rose-200 dark:border-rose-900/50",
    dot: "bg-rose-500",
    count: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200",
    title: "text-rose-900 dark:text-rose-200",
  },
  blue: {
    column: "border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-[#18213a]",
    header: "border-blue-200 dark:border-blue-900/50",
    dot: "bg-blue-500",
    count: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200",
    title: "text-blue-900 dark:text-blue-200",
  },
  amber: {
    column: "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-[#2a2418]",
    header: "border-amber-200 dark:border-amber-900/50",
    dot: "bg-amber-500",
    count: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
    title: "text-amber-900 dark:text-amber-200",
  },
  emerald: {
    column: "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-[#15271f]",
    header: "border-emerald-200 dark:border-emerald-900/50",
    dot: "bg-emerald-500",
    count: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
    title: "text-emerald-900 dark:text-emerald-200",
  },
};

const minutesSince = (iso: string | undefined, now: number) =>
  iso ? Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000)) : 0;

/** 5 -> "5 min", 474 -> "7h 54m" */
const humanMinutes = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`);

const itemsSummary = (order: IOrder) => order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ");

const itemCount = (order: IOrder) => order.items.reduce((n, i) => n + i.quantity, 0);

/** Cheap fingerprint of a poll result, so identical polls don't re-render anything. */
const signature = (orders: IOrder[]) =>
  orders.map((o) => `${o._id}:${o.status}:${o.updatedAt}:${o.riderId ?? ""}`).join("|");

/* ------------------------------------------------------------------ */

interface ColumnProps {
  title: string;
  tone: Tone;
  count: number;
  emptyIcon: React.ReactNode;
  emptyText: string;
  children: React.ReactNode;
}

const Column: React.FC<ColumnProps> = ({ title, tone, count, emptyIcon, emptyText, children }) => {
  const t = TONES[tone];
  return (
    <section className={`flex min-h-0 flex-col rounded-xl border ${t.column} max-h-[75vh] xl:max-h-none`} aria-label={title}>
      <header className={`flex shrink-0 items-center justify-between border-b px-4 py-3 ${t.header}`}>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${t.dot}`} />
          <h2 className={`text-sm font-semibold ${t.title}`}>{title}</h2>
        </div>
        <span className={`min-w-[1.75rem] rounded-full px-2 py-0.5 text-center text-xs font-bold ${t.count}`}>
          {count}
        </span>
      </header>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3">
        {count === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-1.5 text-center text-xs text-text-muted">
            {emptyIcon}
            <span>{emptyText}</span>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
};

const CardShell: React.FC<{ urgent?: boolean; children: React.ReactNode }> = ({ urgent, children }) => (
  <article
    style={CARD_STYLE}
    className={`rounded-xl border bg-bg-card p-3.5 ${
      urgent ? "border-rose-400 dark:border-rose-500/70" : "border-border hover:border-gray-300 dark:hover:border-gray-600"
    }`}
  >
    {children}
  </article>
);

const CardHeader: React.FC<{ order: IOrder; meta: React.ReactNode; right?: React.ReactNode }> = ({ order, meta, right }) => (
  <div className="flex items-start justify-between gap-2">
    <div className="min-w-0">
      <p className="truncate font-mono text-xs font-bold text-text-primary">#{order.orderNumber}</p>
      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-text-muted">{meta}</div>
    </div>
    {right}
  </div>
);

const Amount: React.FC<{ order: IOrder }> = ({ order }) => (
  <span className="shrink-0 text-xs font-semibold text-text-primary">{formatRupees(order.totalAmount)}</span>
);

const CustomerLine: React.FC<{ order: IOrder; showAddress?: boolean }> = ({ order, showAddress }) => (
  <div className="mt-2.5 text-xs">
    <div className="flex items-center justify-between gap-2">
      <span className="truncate font-medium text-text-primary">{order.customer.name}</span>
      <a
        href={`tel:${order.customer.phone}`}
        className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-brand hover:underline"
      >
        <Phone className="h-3 w-3" />
        {order.customer.phone}
      </a>
    </div>
    {showAddress && (
      <p className="mt-0.5 line-clamp-1 text-[11px] text-text-muted" title={order.deliveryAddress.addressLine}>
        {order.deliveryAddress.addressLine}
      </p>
    )}
  </div>
);

const ItemsLine: React.FC<{ order: IOrder }> = ({ order }) => (
  <p className="mt-1 line-clamp-2 text-[11px] text-text-muted" title={itemsSummary(order)}>
    {itemsSummary(order)}
  </p>
);

const ItemsBox: React.FC<{ order: IOrder }> = ({ order }) => (
  <div className="mt-2 rounded-lg bg-bg-muted p-2">
    <p className="line-clamp-2 text-[11px] text-text-primary/80" title={itemsSummary(order)}>
      {itemsSummary(order)}
    </p>
    <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold">
      <span className="text-text-primary">{formatRupees(order.totalAmount)}</span>
      <span className="uppercase text-text-muted">
        {order.paymentMethod} · {order.paymentStatus}
      </span>
    </div>
  </div>
);

/** Who is delivering, so the counter knows whom to hand the bag to. */
const RiderLine: React.FC<{ order: IOrder }> = ({ order }) =>
  order.rider ? (
    <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] dark:border-emerald-900/60 dark:bg-emerald-950/30">
      <span
        className="flex min-w-0 items-center gap-1.5 text-emerald-800 dark:text-emerald-300"
        title={order.rider.vehicleNumber ? `${order.rider.name} · ${order.rider.vehicleNumber}` : order.rider.name}
      >
        <Bike className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate font-semibold">{order.rider.name}</span>
      </span>
      <a href={`tel:${order.rider.phone}`} className="shrink-0 font-medium text-emerald-700 hover:underline dark:text-emerald-400">
        Call
      </a>
    </div>
  ) : (
    <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-dashed border-border px-2 py-1.5 text-[11px] text-text-muted">
      <Bike className="h-3.5 w-3.5" />
      Waiting for a rider to accept
    </div>
  );

const ActionButton: React.FC<{
  onClick: () => void;
  loading?: boolean;
  className: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ onClick, loading, className, icon, children }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-white disabled:opacity-60 ${className}`}
  >
    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
    {children}
  </button>
);

const DetailsLink: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="mt-2 flex w-full items-center justify-center gap-1 text-[11px] font-medium text-text-muted hover:text-text-primary"
  >
    View details & slip
    <ChevronRight className="h-3 w-3" />
  </button>
);

/* ---------------- memoised cards (re-render only when their order/clock changes) ---------------- */

interface CardActions {
  onAccept: (o: IOrder) => void;
  onReject: (o: IOrder) => void;
  onDetails: (o: IOrder) => void;
  onStep: (o: IOrder, next: OrderStatus) => void;
}

interface CardProps {
  order: IOrder;
  /** Current time rounded to the minute: cards only re-render when the minute changes. */
  nowMinute: number;
  busy: boolean;
  actions: CardActions;
}

const NewOrderCard = memo<CardProps>(({ order, nowMinute, actions }) => {
  const elapsed = minutesSince(order.createdAt, nowMinute);
  const urgent = elapsed >= URGENT_AFTER_MIN;
  return (
    <CardShell urgent={urgent}>
      <CardHeader
        order={order}
        meta={
          urgent ? (
            <span className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-3 w-3" />
              Waiting {humanMinutes(elapsed)}
            </span>
          ) : (
            <>
              <Clock className="h-3 w-3" />
              {elapsed === 0 ? "just now" : `${elapsed} min ago`}
            </>
          )
        }
      />
      <CustomerLine order={order} showAddress />
      <ItemsBox order={order} />
      {order.notes && (
        <p className="mt-2 rounded bg-amber-50 p-1.5 text-[11px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          Note: {order.notes}
        </p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => actions.onReject(order)}
          className="flex items-center justify-center gap-1 rounded-lg border border-rose-300 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/50"
        >
          <XCircle className="h-3.5 w-3.5" />
          Reject
        </button>
        <button
          onClick={() => actions.onAccept(order)}
          className="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Accept
        </button>
      </div>
      <DetailsLink onClick={() => actions.onDetails(order)} />
    </CardShell>
  );
});

const AcceptedCard = memo<CardProps>(({ order, nowMinute, busy, actions }) => (
  <CardShell>
    <CardHeader
      order={order}
      meta={
        <>
          <Clock className="h-3 w-3" />
          Accepted {humanMinutes(minutesSince(order.acceptedAt || order.updatedAt, nowMinute))} ago
        </>
      }
      right={<Amount order={order} />}
    />
    <CustomerLine order={order} />
    <ItemsLine order={order} />
    <RiderLine order={order} />
    <ActionButton
      onClick={() => actions.onStep(order, "preparing")}
      loading={busy}
      className="bg-blue-600 hover:bg-blue-700"
      icon={<CookingPot className="h-3.5 w-3.5" />}
    >
      Start packing
    </ActionButton>
    <DetailsLink onClick={() => actions.onDetails(order)} />
  </CardShell>
));

const PackingCard = memo<CardProps>(({ order, busy, actions }) => (
  <CardShell>
    <CardHeader
      order={order}
      meta={
        <>
          <CookingPot className="h-3 w-3 text-amber-600" />
          {itemCount(order)} item{itemCount(order) === 1 ? "" : "s"} to pack
        </>
      }
      right={<Amount order={order} />}
    />
    <CustomerLine order={order} />
    <ItemsLine order={order} />
    <RiderLine order={order} />
    <ActionButton
      onClick={() => actions.onStep(order, "out_for_delivery")}
      loading={busy}
      className="bg-amber-600 hover:bg-amber-700"
      icon={<Truck className="h-3.5 w-3.5" />}
    >
      Handed to rider
    </ActionButton>
    <DetailsLink onClick={() => actions.onDetails(order)} />
  </CardShell>
));

const OutForDeliveryCard = memo<CardProps>(({ order, nowMinute, busy, actions }) => (
  <CardShell>
    <CardHeader
      order={order}
      meta={
        <>
          <Truck className="h-3 w-3 text-emerald-600" />
          {order.pickedUpAt ? `Picked up ${humanMinutes(minutesSince(order.pickedUpAt, nowMinute))} ago` : "On the way"}
        </>
      }
      right={<Amount order={order} />}
    />
    <CustomerLine order={order} showAddress />
    <RiderLine order={order} />
    <ActionButton
      onClick={() => actions.onStep(order, "delivered")}
      loading={busy}
      className="bg-emerald-600 hover:bg-emerald-700"
      icon={<CheckCircle2 className="h-3.5 w-3.5" />}
    >
      Mark delivered
    </ActionButton>
    <DetailsLink onClick={() => actions.onDetails(order)} />
  </CardShell>
));

/* ------------------------------------------------------------------ */

const currentMinute = () => Math.floor(Date.now() / 60000) * 60000;

export const LiveOrdersScreen: React.FC = () => {
  const activeStoreId = useAuthStore((state: AuthState) => state.activeStoreId);
  const { isMuted, toggleMute } = useSoundStore();

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [nowMinute, setNowMinute] = useState(currentMinute);

  const [selectedOrderForAccept, setSelectedOrderForAccept] = useState<IOrder | null>(null);
  const [selectedOrderForReject, setSelectedOrderForReject] = useState<IOrder | null>(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<IOrder | null>(null);

  const previousPlacedCountRef = useRef<number>(0);
  const lastSignatureRef = useRef<string>("");
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  // "x min ago" only needs minute precision; cards re-render once a minute, not every few seconds.
  useEffect(() => {
    const timer = setInterval(() => {
      const m = currentMinute();
      setNowMinute((prev) => (prev === m ? prev : m));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const fetchLiveOrders = useCallback(
    async (silent = false) => {
      if (!activeStoreId) return;
      if (!silent) setIsLoading(true);
      try {
        const res = await orderApi.getLiveOrders(activeStoreId);
        const placedCount = res.data.counts.placed || 0;
        const sig = signature(res.data.orders);
        if (sig !== lastSignatureRef.current) {
          lastSignatureRef.current = sig;
          setOrders(res.data.orders);
        }
        setLoadError(false);
        setLastUpdated(new Date());
        document.title = placedCount > 0 ? `(${placedCount}) Live Orders - Store Partner` : "Live Orders - Store Partner";
        if (placedCount > previousPlacedCountRef.current && !isMutedRef.current) {
          playNewOrderBeep();
        }
        previousPlacedCountRef.current = placedCount;
      } catch {
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [activeStoreId]
  );

  useEffect(() => {
    fetchLiveOrders();
    const interval = setInterval(() => {
      if (!document.hidden) fetchLiveOrders(true);
    }, POLL_MS);
    return () => {
      clearInterval(interval);
      document.title = "Store Partner";
    };
  }, [fetchLiveOrders]);

  // Stable callbacks so memoised cards don't re-render when the parent does.
  const actions = useMemo<CardActions>(
    () => ({
      onAccept: setSelectedOrderForAccept,
      onReject: setSelectedOrderForReject,
      onDetails: setSelectedOrderForDetail,
      onStep: async (order, nextStatus) => {
        setActionLoadingId(order._id);
        try {
          await orderApi.updateStatus(order._id, { status: nextStatus });
          await fetchLiveOrders(true);
        } finally {
          setActionLoadingId(null);
        }
      },
    }),
    [fetchLiveOrders]
  );

  const byStatus = useMemo(() => {
    const groups: Record<"placed" | "accepted" | "preparing" | "out_for_delivery", IOrder[]> = {
      placed: [],
      accepted: [],
      preparing: [],
      out_for_delivery: [],
    };
    for (const o of orders) {
      if (o.status in groups) groups[o.status as keyof typeof groups].push(o);
    }
    return groups;
  }, [orders]);

  const renderCards = (list: IOrder[], Card: React.ComponentType<CardProps>) =>
    list.map((order) => (
      <Card key={order._id} order={order} nowMinute={nowMinute} busy={actionLoadingId === order._id} actions={actions} />
    ));

  return (
    <div className="flex flex-col gap-4 xl:h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Live Orders</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
            <span className={`h-2 w-2 rounded-full ${loadError ? "bg-rose-500" : "bg-emerald-500"}`} />
            {loadError
              ? "Connection problem, retrying…"
              : lastUpdated
              ? `Auto-refreshing every ${POLL_MS / 1000}s · updated ${lastUpdated.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}`
              : "Loading orders…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLiveOrders(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={toggleMute}
            aria-pressed={!isMuted}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              isMuted
                ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
                : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
            }`}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            {isMuted ? "Sound off" : "Sound on"}
          </button>
        </div>
      </div>

      {isLoading && orders.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : (
        /* Board: on xl the four columns share the viewport height and scroll independently. */
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 xl:grid-rows-1">
          <Column
            title="New"
            tone="rose"
            count={byStatus.placed.length}
            emptyIcon={<Bell className="h-6 w-6 opacity-50" />}
            emptyText="No new orders"
          >
            {renderCards(byStatus.placed, NewOrderCard)}
          </Column>
          <Column
            title="Accepted"
            tone="blue"
            count={byStatus.accepted.length}
            emptyIcon={<Package className="h-6 w-6 opacity-50" />}
            emptyText="Nothing waiting to be packed"
          >
            {renderCards(byStatus.accepted, AcceptedCard)}
          </Column>
          <Column
            title="Packing"
            tone="amber"
            count={byStatus.preparing.length}
            emptyIcon={<CookingPot className="h-6 w-6 opacity-50" />}
            emptyText="No orders being packed"
          >
            {renderCards(byStatus.preparing, PackingCard)}
          </Column>
          <Column
            title="Out for delivery"
            tone="emerald"
            count={byStatus.out_for_delivery.length}
            emptyIcon={<Truck className="h-6 w-6 opacity-50" />}
            emptyText="No orders on the road"
          >
            {renderCards(byStatus.out_for_delivery, OutForDeliveryCard)}
          </Column>
        </div>
      )}

      <AcceptOrderModal
        isOpen={Boolean(selectedOrderForAccept)}
        onClose={() => setSelectedOrderForAccept(null)}
        order={selectedOrderForAccept}
        onSuccess={() => fetchLiveOrders(true)}
      />
      <RejectOrderModal
        isOpen={Boolean(selectedOrderForReject)}
        onClose={() => setSelectedOrderForReject(null)}
        order={selectedOrderForReject}
        onSuccess={() => fetchLiveOrders(true)}
      />
      <OrderDetailDrawer
        isOpen={Boolean(selectedOrderForDetail)}
        onClose={() => setSelectedOrderForDetail(null)}
        order={selectedOrderForDetail}
        onOrderUpdated={(updated) => {
          if (updated) setSelectedOrderForDetail(updated);
          fetchLiveOrders(true);
        }}
      />
    </div>
  );
};
