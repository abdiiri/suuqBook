import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SuuqBook — Sign in to your business" },
      {
        name: "description",
        content:
          "SuuqBook is a simple business management app for Islii traders. Track stock, sales, profit and employees in one place.",
      },
      { property: "og:title", content: "SuuqBook — Smart Business App" },
      {
        property: "og:description",
        content: "Cloud POS and inventory for small traders, wholesalers and street sellers in Nairobi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const nav = useNavigate();
  const { session, loading, signIn, signUp } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      nav({ to: "/dashboard" });
    }
  }, [loading, session, nav]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error);
        } else {
          nav({ to: "/dashboard" });
        }
      } else {
        if (!fullName || !businessName) {
          setError("Please fill in your name and business name");
          setSubmitting(false);
          return;
        }
        const { error, needsEmailConfirmation } = await signUp({ email, password, fullName, businessName, phone });
        if (error) {
          setError(error);
        } else if (needsEmailConfirmation) {
          toast.success("Account created — check your email to confirm it, then log in.");
          setMode("login");
          setPassword("");
        } else {
          toast.success("Account created — you're in!");
          nav({ to: "/dashboard" });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-sidebar lg:block">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_10%,color-mix(in_oklab,var(--primary)_50%,transparent),transparent_40%),radial-gradient(circle_at_80%_80%,color-mix(in_oklab,var(--primary)_35%,transparent),transparent_45%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-sidebar-foreground">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg">
              <ShoppingBag className="size-6" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">SuuqBook</div>
              <div className="text-xs text-sidebar-foreground/70">Smart Business App</div>
            </div>
          </div>

          <div className="max-w-md space-y-4">
            <h2 className="text-4xl font-bold leading-tight text-white">
              Run your shop from your phone.
            </h2>
            <p className="text-sidebar-foreground/80">
              Replace paper notebooks with a simple cloud system. Track stock, sales, profits and
              employees — built for traders in Islii, Nairobi.
            </p>
            <ul className="space-y-2 pt-2 text-sm text-sidebar-foreground/85">
              <li>• Record sales in seconds</li>
              <li>• Watch stock and profit in real time</li>
              <li>• Pay employees fair commissions</li>
            </ul>
          </div>

          <p className="text-xs text-sidebar-foreground/60">© 2026 SuuqBook. Made for Islii Traders.</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <ShoppingBag className="size-6" />
            </div>
            <div className="mt-3 text-xl font-bold">SuuqBook</div>
            <div className="text-xs text-muted-foreground">Smart Business App</div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "login" ? (
              <>Welcome Back <span aria-hidden>👋</span></>
            ) : (
              "Create your business account"
            )}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Login to your account" : "Start your 14-day free trial"}
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Your name</Label>
                  <Input
                    id="fullName"
                    placeholder="e.g. Abdirizak Hassan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="businessName">Business name</Label>
                  <Input
                    id="businessName"
                    placeholder="e.g. Islii Bags Shop"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    placeholder="e.g. 0722 000 000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" size="lg" className="h-12 w-full text-base font-semibold" disabled={submitting}>
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : mode === "login" ? (
                "Login"
              ) : (
                "Create account"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary hover:underline"
                    onClick={() => setMode("signup")}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary hover:underline"
                    onClick={() => setMode("login")}
                  >
                    Login
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
