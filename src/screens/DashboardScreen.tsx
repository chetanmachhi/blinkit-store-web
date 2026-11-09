import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  IndianRupee,
  AlertTriangle,
  Receipt,
  Download,
  Loader2,
  Package,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LabelList,
  TooltipProps,
} from "recharts";
import dayjs from "dayjs";
import { dashboardApi, ISalesReportItem, ICategorySalesItem } from "../api/dashboard.service";
import { IDashboardData } from "../types/domain";
import { useAuthStore, AuthState } from "../store/authStore";
import { formatRupeesShort, paiseToRupeeString } from "../utils/money";
import { exportToCsv } from "../utils/exportCsv";
import { PageHeader } from "../components/common/PageHeader";

type Range = "today" | "7d" | "30d";

const RANGES: { key: Range; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
];

/** Same colours as the status badges used across the app. */
const STATUS_META: Record<string, { label: string; color: string }> = {
  placed: { label: "New", color: "#3B82F6" },
  accepted: { label: "Accepted", color: "#F59E0B" },
  preparing: { label: "Packing", color: "#8B5CF6" },
  out_for_delivery: { label: "Out for delivery", color: "#6366F1" },
  delivered: { label: "Delivered", color: "#0E9F6E" },
  cancelled: { label: "Cancelled", color: "#E5484D" },
};

const BRAND = "#0E9F6E";
const inr = (n: number) => Math.round(n).toLocaleString("en-IN");

/* ---------------- shared chart pieces (theme-aware) ---------------- */

/**
 * Recharts' default tooltip inherits colours that disappear on a dark box.
 * This one uses the app's theme tokens, so it reads correctly in light and dark mode.
 */
const ChartTooltip: React.FC<
  TooltipProps<number, string> & { formatLabel?: (l: string) => string; rows: (p: any) => [string, string][] }
> = ({ active, payload, label, formatLabel, rows }) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-bg-card px-3 py-2 text-xs shadow-lg">
      {label !== undefined && (
        <p className="mb-1 font-semibold text-text-primary">{formatLabel ? formatLabel(String(label)) : label}</p>
      )}
      {rows(entry).map(([k, v]) => (
        <p key={k} className="flex items-center justify-between gap-4 text-text-muted">
          <span>{k}</span>
          <span className="font-semibold text-text-primary">{v}</span>
        </p>
      ))}
    </div>
  );
};

/** Axis text and grid use currentColor, so the wrapper's text colour themes them. */
const axisTick = { fill: "currentColor", fontSize: 11 };

const Card: React.FC<{ title: string; subtitle?: string; className?: string; children: React.ReactNode; action?: React.ReactNode }> = ({
  title,
  subtitle,
  className = "",
  children,
  action,
}) => (
  <section className={`rounded-xl border border-border bg-bg-card p-5 shadow-sm ${className}`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-bold text-text-primary">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
    <div className="mt-4">{children}</div>
  </section>
);

const EmptyChart: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-xs text-text-muted">
    {text}
  </div>
);

/** "+12% vs yesterday" with sensible handling when yesterday was zero. */
const Delta: React.FC<{ today: number; yesterday: number }> = ({ today, yesterday }) => {
  if (yesterday === 0) {
    return <span className="text-text-muted">{today > 0 ? "No sales yesterday" : "No sales yesterday or today"}</span>;
  }
  const pct = ((today - yesterday) / yesterday) * 100;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 font-semibold ${up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
      {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {up ? "+" : ""}
      {pct.toFixed(0)}%
      <span className="ml-1 font-normal text-text-muted">today vs yesterday</span>
    </span>
  );
};

const Kpi: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
  iconClass: string;
  footer: React.ReactNode;
  valueClass?: string;
}> = ({ label, value, icon, iconClass, footer, valueClass = "text-text-primary" }) => (
  <div className="rounded-xl border border-border bg-bg-card p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <span className={`rounded-lg p-2 ${iconClass}`}>{icon}</span>
    </div>
    <p className={`mt-2 text-2xl font-bold tracking-tight ${valueClass}`}>{value}</p>
    <div className="mt-2 text-xs">{footer}</div>
  </div>
);

