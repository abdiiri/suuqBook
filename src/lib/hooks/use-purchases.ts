import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export interface PurchaseRow {
  id: string;
  qty: number;
  unit_cost: number;
  total: number;
  created_at: string;
  supplier: { id: string; name: string } | null;
  product: { id: string; name: string } | null;
}

export type PurchaseInput = {
  product_id: string;
  supplier_id: string | null;
  qty: number;
  unit_cost: number;
};

export function usePurchases() {
  return useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("id, qty, unit_cost, total, created_at, supplier:suppliers(id,name), product:products(id,name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as unknown as PurchaseRow[];
    },
  });
}

export function useCreatePurchase() {
  const qc = useQueryClient();
  const { effectiveOwnerId } = useAuth();
  return useMutation({
    mutationFn: async (input: PurchaseInput) => {
      if (!effectiveOwnerId) throw new Error("Not signed in");
      const total = input.qty * input.unit_cost;
      const { error } = await supabase.from("purchases").insert({
        product_id: input.product_id,
        supplier_id: input.supplier_id,
        qty: input.qty,
        unit_cost: input.unit_cost,
        total,
        owner_id: effectiveOwnerId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["products"] }); // stock changed via DB trigger
    },
  });
}
