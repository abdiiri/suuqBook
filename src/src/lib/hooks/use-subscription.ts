import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useSubscription() {
  const { effectiveOwnerId } = useAuth();
  return useQuery({
    queryKey: ["subscription", effectiveOwnerId],
    enabled: !!effectiveOwnerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("owner_id", effectiveOwnerId as string)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
