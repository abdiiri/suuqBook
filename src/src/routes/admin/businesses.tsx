import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Users2, Package, Loader2, MoreVertical, ShieldPlus, ShieldMinus, Clock, CheckCircle2, XCircle } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { initials } from "@/lib/utils";
import { useAdminBusinesses, useUpdateSubscriptionAdmin, type AdminBusiness } from "@/lib/hooks/use-admin";
import { useQueryClient } from "@tanstack/react-query";
import { setSuperAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/businesses")({
  head: () => ({
    meta: [
      { title: "Businesses — SuuqBook Admin" },
      { name: "description", content: "Manage every business, subscription and admin account on the platform." },
    ],
  }),
  component: BusinessesPage,
});

function statusBadge(business: AdminBusiness) {
  const sub = business.subscription;
  if (!sub) return <Badge variant="outline" className="border-muted-foreground/40 text-muted-foreground">No subscription</Badge>;
  if (sub.status === "active") {
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="mr-1 size-3" /> Active</Badge>;
  }
  if (sub.status === "expired") {
    return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10"><XCircle className="mr-1 size-3" /> Expired</Badge>;
  }
  const daysLeft = Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86400000));
  return (
    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
      <Clock className="mr-1 size-3" /> Trial · {daysLeft}d left
    </Badge>
  );
}

function BusinessesPage() {
  const { data: businesses = [], isLoading } = useAdminBusinesses();
  const updateSub = useUpdateSubscriptionAdmin();
  const qc = useQueryClient();

  const [confirmTarget, setConfirmTarget] = useState<{ business: AdminBusiness; grant: boolean } | null>(null);
  const [promoting, setPromoting] = useState(false);

  async function handleExtend(business: AdminBusiness, days: number) {
    try {
      await updateSub.mutateAsync({ ownerId: business.id, status: "trial", extendDays: days });
      toast.success(`Extended ${business.business_name}'s trial by ${days} days`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update subscription");
    }
  }

  async function handleSetStatus(business: AdminBusiness, status: "active" | "expired") {
    try {
      await updateSub.mutateAsync({ ownerId: business.id, status });
      toast.success(`${business.business_name} marked as ${status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update subscription");
    }
  }

  async function handleConfirmAdminChange() {
    if (!confirmTarget) return;
    setPromoting(true);
    try {
      await setSuperAdmin({ data: { targetUserId: confirmTarget.business.id, grant: confirmTarget.grant } });
      toast.success(
        confirmTarget.grant
          ? `${confirmTarget.business.owner_name} is now a super admin`
          : `${confirmTarget.business.owner_name}'s super admin access was removed`,
      );
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update admin access");
    } finally {
      setPromoting(false);
      setConfirmTarget(null);
    }
  }

  return (
    <AdminShell title="Businesses" subtitle={`${businesses.length} businesses on the platform`}>
      <div className="card-elevated overflow-hidden">
        {isLoading ? (
          <div className="grid h-40 place-items-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : businesses.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No businesses have signed up yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {businesses.map((b) => (
              <li key={b.id} className="flex items-center gap-4 p-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
                  {initials(b.business_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{b.business_name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {b.owner_name} · {b.phone || "no phone"} · joined {new Date(b.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                  <Users2 className="size-3.5" /> {b.employeeCount}
                </div>
                <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                  <Package className="size-3.5" /> {b.productCount}
                </div>
                {statusBadge(b)}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Actions">
                      <MoreVertical className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExtend(b, 7)}>Extend trial 7 days</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExtend(b, 30)}>Extend trial 30 days</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSetStatus(b, "active")}>Mark subscription active</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSetStatus(b, "expired")}>Mark subscription expired</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setConfirmTarget({ business: b, grant: true })}>
                      <ShieldPlus className="mr-2 size-4" /> Make super admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setConfirmTarget({ business: b, grant: false })}>
                      <ShieldMinus className="mr-2 size-4" /> Remove super admin access
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog open={!!confirmTarget} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmTarget?.grant ? "Grant super admin access?" : "Remove super admin access?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget?.grant
                ? `${confirmTarget?.business.owner_name} will be able to see and manage every business on the platform, not just their own.`
                : `${confirmTarget?.business.owner_name} will lose platform-wide admin access.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAdminChange} disabled={promoting}>
              {promoting ? <Loader2 className="size-4 animate-spin" /> : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
