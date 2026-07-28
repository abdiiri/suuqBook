import { createFileRoute } from "@tanstack/react-router";
import { Plus, ShoppingBag, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ksh } from "@/lib/utils";
import { useSuppliers } from "@/lib/hooks/use-suppliers";
import { useProducts } from "@/lib/hooks/use-products";
import { usePurchases, useCreatePurchase } from "@/lib/hooks/use-purchases";
import { toast } from "sonner";

export const Route = createFileRoute("/purchases")({
  head: () => ({
    meta: [
      { title: "Purchases — SuuqBook" },
      { name: "description", content: "Record stock purchases from suppliers." },
      { property: "og:title", content: "SuuqBook Purchases" },
      { property: "og:description", content: "Record purchases from suppliers." },
    ],
  }),
  component: PurchasesPage,
});

function PurchasesPage() {
  const { data: purchases = [], isLoading } = usePurchases();
  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();
  const createMut = useCreatePurchase();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [productId, setProductId] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [unitCost, setUnitCost] = useState(0);

  const total = qty * unitCost;

  function openAdd() {
    setProductId(products[0]?.id ?? "");
    setSupplierId(suppliers[0]?.id ?? "__none");
    setQty(1);
    setUnitCost(products[0] ? Number(products[0].buy_price) : 0);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!productId) {
      toast.error("Add a product first, then record a purchase");
      return;
    }
    try {
      await createMut.mutateAsync({
        product_id: productId,
        supplier_id: supplierId === "__none" ? null : supplierId,
        qty,
        unit_cost: unitCost,
      });
      toast.success("Purchase recorded — stock updated");
      setDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <AppShell
      title="Purchases"
      subtitle={`${suppliers.length} suppliers • ${purchases.length} recent orders`}
      allowRoles={["business_owner"]}
      actions={
        <Button className="gap-1.5" onClick={openAdd}>
          <Plus className="size-4" /> Record Purchase
        </Button>
      }
    >
      <div className="card-elevated overflow-hidden">
        {isLoading ? (
          <div className="grid h-40 place-items-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : purchases.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No purchases recorded yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {purchases.map((p) => (
              <li key={p.id} className="flex items-center gap-4 p-4">
                <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
                  <ShoppingBag className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.product?.name ?? "Unknown product"}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.supplier?.name ?? "No supplier"} • Qty {p.qty} • {new Date(p.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{ksh(Number(p.total))}</div>
                  <div className="text-xs text-muted-foreground">{ksh(Number(p.unit_cost))} / unit</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Purchase</DialogTitle>
          </DialogHeader>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add a product first before recording a purchase.</p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Product</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Supplier (optional)</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger><SelectValue placeholder="No supplier" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No supplier</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Quantity</Label>
                  <Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Unit Cost (KSh)</Label>
                  <Input type="number" min={0} value={unitCost} onChange={(e) => setUnitCost(Number(e.target.value))} />
                </div>
              </div>
              <div className="rounded-lg bg-muted/60 p-3 text-sm">
                Total: <span className="font-semibold">{ksh(total)}</span> — stock will increase by {qty}.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || products.length === 0}>
              {createMut.isPending ? <Loader2 className="size-4 animate-spin" /> : "Record Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
