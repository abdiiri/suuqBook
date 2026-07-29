import { createFileRoute } from "@tanstack/react-router";
import { Check, Sparkles, Loader2, Phone, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/lib/hooks/use-subscription";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL, SUPPORT_WHATSAPP_URL } from "@/lib/constants";

export const Route = createFileRoute("/subscriptions")({
  head: () => ({
    meta: [
      { title: "Subscription — SuuqBook" },
      { name: "description", content: "Manage your SuuqBook subscription. 14-day free trial then KSh 300/month." },
      { property: "og:title", content: "SuuqBook Subscription" },
      { property: "og:description", content: "14-day free trial then KSh 300/month." },
    ],
  }),
  component: SubsPage,
});

const features = [
  "Unlimited products & sales",
  "Employee accounts",
  "Daily, weekly & monthly reports",
  "Low stock alerts",
  "Multi-device sync",
  "Priority WhatsApp support",
];

function daysLeft(dateStr: string | null) {
  if (!dateStr) return 0;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function SubsPage() {
  const { data: sub, isLoading } = useSubscription();
  const expired = sub?.status === "expired";

  return (
    <AppShell
      title="Subscription"
      subtitle="Your current plan and billing"
      allowRoles={["business_owner"]}
      bypassSubscriptionGate
    >
      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="card-elevated p-5 lg:col-span-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="size-4" /> Current Plan
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-3xl font-bold capitalize">{sub?.status ?? "Trial"}</div>
              {sub?.status === "trial" && (
                <div className="text-sm text-muted-foreground">
                  • {daysLeft(sub.trial_ends_at)} days remaining
                </div>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {expired
                ? "Your subscription has run out, so the rest of the app is on hold until it's renewed. Your data is safe and untouched."
                : "After your trial, continue with the Monthly plan to keep full access. If your subscription expires, your business becomes read-only until payment."}
            </p>

            {expired ? (
              <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
                <div className="text-sm font-semibold text-amber-900">Renew to get back in</div>
                <p className="mt-1 text-sm text-amber-800">
                  Call or WhatsApp us and we'll reactivate your account right away.
                </p>
                <div className="mt-4 space-y-2.5">
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
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-sm font-semibold">Monthly Plan</div>
                    <div className="text-xs text-muted-foreground">Billed monthly • Cancel anytime</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">KSh 300</div>
                    <div className="text-xs text-muted-foreground">/ month</div>
                  </div>
                </div>
                <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-muted-foreground">
                  M-Pesa payments are coming soon. To renew or upgrade right now, call or WhatsApp{" "}
                  {SUPPORT_PHONE_DISPLAY}.
                </p>
              </div>
            )}
          </div>

          <div className="card-elevated p-5">
            <h3 className="text-base font-semibold">Billing history</h3>
            {sub?.last_receipt ? (
              <ul className="mt-4 divide-y divide-border text-sm">
                <li className="flex items-center justify-between py-3">
                  <span className="text-muted-foreground">Latest receipt</span>
                  <span className="font-semibold">{sub.last_receipt}</span>
                </li>
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No payments yet.</p>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
