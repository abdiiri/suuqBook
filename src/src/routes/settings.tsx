import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import { useUpdateProfile } from "@/lib/hooks/use-profile";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SuuqBook" },
      { name: "description", content: "Business profile and app preferences." },
      { property: "og:title", content: "SuuqBook Settings" },
      { property: "og:description", content: "Business profile and app preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, user } = useAuth();
  const updateMut = useUpdateProfile();

  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setBusinessName(profile.business_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  async function handleSave() {
    try {
      await updateMut.mutateAsync({ full_name: fullName, business_name: businessName, phone });
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update profile");
    }
  }

  return (
    <AppShell title="Settings" subtitle="Business profile & preferences" allowRoles={["business_owner"]}>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="card-elevated p-5">
          <h2 className="text-base font-semibold">Business Profile</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Business Name</Label>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Owner Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
            <Button onClick={handleSave} disabled={updateMut.isPending}>
              {updateMut.isPending ? <Loader2 className="size-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </section>

        <section className="card-elevated p-5">
          <h2 className="text-base font-semibold">Preferences</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            These are on the roadmap and not wired up to real settings yet.
          </p>
          <div className="mt-4 divide-y divide-border">
            {[
              ["Low stock alerts", true],
              ["Daily sales summary via SMS", false],
              ["Employee activity notifications", false],
              ["Dark mode", false],
            ].map(([label, on]) => (
              <div key={label as string} className="flex items-center justify-between py-3 opacity-60">
                <div className="text-sm font-medium">{label as string}</div>
                <Switch defaultChecked={on as boolean} disabled />
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        Looking for employee commission rates? Those are set per-employee on the{" "}
        <Link to="/users" className="font-medium text-primary hover:underline">
          Users
        </Link>{" "}
        page — each employee can earn a different rate.
      </p>
    </AppShell>
  );
}
