import { createFileRoute } from "@tanstack/react-router";
import { Plus, User, Loader2, Pencil, Trash2 } from "lucide-react";
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
import { ksh } from "@/lib/utils";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  type Customer,
  type CustomerInput,
} from "@/lib/hooks/use-customers";
import { toast } from "sonner";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers — SuuqBook" },
      { name: "description", content: "Manage customers, credit balances and purchase history." },
      { property: "og:title", content: "SuuqBook Customers" },
      { property: "og:description", content: "Manage customers and credit balances." },
    ],
  }),
  component: CustomersPage,
});

const emptyForm: CustomerInput = { name: "", phone: "", balance: 0 };

function CustomersPage() {
  const { data: customers = [], isLoading } = useCustomers();
  const createMut = useCreateCustomer();
  const updateMut = useUpdateCustomer();
  const deleteMut = useDeleteCustomer();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerInput>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }
  function openEdit(c: Customer) {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone ?? "", balance: Number(c.balance) });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...form });
        toast.success("Customer updated");
      } else {
        await createMut.mutateAsync(form);
        toast.success("Customer added");
      }
      setDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toast.success("Customer deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete customer");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <AppShell
      title="Customers"
      subtitle={`${customers.length} customers on file`}
      actions={
        <Button className="gap-1.5" onClick={openAdd}>
          <Plus className="size-4" /> Add Customer
        </Button>
      }
    >
      <div className="card-elevated overflow-hidden">
        {isLoading ? (
          <div className="grid h-40 place-items-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : customers.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No customers yet — add your first one.</div>
        ) : (
          <ul className="divide-y divide-border">
            {customers.map((c) => (
              <li key={c.id} className="flex items-center gap-4 p-4">
                <div className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
                  <User className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.phone || "—"}</div>
                </div>
                {Number(c.balance) > 0 ? (
                  <Badge variant="outline" className="border-amber-400 text-amber-600">{ksh(Number(c.balance))} owed</Badge>
                ) : (
                  <Badge variant="outline" className="border-emerald-400 text-emerald-600">Settled</Badge>
                )}
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(c)} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Edit">
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(c)} className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete">
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
            <DialogTitle>{editing ? "Edit Customer" : "Add Customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Fatuma Ahmed" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 0711 220 001" />
            </div>
            <div className="space-y-1.5">
              <Label>Credit Balance (KSh)</Label>
              <Input type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: Number(e.target.value) })} />
              <p className="text-xs text-muted-foreground">This updates automatically when you record a credit sale.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? <Loader2 className="size-4 animate-spin" /> : editing ? "Save Changes" : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
