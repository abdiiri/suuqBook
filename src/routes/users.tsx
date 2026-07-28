import { createFileRoute } from "@tanstack/react-router";
import { Plus, ShieldCheck, User as UserIcon, Users2, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { useTeamMembers, useInviteEmployee, useRemoveEmployee, type TeamMember } from "@/lib/hooks/use-team";
import { toast } from "sonner";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Users & Roles — SuuqBook" },
      { name: "description", content: "Create employee accounts and assign roles." },
      { property: "og:title", content: "SuuqBook Users" },
      { property: "og:description", content: "Manage employee accounts and roles." },
    ],
  }),
  component: UsersPage,
});

const roles = [
  { name: "Super Admin", desc: "Full access to all businesses", icon: ShieldCheck, tone: "bg-violet-100 text-violet-600" },
  { name: "Business Owner", desc: "Manage your shop", icon: Users2, tone: "bg-emerald-100 text-emerald-600" },
  { name: "Employee", desc: "Sales, customers & limited dashboard", icon: UserIcon, tone: "bg-sky-100 text-sky-600" },
];

function UsersPage() {
  const { data: team = [], isLoading } = useTeamMembers();
  const inviteMut = useInviteEmployee();
  const removeMut = useRemoveEmployee();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

  async function handleInvite() {
    if (!email || !password || !fullName) {
      toast.error("Name, email and password are required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      await inviteMut.mutateAsync({ email, password, fullName, phone });
      toast.success(`${fullName} added — share their email & password so they can log in.`);
      setDialogOpen(false);
      setEmail("");
      setPassword("");
      setFullName("");
      setPhone("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add employee");
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    try {
      await removeMut.mutateAsync(removeTarget.id);
      toast.success("Employee removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove employee");
    } finally {
      setRemoveTarget(null);
    }
  }

  return (
    <AppShell
      title="Users"
      subtitle="Manage team members and permissions"
      allowRoles={["business_owner"]}
      actions={
        <Button className="gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" /> Add User
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="card-elevated p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Roles</div>
          <ul className="mt-4 space-y-3">
            {roles.map((r) => (
              <li key={r.name} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className={`grid size-10 place-items-center rounded-full ${r.tone}`}>
                  <r.icon className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-elevated overflow-hidden lg:col-span-2">
          <div className="border-b border-border p-5">
            <h2 className="text-base font-semibold">Team Members</h2>
            <p className="text-xs text-muted-foreground">Employees you've added to your business.</p>
          </div>
          {isLoading ? (
            <div className="grid h-40 place-items-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : team.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No employees yet — click "Add User" to invite your first team member.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {team.map((e) => (
                <li key={e.id} className="flex items-center gap-4 p-4">
                  <div className="grid size-11 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
                    {initials(e.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{e.full_name}</div>
                    <div className="text-xs text-muted-foreground">{e.phone || "No phone on file"}</div>
                  </div>
                  <Badge variant="secondary" className="bg-sky-100 text-sky-700 hover:bg-sky-100">
                    Employee
                  </Badge>
                  <button
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove"
                    onClick={() => setRemoveTarget(e)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Mohamed Ali" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0722 331 445" />
            </div>
            <div className="space-y-1.5">
              <Label>Email (they'll log in with this)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="employee@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Temporary Password</Label>
              <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
              <p className="text-xs text-muted-foreground">Share this with them directly — they can change it later.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviteMut.isPending}>
              {inviteMut.isPending ? <Loader2 className="size-4 animate-spin" /> : "Add Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{removeTarget?.full_name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Their account will be deleted and they'll no longer be able to log in. Past sales they recorded are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