/* ---------------- data helpers ---------------- */

/** Fill missing days/hours with zeroes so the trend line doesn't skip gaps. */
const buildTrend = (range: Range, items: ISalesReportItem[]) => {
  const byKey = new Map(items.map((i) => [i.date, i]));
  const points: { key: string; label: string; revenue: number; orders: number }[] = [];
  if (range === "today") {
    const now = dayjs();
    for (let h = 0; h <= now.hour(); h++) {
      const key = `${now.format("YYYY-MM-DD")} ${String(h).padStart(2, "0")}`;
      const it = byKey.get(key);
      points.push({
        key,
        label: dayjs().hour(h).format("h A"),
        revenue: Math.round((it?.revenue || 0) / 100),
        orders: it?.ordersCount ?? (it as any)?.orders ?? 0,
      });
    }
  } else {
    const days = range === "7d" ? 7 : 30;
    for (let d = days; d >= 0; d--) {
      const date = dayjs().subtract(d, "day");
      const key = date.format("YYYY-MM-DD");
      const it = byKey.get(key);
      points.push({
        key,
        label: date.format("DD MMM"),
        revenue: Math.round((it?.revenue || 0) / 100),
        orders: it?.ordersCount ?? (it as any)?.orders ?? 0,
      });
    }
  }
  return points;
};

/* ---------------- screen ---------------- */

