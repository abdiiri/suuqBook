import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users2,
  UserCog,
  BarChart3,
  CreditCard,
  Settings,
  Bell,
  Store,
  Menu,
  LogOut,
  ShoppingBag,
  Loader2,
  Phone,
  MessageCircle,
  ShieldOff,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth, type AppRole } from "@/lib/auth";
import { useSubscription } from "@/lib/hooks/use-subscription";
import { initials } from "@/lib/utils";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL, SUPPORT_WHATSAPP_URL } from "@/lib/constants";

const nav: { to: string; label: string; icon: typeof LayoutDashboard; roles: AppRole[] }[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["business_owner", "employee"] },
  { to: "/products", label: "Products", icon: Package, roles: ["business_owner", "employee"] },
  { to: "/sales", label: "Sales", icon: ShoppingCart, roles: ["business_owner", "employee"] },
  { to: "/purchases", label: "Purchases", icon: ShoppingBag, roles: ["business_owner"] },
  { to: "/suppliers", label: "Suppliers", icon: Truck, roles: ["business_owner"] },
  { to: "/customers", label: "Customers", icon: Users2, roles: ["business_owner", "employee"] },
  { to: "/users", label: "Users", icon: UserCog, roles: ["business_owner"] },
  { to: "/reports", label: "Reports", icon: BarChart3, roles: ["business_owner"] },
  { to: "/subscriptions", label: "Subscriptions", icon: CreditCard, roles: ["business_owner"] },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["business_owner"] },
];

const roleLabel: Record<AppRole, string> = {
  super_admin: "Super Admin",
  business_owner: "Business Owner",
  employee: "Employee",
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, role, signOut } = useAuth();
  const nav_ = useNavigate();
  const items = nav.filter((item) => role && item.roles.includes(role));

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
        <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md">
          <ShoppingBag className="size-5" />
        </div>
        <div>
          <div className="text-lg font-bold leading-tight text-white">SuuqBook</div>
          <div className="text-[11px] text-sidebar-foreground/70">Smart Business App</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-white"
              }`}
            >
              <Icon className="size-4.5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full bg-sidebar-accent text-sm font-semibold text-white">
            {initials(profile?.full_name || "?")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{profile?.full_name || "..."}</div>
            <div className="truncate text-xs text-sidebar-foreground/70">
              {role ? roleLabel[role] : ""}
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              nav_({ to: "/" });
            }}
            className="text-sidebar-foreground/70 hover:text-white"
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

function SubscriptionExpiredScreen({ businessName, onSignOut }: { businessName: string; onSignOut: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-amber-100 text-amber-600">
          <ShieldOff className="size-7" />
        </div>
        <h1 className="mt-4 text-lg font-bold">Your SuuqBook subscription has expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hi, {businessName}'s access is on hold because your subscription has run out. Your data is safe and
          nothing has been deleted — reach out and we'll get you back up and running right away.
        </p>

        <div className="mt-6 space-y-2.5">
          <a href={`tel:${SUPPORT_PHONE_TEL}`}>
            <Button size="lg" className="h-12 w-full gap-2 text-base font-semibold">
              <Phone className="size-4.5" /> Call {SUPPORT_PHONE_DISPLAY}
            </Button>
          </a>
          <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="h-12 w-full gap-2 text-base font-semibold">
              <MessageCircle className="size-4.5" /> Message us on WhatsApp
            </Button>
          </a>
        </div>

        <button onClick={onSignOut} className="mt-6 text-sm font-medium text-muted-foreground hover:text-foreground">
          Sign out
        </button>
      </div>
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  children,
  actions,
  allowRoles,
  bypassSubscriptionGate = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  /** Restrict this page to specific roles; disallowed roles are redirected to the dashboard. */
  allowRoles?: AppRole[];
  /** Lets a page render even when the business's subscription has expired — used by the Subscriptions page itself. */
  bypassSubscriptionGate?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { loading, session, role, profile, signOut } = useAuth();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/" });
      return;
    }
    if (role === "super_admin") {
      navigate({ to: "/admin" });
      return;
    }
    if (allowRoles && role && !allowRoles.includes(role)) {
      navigate({ to: "/dashboard" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session, role]);

  if (loading || !session || role === "super_admin" || (allowRoles && role && !allowRoles.includes(role))) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!bypassSubscriptionGate && !subLoading && subscription?.status === "expired") {
    return (
      <SubscriptionExpiredScreen
        businessName={profile?.business_name || "Your business"}
        onSignOut={async () => {
          await signOut();
          navigate({ to: "/" });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarContent />
      </aside>

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className="lg:hidden bg-primary hover:bg-primary/90"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-0 p-0">
                <SidebarContent onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold text-foreground sm:text-xl">{title}</h1>
              {subtitle ? (
                <p className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
              ) : null}
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              {actions}
              <button
                type="button"
                className="relative grid size-10 place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell className="size-4.5" />
              </button>
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium">
                <Store className="size-4 text-primary" />
                <span className="truncate max-w-[10rem]">{profile?.business_name || "My Business"}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
