import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Building2, LogOut, ShieldAlert, Menu, Loader2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/utils";

const nav = [
  { to: "/admin", label: "Overview", icon: LayoutGrid },
  { to: "/admin/businesses", label: "Businesses", icon: Building2 },
];

function AdminSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-200">
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
        <div className="grid size-10 place-items-center rounded-xl bg-red-500/15 text-red-400">
          <ShieldAlert className="size-5" />
        </div>
        <div>
          <div className="text-lg font-bold leading-tight text-white">SuuqBook</div>
          <div className="text-[11px] text-slate-400">Platform Admin</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/admin" && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-red-500/15 text-red-300" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="size-4.5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full bg-white/10 text-sm font-semibold text-white">
            {initials(profile?.full_name || "?")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{profile?.full_name || "..."}</div>
            <div className="truncate text-xs text-slate-400">Super Admin</div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
            className="text-slate-400 hover:text-white"
            aria-label="Sign out"
            type="button"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { loading, session, role } = useAuth();
  const navigate = useNavigate();

  const blocked = loading || !session || role !== "super_admin";

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/" });
      return;
    }
    if (role !== "super_admin") {
      navigate({ to: "/dashboard" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session, role]);

  if (blocked) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950">
        <Loader2 className="size-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <AdminSidebarContent />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="default" size="icon" className="lg:hidden bg-slate-950 hover:bg-slate-900" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-0 p-0">
                <AdminSidebarContent onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold text-foreground sm:text-xl">{title}</h1>
              {subtitle ? <p className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p> : null}
            </div>

            {actions}
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
