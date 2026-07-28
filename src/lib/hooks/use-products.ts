import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductInput = {
  name: string;
  sku: string;
  buy_price: number;
  sell_price: number;
  stock: number;
  low_stock_threshold: number;
};

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  const { effectiveOwnerId } = useAuth();
  return useMutation({
    mutationFn: async (input: ProductInput) => {
      if (!effectiveOwnerId) throw new Error("Not signed in");
      const { error } = await supabase.from("products").insert({ ...input, owner_id: effectiveOwnerId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: ProductInput & { id: string }) => {
      const { error } = await supabase.from("products").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}
