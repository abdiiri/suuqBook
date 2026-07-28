import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  Wallet,
  Package,
  Boxes,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Clock,
  Phone,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ksh } from "@/lib/utils";
import { useDashboardStats } from "@/lib/hooks/use-reports";
import { useSubscription } from "@/lib/hooks/use-subscription";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from "@/lib/constants";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SuuqBook" },
      { name: "description", content: "Live overview of today's sales, profit, stock and low stock alerts for your shop." },
      { property: "og:title", content: "SuuqBook Dashboard" },
      { property: "og:description", content: "Live overview of today's sales, profit and stock." },
    ],
  }),
  component: Dashboard,
});

function daysLeft(dateStr: string | null | undefined) {
  if (!dateStr) return 0;
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
}

function Dashboard() {
  const { data, isLoading } = useDashboardStats();
  const { data: sub } = useSubscription();
  const trialDaysLeft = sub?.status === "trial" ? daysLeft(sub.trial_ends_at) : null;
  const showTrialBanner = trialDaysLeft !== null && trialDaysLeft <= 3;

  return (
    <AppShell title="Dashboard" subtitle="Today's overview of your business">
      {showTrialBanner && (
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-200 text-amber-700">
              <Clock className="size-4.5" />
            </div>
            <p className="text-sm font-medium text-amber-900">
              {trialDaysLeft === 0
                ? "Your free trial ends today."
                : `Your free trial ends in ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"}.`}{" "}
              Call or WhatsApp {SUPPORT_PHONE_DISPLAY} to keep everything running.
            </p>
          </div>
          <a href={`tel:${SUPPORT_PHONE_TEL}`} className="shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5 border-amber-400 bg-white text-amber-900 hover:bg-amber-100">
              <Phone className="size-3.5" /> Call now
            </Button>
          </a>
        </div>
      )}
      {isLoading || !data ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Today's Sales" value={ksh(data.stats.todaysSales)} icon={TrendingUp} tone="blue" />
            <StatCard label="Today's Profit" value={ksh(data.stats.todaysProfit)} icon={Wallet} tone="green" />
            <StatCard label="Amount Owed to You" value={ksh(data.stats.amountOwed)} icon={Package} tone="amber" />
            <StatCard label="Stock Value" value={ksh(data.stats.stockValue)} icon={Boxes} tone="purple" />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="card-elevated p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Sales — Last 7 Days</h2>
              </div>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.salesChart} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}K`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [ksh(v), "Sales"]}
                    />
                    <Area type="monotone" dataKey="sales" stroke="var(--color-primary)" fill="url(#salesFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-elevated p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Low Stock Alerts</h2>
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                  {data.stats.lowStockCount}
                </span>
              </div>
              <ul className="mt-4 space-y-3">
                {data.lowStockItems.length === 0 && (
                  <li className="text-sm text-muted-foreground">Nothing is low on stock right now.</li>
                )}
                {data.lowStockItems.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
                      <AlertTriangle className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.stock} left · reorder at {p.low_stock_threshold}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <Link to="/products" className="mt-4 flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline">
                View all products <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="card-elevated overflow-hidden lg:col-span-2">
              <div className="flex items-center justify-between border-b border-border p-5">
                <h2 className="text-base font-semibold">Recent Sales</h2>
                <Link to="/sales" className="text-xs font-medium text-primary hover:underline">View all</Link>
              </div>
              <ul className="divide-y divide-border">
                {data.recentSales.length === 0 && (
                  <li className="p-5 text-sm text-muted-foreground">No sales recorded yet — go to Sales to add one.</li>
                )}
                {data.recentSales.map((s) => (
                  <li key={s.id} className="flex items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{s.product}</div>
                      <div className="text-xs text-muted-foreground">Qty {s.qty} · {s.time}</div>
                    </div>
                    <div className="text-sm font-semibold">{ksh(s.total)}</div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-elevated p-5">
              <h2 className="text-base font-semibold">Top Selling (30 days)</h2>
              <ul className="mt-4 space-y-4">
                {data.topSelling.length === 0 && (
                  <li className="text-sm text-muted-foreground">No sales in the last 30 days yet.</li>
                )}
                {data.topSelling.map((t) => (
                  <li key={t.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-muted-foreground">{t.sold} sold</span>
                    </div>
                    <Progress value={t.pct} className="mt-1.5 h-1.5" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
