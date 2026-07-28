import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, CheckCircle2, Clock, XCircle, Loader2, ArrowRight, Users2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { StatCard } from "@/components/stat-card";
import { initials } from "@/lib/utils";
import { useAdminBusinesses } from "@/lib/hooks/use-admin";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Overview — SuuqBook" },
      { name: "description", content: "Platform-wide overview of every business on SuuqBook." },
    ],
  }),
  component: AdminOverview,
});

function AdminOverview() {
  const { data: businesses = [], isLoading } = useAdminBusinesses();

  const active = businesses.filter((b) => b.subscription?.status === "active").length;
  const trialing = businesses.filter((b) => b.subscription?.status === "trial").length;
  const expired = businesses.filter((b) => b.subscription?.status === "expired").length;
  const totalEmployees = businesses.reduce((a, b) => a + b.employeeCount, 0);
  const recent = businesses.slice(0, 5);

  return (
    <AdminShell title="Overview" subtitle="Platform-wide snapshot across every business">
      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Businesses" value={String(businesses.length)} icon={Building2} tone="blue" />
            <StatCard label="Active Subscriptions" value={String(active)} icon={CheckCircle2} tone="green" />
            <StatCard label="On Trial" value={String(trialing)} icon={Clock} tone="amber" />
            <StatCard label="Expired" value={String(expired)} icon={XCircle} tone="rose" />
          </div>

          <div className="card-elevated mt-5 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="text-base font-semibold">Recent Signups</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Users2 className="size-3.5" /> {totalEmployees} employees across the platform
                </p>
              </div>
              <Link to="/admin/businesses">
                <Button variant="outline" size="sm" className="gap-1.5">
                  View all businesses <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No businesses have signed up yet.</div>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((b) => (
                  <li key={b.id} className="flex items-center gap-4 p-4">
                    <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
                      {initials(b.business_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{b.business_name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {b.owner_name} · joined {new Date(b.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xs capitalize text-muted-foreground">
                      {b.subscription?.status ?? "no subscription"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </AdminShell>
  );
}
