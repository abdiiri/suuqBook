import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useUpdateProfile() {
  const { user, refreshProfile } = useAuth();
  return useMutation({
    mutationFn: async (input: { full_name: string; business_name: string; phone: string }) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("profiles").update(input).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => refreshProfile(),
  });
}
