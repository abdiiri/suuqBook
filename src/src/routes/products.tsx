import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, Package, Loader2, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useAuth } from "@/lib/auth";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  type Product,
  type ProductInput,
} from "@/lib/hooks/use-products";
import { toast } from "sonner";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — SuuqBook" },
      { name: "description", content: "Manage your product catalog, prices, stock levels and suppliers." },
      { property: "og:title", content: "SuuqBook Products" },
      { property: "og:description", content: "Manage catalog, prices, stock and suppliers." },
    ],
  }),
  component: ProductsPage,
});

const emptyForm: ProductInput = {
  name: "",
  sku: "",
  buy_price: 0,
  sell_price: 0,
  stock: 0,
  low_stock_threshold: 5,
};

function ProductsPage() {
  const { role } = useAuth();
  const canManage = role === "business_owner" || role === "super_admin";
  const { data: products = [], isLoading } = useProducts();
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();
  const deleteMut = useDeleteProduct();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "low" | "out">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductInput>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    let list = products;
    if (tab === "low") list = list.filter((p) => p.stock <= p.low_stock_threshold && p.stock > 0);
    if (tab === "out") list = list.filter((p) => p.stock === 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q));
    }
    return list;
  }, [products, tab, search]);

  const low = products.filter((p) => p.stock <= p.low_stock_threshold);
  const out = products.filter((p) => p.stock === 0);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku ?? "",
      buy_price: Number(p.buy_price),
      sell_price: Number(p.sell_price),
      stock: p.stock,
      low_stock_threshold: p.low_stock_threshold,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...form });
        toast.success("Product updated");
      } else {
        await createMut.mutateAsync(form);
        toast.success("Product added");
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
      toast.success("Product deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete product");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <AppShell
      title="Products"
      subtitle={`${products.length} items in your catalog`}
      actions={
        canManage ? (
          <Button className="gap-1.5" onClick={openAdd}>
            <Plus className="size-4" /> Add Product
          </Button>
        ) : undefined
      }
    >
      <div className="card-elevated p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="all">All ({products.length})</TabsTrigger>
              <TabsTrigger value="low">Low Stock ({low.length})</TabsTrigger>
              <TabsTrigger value="out">Out of Stock ({out.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <div className="grid h-40 place-items-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {products.length === 0 ? "No products yet — add your first one." : "No products match your search."}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((p) => (
                <li key={p.id} className="flex items-center gap-4 py-3">
                  <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Package className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.sku || "No SKU"}</div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="text-xs text-muted-foreground">Buy / Sell</div>
                    <div className="text-sm font-medium">{ksh(Number(p.buy_price))} / {ksh(Number(p.sell_price))}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Stock</div>
                    <div className="text-sm font-semibold">{p.stock}</div>
                  </div>
                  {p.stock === 0 ? (
                    <Badge variant="outline" className="border-destructive/40 text-destructive">Out</Badge>
                  ) : p.stock <= p.low_stock_threshold ? (
                    <Badge variant="outline" className="border-amber-400 text-amber-600">Low</Badge>
                  ) : null}
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(p)} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Edit">
                        <Pencil className="size-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(p)} className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Product Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bag (Small)" />
            </div>
            <div className="space-y-1.5">
              <Label>SKU (optional)</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. BG-S-01" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Buy Price (KSh)</Label>
                <Input type="number" value={form.buy_price} onChange={(e) => setForm({ ...form, buy_price: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Sell Price (KSh)</Label>
                <Input type="number" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Opening Stock</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} disabled={!!editing} />
              </div>
              <div className="space-y-1.5">
                <Label>Low Stock Alert At</Label>
                <Input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })} />
              </div>
            </div>
            {editing && (
              <p className="text-xs text-muted-foreground">
                Stock changes automatically from Purchases and Sales — edit it there, not here.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? <Loader2 className="size-4 animate-spin" /> : editing ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. Past sales and purchases referencing this product will be kept.
            </AlertDialogDescription>
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
