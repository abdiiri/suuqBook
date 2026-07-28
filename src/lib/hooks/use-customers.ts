import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Database } from "@/integrations/supabase/types";

export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type CustomerInput = { name: string; phone: string; balance: number };

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("name", { ascending: true });
      if (error) throw error;
      return data as Customer[];
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  const { effectiveOwnerId } = useAuth();
  return useMutation({
    mutationFn: async (input: CustomerInput) => {
      if (!effectiveOwnerId) throw new Error("Not signed in");
      const { error } = await supabase.from("customers").insert({ ...input, owner_id: effectiveOwnerId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: CustomerInput & { id: string }) => {
      const { error } = await supabase.from("customers").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}
