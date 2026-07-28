import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertCallerIsSuperAdmin(supabase: any, userId: string) {
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === "super_admin");
  if (!isAdmin) throw new Error("Only a super admin can do this");
}

export const setSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { targetUserId: string; grant: boolean }) => data)
  .handler(async ({ data, context }) => {
    await assertCallerIsSuperAdmin(context.supabase, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.grant) {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.targetUserId, role: "super_admin" }, { onConflict: "user_id,role" });
    } else {
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.targetUserId)
        .eq("role", "super_admin");
    }
    return { ok: true };
  });
