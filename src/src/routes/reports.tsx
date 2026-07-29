import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ksh } from "@/lib/utils";
import { useMonthlyReport } from "@/lib/hooks/use-reports";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — SuuqBook" },
      { name: "description", content: "Sales, profit and stock reports." },
      { property: "og:title", content: "SuuqBook Reports" },
      { property: "og:description", content: "Sales, profit and inventory reports." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data, isLoading } = useMonthlyReport();

  return (
    <AppShell title="Reports" subtitle="Analyze sales, profit and stock" allowRoles={["business_owner"]}>
      {isLoading || !data ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card-elevated p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Monthly Revenue</h2>
              <span className="text-xs text-muted-foreground">Last 8 months</span>
            </div>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
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
                  <Bar dataKey="sales" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-elevated p-5">
            <h2 className="text-base font-semibold">This Month Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Total Sales", ksh(data.summary.totalSales)],
                ["Total Profit", ksh(data.summary.totalProfit)],
                ["Total Purchases", ksh(data.summary.totalPurchases)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg bg-primary/10 p-3">
                <dt className="font-semibold text-primary">Net Profit</dt>
                <dd className="text-lg font-bold text-primary">{ksh(data.summary.netProfit)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              Profit is estimated using each product's current buy price. PDF/Excel export is coming soon.
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
