import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { inviteEmployee, removeEmployee } from "@/lib/team.functions";

export interface TeamMember {
  id: string;
  full_name: string;
  phone: string | null;
  commission_rate: number;
  role: "employee";
}

export function useTeamMembers() {
  const { effectiveOwnerId } = useAuth();
  return useQuery({
    queryKey: ["team", effectiveOwnerId],
    enabled: !!effectiveOwnerId,
    queryFn: async () => {
      // Everyone with owner_id = the current business is an invited employee
      // (owners themselves always have owner_id = null). The user_roles table's
      // RLS only allows reading your own row, so we don't (and can't) query it
      // here — the role is implied by how the row got created.
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id,full_name,phone,commission_rate")
        .eq("owner_id", effectiveOwnerId as string);
      if (error) throw error;

      return (profiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name || "Unnamed",
        phone: p.phone,
        commission_rate: Number(p.commission_rate ?? 0),
        role: "employee" as const,
      }));
    },
  });
}

export function useInviteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; password: string; fullName: string; phone: string; commissionRate: number }) => {
      return inviteEmployee({ data: input });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  });
}

export function useRemoveEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (employeeId: string) => removeEmployee({ data: { employeeId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  });
}

/**
 * Updates an existing employee's commission rate directly (no server function
 * needed — RLS already lets an owner update profiles where owner_id = them).
 */
export function useUpdateEmployeeCommission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, commissionRate }: { employeeId: string; commissionRate: number }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ commission_rate: commissionRate })
        .eq("id", employeeId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  });
}
