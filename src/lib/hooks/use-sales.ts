import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Database } from "@/integrations/supabase/types";

type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export interface SaleRow {
  id: string;
  qty: number;
  unit_price: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  notes: string | null;
  created_at: string;
  product: { id: string; name: string } | null;
  customer: { id: string; name: string } | null;
}

export type SaleInput = {
  product_id: string;
  customer_id: string | null;
  qty: number;
  unit_price: number;
  discount: number;
  payment_method: PaymentMethod;
  notes: string;
};

export function useSales(limit = 50) {
  return useQuery({
    queryKey: ["sales", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select(
          "id, qty, unit_price, discount, total, payment_method, notes, created_at, product:products(id,name), customer:customers(id,name)",
        )
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as unknown as SaleRow[];
    },
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  const { effectiveOwnerId, user } = useAuth();
  return useMutation({
    mutationFn: async (input: SaleInput) => {
      if (!effectiveOwnerId || !user) throw new Error("Not signed in");
      const total = input.qty * input.unit_price - input.discount;

      const { error } = await supabase.from("sales").insert({
        product_id: input.product_id,
        customer_id: input.customer_id,
        employee_id: user.id,
        qty: input.qty,
        unit_price: input.unit_price,
        discount: input.discount,
        total,
        payment_method: input.payment_method,
        notes: input.notes,
        owner_id: effectiveOwnerId,
      });
      if (error) throw error;

      // On credit sales, add the total to the customer's outstanding balance.
      if (input.payment_method === "credit" && input.customer_id) {
        const { data: customer, error: custErr } = await supabase
          .from("customers")
          .select("balance")
          .eq("id", input.customer_id)
          .single();
        if (!custErr && customer) {
          await supabase
            .from("customers")
            .update({ balance: Number(customer.balance) + total })
            .eq("id", input.customer_id);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] }); // stock changed via DB trigger
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
