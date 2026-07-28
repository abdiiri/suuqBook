import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Database } from "@/integrations/supabase/types";

export type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];
export type SupplierInput = { name: string; phone: string; notes: string };

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name", { ascending: true });
      if (error) throw error;
      return data as Supplier[];
    },
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  const { effectiveOwnerId } = useAuth();
  return useMutation({
    mutationFn: async (input: SupplierInput) => {
      if (!effectiveOwnerId) throw new Error("Not signed in");
      const { error } = await supabase.from("suppliers").insert({ ...input, owner_id: effectiveOwnerId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: SupplierInput & { id: string }) => {
      const { error } = await supabase.from("suppliers").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}
