import { createFileRoute } from "@tanstack/react-router";
import { Receipt, Package, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { ksh } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useProducts } from "@/lib/hooks/use-products";
import { useCustomers } from "@/lib/hooks/use-customers";
import { useSales, useCreateSale } from "@/lib/hooks/use-sales";
import { toast } from "sonner";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales — SuuqBook" },
      { name: "description", content: "Record sales and track daily takings." },
      { property: "og:title", content: "SuuqBook Sales" },
      { property: "og:description", content: "Record sales and track daily takings." },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();
  const { data: sales = [], isLoading } = useSales();
  const createMut = useCreateSale();

  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [customerId, setCustomerId] = useState<string>("__none");
  const [payment, setPayment] = useState<"cash" | "mpesa" | "credit">("cash");
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");

  // Seed the form once products load.
  useEffect(() => {
    if (products.length && !productId) {
      setProductId(products[0].id);
      setPrice(Number(products[0].sell_price));
    }
  }, [products, productId]);

  const active = useMemo(() => products.find((p) => p.id === productId), [products, productId]);
  const total = qty * price - discount;

  async function handleSave() {
    if (!active) {
      toast.error("Add a product first, then record a sale");
      return;
    }
    if (qty > active.stock) {
      toast.error(`Only ${active.stock} in stock`);
      return;
    }
    if (payment === "credit" && customerId === "__none") {
      toast.error("Select a customer for credit sales");
      return;
    }
    try {
      await createMut.mutateAsync({
        product_id: productId,
        customer_id: customerId === "__none" ? null : customerId,
        qty,
        unit_price: price,
        discount,
        payment_method: payment,
        notes,
      });
      toast.success("Sale recorded");
      setQty(1);
      setDiscount(0);
      setNotes("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <AppShell title="Sales" subtitle="Record a new sale and view recent transactions">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Add Sale */}
        <div className="card-elevated p-5 lg:col-span-2">
          <h2 className="text-base font-semibold">Add Sale</h2>
          <p className="text-xs text-muted-foreground">Stock will be reduced automatically.</p>

          {products.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">Add a product first before recording a sale.</p>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label>Product</Label>
                <Select
                  value={productId}
                  onValueChange={(v) => {
                    setProductId(v);
                    const p = products.find((x) => x.id === v);
                    if (p) setPrice(Number(p.sell_price));
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.stock} in stock)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input type="number" value={qty} min={1} onChange={(e) => setQty(Number(e.target.value) || 1)} />
              </div>

              <div className="space-y-1.5">
                <Label>Selling Price (KSh)</Label>
                <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} />
              </div>

              <div className="rounded-xl bg-primary/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">Total</span>
                  <span className="text-2xl font-bold text-primary">{ksh(total)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Customer (Optional)</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Walk-in customer</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Payment</Label>
                  <Select value={payment} onValueChange={(v) => setPayment(v as typeof payment)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="credit">On Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Discount</Label>
                  <Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea rows={2} placeholder="Optional note…" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <Button size="lg" className="h-12 w-full text-base font-semibold" onClick={handleSave} disabled={createMut.isPending}>
                {createMut.isPending ? <Loader2 className="size-4 animate-spin" /> : "Save Sale"}
              </Button>
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="lg:col-span-3">
          <div className="card-elevated p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Recent Sales</h2>
              <Button variant="outline" size="sm" className="gap-1.5" disabled>
                <Receipt className="size-4" /> Export
              </Button>
            </div>
            {isLoading ? (
              <div className="grid h-40 place-items-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : sales.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No sales recorded yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {sales.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 py-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <Package className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{s.product?.name ?? "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.qty} × {ksh(Number(s.unit_price))} • {s.payment_method}
                        {s.customer ? ` • ${s.customer.name}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{ksh(Number(s.total))}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      {Number(s.commission_amount) > 0 && (
                        <div className="mt-0.5 text-xs font-medium text-emerald-600">
                          +{ksh(Number(s.commission_amount))} commission
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