export const DashboardScreen: React.FC = () => {
  const activeStoreId = useAuthStore((state: AuthState) => state.activeStoreId);
  const [range, setRange] = useState<Range>("7d");
  const [dashboardData, setDashboardData] = useState<IDashboardData | null>(null);
  const [salesReport, setSalesReport] = useState<ISalesReportItem[]>([]);
  const [categorySales, setCategorySales] = useState<ICategorySalesItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!activeStoreId) return;
    let cancelled = false;
    setIsLoading(true);
    Promise.all([
      dashboardApi.getDashboard(activeStoreId, range),
      dashboardApi.getSalesReport(activeStoreId, range, range === "today" ? "hour" : "day"),
      dashboardApi.getCategorySales(activeStoreId, range),
    ])
      .then(([dash, sales, cats]: any[]) => {
        if (cancelled) return;
        setDashboardData(dash?.data || dash || null);
        setSalesReport(sales?.data || (Array.isArray(sales) ? sales : []));
        setCategorySales(cats?.data || (Array.isArray(cats) ? cats : []));
        setLoadError(false);
      })
      .catch(() => !cancelled && setLoadError(true))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [activeStoreId, range]);

  const trend = useMemo(() => buildTrend(range, salesReport), [range, salesReport]);
  // Nothing delivered yet (e.g. early in the day) but orders are coming in: chart orders instead of a flat ₹0 line.
  const trendMetric: "revenue" | "orders" =
    trend.some((p) => p.revenue > 0) || !trend.some((p) => p.orders > 0) ? "revenue" : "orders";

  const statusData = useMemo(
    () =>
      Object.entries(dashboardData?.ordersByStatus || {})
        .map(([status, count]) => ({
          status,
          name: STATUS_META[status]?.label || status,
          value: count as number,
          color: STATUS_META[status]?.color || "#9CA3AF",
        }))
        .filter((d) => d.value > 0),
    [dashboardData]
  );
  const statusTotal = statusData.reduce((s, d) => s + d.value, 0);

  const categoryData = useMemo(
    () =>
      (categorySales || [])
        .map((c) => ({
          name: c.name || (c as any).categoryName || "Other",
          value: Math.round((c.revenue || 0) / 100),
        }))
        .filter((c) => c.value > 0)
        .sort((a, b) => b.value - a.value),
    [categorySales]
  );

  const handleExport = () => {
    exportToCsv(
      `store_analytics_${range}.csv`,
      salesReport.map((s) => ({
        Date: s.date,
        Orders: s.ordersCount,
        DeliveredRevenueRupees: paiseToRupeeString(s.revenue),
      }))
    );
  };

  const rangeControls = (
    <>
      <div className="inline-flex rounded-lg border border-border bg-bg-card p-1" role="tablist" aria-label="Date range">
        {RANGES.map((r) => (
          <button
            key={r.key}
            role="tab"
            aria-selected={range === r.key}
            onClick={() => setRange(r.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              range === r.key ? "bg-brand text-white shadow-sm" : "text-text-muted hover:text-text-primary"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <button
        onClick={handleExport}
        disabled={!salesReport.length}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-2 text-xs font-semibold text-text-primary hover:bg-bg-muted disabled:opacity-40"
      >
        <Download className="h-3.5 w-3.5" />
        Export CSV
      </button>
    </>
  );

  const header = (
    <PageHeader title="Analytics" description="Revenue counts delivered orders only. Order counts include every status.">
      {rangeControls}
    </PageHeader>
  );

  if (isLoading && !dashboardData) {
    return (
      <div>
        {header}
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </div>
    );
  }

  if (loadError || !dashboardData) {
    return (
      <div>
        {header}
        <EmptyChart text="Could not load analytics. Check that the backend is running, then refresh." />
      </div>
    );
  }

  const { metrics, deltas, topProducts } = dashboardData;
  const maxProductRevenue = Math.max(1, ...topProducts.map((p) => p.revenue));
  const rangeLabel = range === "today" ? "today" : range === "7d" ? "in the last 7 days" : "in the last 30 days";

  return (
    <div className={`space-y-6 transition-opacity ${isLoading ? "opacity-60" : ""}`}>
      {header}

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Revenue (delivered)"
          value={formatRupeesShort(metrics.revenue)}
          icon={<IndianRupee className="h-4 w-4" />}
          iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
          footer={<Delta today={deltas.todayRevenue} yesterday={deltas.yesterdayRevenue} />}
        />
        <Kpi
          label="Orders"
          value={inr(metrics.totalOrders)}
          icon={<ShoppingBag className="h-4 w-4" />}
          iconClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
          footer={<Delta today={deltas.todayOrders} yesterday={deltas.yesterdayOrders} />}
        />
        <Kpi
          label="Average order value"
          value={formatRupeesShort(metrics.averageOrderValue)}
          icon={<Receipt className="h-4 w-4" />}
          iconClass="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
          footer={
            <span className="text-text-muted">
              {inr(metrics.deliveredOrders)} delivered ·{" "}
              <span className="font-semibold text-rose-600 dark:text-rose-400">{metrics.cancellationRate.toFixed(1)}%</span>{" "}
              cancelled · {inr(metrics.newCustomers)} new customers
            </span>
          }
        />
        <Kpi
          label="Low stock"
          value={`${metrics.lowStockCount} ${metrics.lowStockCount === 1 ? "product" : "products"}`}
          valueClass={metrics.lowStockCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-text-primary"}
          icon={<AlertTriangle className="h-4 w-4" />}
          iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
          footer={
            metrics.lowStockCount > 0 ? (
              <Link to="/products" className="inline-flex items-center gap-0.5 font-semibold text-brand hover:underline">
                Review stock <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="text-text-muted">All products above their threshold</span>
            )
          }
        />
      </div>

      {/* Trend + status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title={trendMetric === "revenue" ? "Revenue trend" : "Orders trend"}
          subtitle={
            trendMetric === "revenue"
              ? `Delivered revenue ${range === "today" ? "by hour" : "by day"}, ${formatRupeesShort(metrics.revenue)} ${rangeLabel}`
              : `Orders ${range === "today" ? "by hour" : "by day"}. No delivered revenue ${rangeLabel} yet`
          }
        >
          {trend.every((p) => p.revenue === 0 && p.orders === 0) ? (
            <EmptyChart text={`No orders ${rangeLabel} yet.`} />
          ) : (
            <div className="h-64 w-full text-text-muted">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.12} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={axisTick}
                    stroke="currentColor"
                    strokeOpacity={0.3}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={16}
                  />
                  <YAxis
                    tick={axisTick}
                    stroke="currentColor"
                    strokeOpacity={0.3}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    allowDecimals={false}
                    tickFormatter={(v) => (trendMetric === "revenue" ? `₹${inr(v)}` : inr(v))}
                  />
                  <Tooltip
                    cursor={{ stroke: BRAND, strokeOpacity: 0.4 }}
                    content={
                      <ChartTooltip
                        rows={(p) => [
                          ["Revenue", `₹${inr(p.revenue)}`],
                          ["Orders", String(p.orders)],
                        ]}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey={trendMetric}
                    stroke={BRAND}
                    strokeWidth={2}
                    fill="url(#revFill)"
                    dot={trend.length <= 10 ? { r: 3, fill: BRAND } : false}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Orders by status" subtitle={`${inr(statusTotal)} orders ${rangeLabel}`}>
          {statusTotal === 0 ? (
            <EmptyChart text="No orders in this period." />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-44 w-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="62%"
                      outerRadius="100%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {statusData.map((d) => (
                        <Cell key={d.status} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={
                        <ChartTooltip
                          rows={(p) => [[p.name, `${p.value} (${((p.value / statusTotal) * 100).toFixed(0)}%)`]]}
                        />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-text-primary">{inr(statusTotal)}</span>
                  <span className="text-[11px] text-text-muted">orders</span>
                </div>
              </div>
              <ul className="w-full space-y-1.5 text-xs">
                {statusData.map((d) => (
                  <li key={d.status} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-text-primary">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="tabular-nums text-text-muted">
                      <span className="font-semibold text-text-primary">{d.value}</span> ·{" "}
                      {((d.value / statusTotal) * 100).toFixed(0)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      {/* Products + categories */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Top products" subtitle={`By delivered revenue ${rangeLabel}`}>
          {topProducts.length === 0 ? (
            <EmptyChart text="No product sales in this period." />
          ) : (
            <ol className="space-y-3">
              {topProducts.map((p, i) => (
                <li key={p.productId || i} className="flex items-center gap-3 text-xs">
                  <span className="w-5 text-right font-mono font-bold text-text-muted">{i + 1}</span>
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-bg-muted">
                    <Package className="h-4 w-4 text-text-muted/50" />
                    {p.imageUrl && (
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold text-text-primary" title={p.name}>
                        {p.name}
                      </span>
                      <span className="shrink-0 font-bold text-text-primary">{formatRupeesShort(p.revenue)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-muted">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${(p.revenue / maxProductRevenue) * 100}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[11px] text-text-muted">{p.quantity} sold</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Revenue by category" subtitle={`Delivered revenue ${rangeLabel}`}>
          {categoryData.length === 0 ? (
            <EmptyChart text="No category sales in this period." />
          ) : (
            <div className="w-full text-text-muted" style={{ height: Math.max(160, categoryData.length * 40) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 64, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.12} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={axisTick}
                    width={150}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                  />
                  <Tooltip
                    cursor={{ fill: "currentColor", fillOpacity: 0.06 }}
                    content={<ChartTooltip rows={(p) => [["Revenue", `₹${inr(p.value)}`]]} />}
                  />
                  <Bar dataKey="value" fill={BRAND} radius={[0, 4, 4, 0]} barSize={22}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      formatter={(v: number) => `₹${inr(v)}`}
                      style={{ fill: "currentColor", fontSize: 11, fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
