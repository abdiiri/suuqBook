import { createFileRoute } from "@tanstack/react-router";
import { Plus, Loader2, Trash2, Pencil, Percent } from "lucide-react";
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
import { initials, ksh } from "@/lib/utils";
import {
  useTeamMembers,
  useInviteEmployee,
  useRemoveEmployee,
  useUpdateEmployeeCommission,
  type TeamMember,
} from "@/lib/hooks/use-team";
import { toast } from "sonner";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Users — SuuqBook" },
      { name: "description", content: "Create employee accounts and set their commission rate." },
      { property: "og:title", content: "SuuqBook Users" },
      { property: "og:description", content: "Manage employee accounts and commission." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { data: team = [], isLoading } = useTeamMembers();
  const inviteMut = useInviteEmployee();
  const removeMut = useRemoveEmployee();
  const commissionMut = useUpdateEmployeeCommission();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [commissionRate, setCommissionRate] = useState(0);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null);
  const [editRate, setEditRate] = useState(0);

  async function handleInvite() {
    if (!email || !password || !fullName) {
      toast.error("Name, email and password are required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (commissionRate < 0 || commissionRate > 100) {
      toast.error("Commission rate must be between 0 and 100");
      return;
    }
    try {
      await inviteMut.mutateAsync({ email, password, fullName, phone, commissionRate });
      toast.success(`${fullName} added — share their email & password so they can log in.`);
      setDialogOpen(false);
      setEmail("");
      setPassword("");
      setFullName("");
      setPhone("");
      setCommissionRate(0);
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

  function openEdit(member: TeamMember) {
    setEditTarget(member);
    setEditRate(member.commission_rate);
  }

  async function handleSaveCommission() {
    if (!editTarget) return;
    if (editRate < 0 || editRate > 100) {
      toast.error("Commission rate must be between 0 and 100");
      return;
    }
    try {
      await commissionMut.mutateAsync({ employeeId: editTarget.id, commissionRate: editRate });
      toast.success(`Updated ${editTarget.full_name}'s commission rate`);
      setEditTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update commission rate");
    }
  }

  return (
    <AppShell
      title="Users"
      subtitle="Manage employees and their commission rate"
      allowRoles={["business_owner"]}
      actions={
        <Button className="gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" /> Add User
        </Button>
      }
    >
      <div className="card-elevated overflow-hidden">
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
                <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  <Percent className="size-3" /> {e.commission_rate}% commission
                </Badge>
                <div className="flex items-center gap-1">
                  <button
                    className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Edit commission rate"
                    onClick={() => openEdit(e)}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove"
                    onClick={() => setRemoveTarget(e)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
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
            <div className="space-y-1.5">
              <Label>Commission Rate</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="max-w-32"
                />
                <span className="text-sm text-muted-foreground">% of each sale they record</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Set to 0 if this employee doesn't earn commission. You can change this anytime.
              </p>
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

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commission rate for {editTarget?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Commission Rate</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={editRate}
                onChange={(e) => setEditRate(Number(e.target.value))}
                className="max-w-32"
              />
              <span className="text-sm text-muted-foreground">% of each sale they record</span>
            </div>
            {editTarget && (
              <p className="text-xs text-muted-foreground">
                Example: on a {ksh(1000)} sale, they'd earn {ksh((1000 * editRate) / 100)}.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleSaveCommission} disabled={commissionMut.isPending}>
              {commissionMut.isPending ? <Loader2 className="size-4 animate-spin" /> : "Save"}
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
