import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type SubStatus = Database["public"]["Enums"]["sub_status"];

export interface AdminBusiness {
  id: string;
  business_name: string;
  owner_name: string;
  phone: string | null;
  created_at: string;
  employeeCount: number;
  productCount: number;
  subscription: {
    status: SubStatus;
    trial_ends_at: string;
    current_period_end: string | null;
  } | null;
}

export function useAdminBusinesses() {
  return useQuery({
    queryKey: ["admin-businesses"],
    queryFn: async () => {
      const [{ data: admins, error: adminsErr }, { data: owners, error: ownersErr }] = await Promise.all([
        supabase.from("user_roles").select("user_id").eq("role", "super_admin"),
        supabase
          .from("profiles")
          .select("id,full_name,business_name,phone,created_at")
          .is("owner_id", null)
          .order("created_at", { ascending: false }),
      ]);
      if (adminsErr) throw adminsErr;
      if (ownersErr) throw ownersErr;

      const adminIds = new Set((admins ?? []).map((a) => a.user_id));
      const businessOwners = (owners ?? []).filter((o) => !adminIds.has(o.id));
      const ownerIds = businessOwners.map((o) => o.id);
      if (ownerIds.length === 0) return [] as AdminBusiness[];

      const [{ data: subs, error: subsErr }, { data: employees, error: empErr }, { data: products, error: prodErr }] =
        await Promise.all([
          supabase.from("subscriptions").select("owner_id,status,trial_ends_at,current_period_end").in("owner_id", ownerIds),
          supabase.from("profiles").select("id,owner_id").in("owner_id", ownerIds),
          supabase.from("products").select("id,owner_id").in("owner_id", ownerIds),
        ]);
      if (subsErr) throw subsErr;
      if (empErr) throw empErr;
      if (prodErr) throw prodErr;

      const subByOwner = new Map(subs?.map((s) => [s.owner_id, s]));
      const employeeCount = new Map<string, number>();
      for (const e of employees ?? []) {
        employeeCount.set(e.owner_id as string, (employeeCount.get(e.owner_id as string) ?? 0) + 1);
      }
      const productCount = new Map<string, number>();
      for (const p of products ?? []) {
        productCount.set(p.owner_id, (productCount.get(p.owner_id) ?? 0) + 1);
      }

      return businessOwners.map((o) => ({
        id: o.id,
        business_name: o.business_name || "Unnamed business",
        owner_name: o.full_name || "Unnamed owner",
        phone: o.phone,
        created_at: o.created_at,
        employeeCount: employeeCount.get(o.id) ?? 0,
        productCount: productCount.get(o.id) ?? 0,
        subscription: subByOwner.get(o.id) ?? null,
      })) as AdminBusiness[];
    },
  });
}

export function useUpdateSubscriptionAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ownerId,
      status,
      extendDays,
    }: {
      ownerId: string;
      status?: SubStatus;
      /** Push trial_ends_at forward by this many days from today. */
      extendDays?: number;
    }) => {
      const patch: Record<string, unknown> = {};
      if (status) patch.status = status;
      if (extendDays) {
        const base = new Date();
        base.setDate(base.getDate() + extendDays);
        patch.trial_ends_at = base.toISOString();
      }
      const { error } = await supabase.from("subscriptions").update(patch).eq("owner_id", ownerId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-businesses"] }),
  });
}
