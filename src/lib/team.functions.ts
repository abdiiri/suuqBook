import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const inviteEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { email: string; password: string; fullName: string; phone: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Only business owners or super admins may invite employees.
    const [{ data: roles }, { data: callerProfile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("id,owner_id,business_name").eq("id", userId).single(),
    ]);
    const roleNames = (roles ?? []).map((r) => r.role);
    const isAllowed = roleNames.includes("business_owner") || roleNames.includes("super_admin");
    if (!isAllowed) {
      throw new Error("Only the business owner can add team members");
    }
    const ownerId = callerProfile?.owner_id ?? userId;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName, phone: data.phone },
    });
    if (createErr || !created.user) {
      throw new Error(createErr?.message ?? "Could not create the employee account");
    }

    const newUserId = created.user.id;

    // The on_auth_user_created trigger auto-creates a profile, a business_owner
    // role and a trial subscription for every new auth user. For an employee we
    // want them scoped to their employer instead, so fix those rows up here.
    await supabaseAdmin
      .from("profiles")
      .update({ owner_id: ownerId, business_name: callerProfile?.business_name ?? "", phone: data.phone })
      .eq("id", newUserId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId).eq("role", "business_owner");
    await supabaseAdmin.from("user_roles").insert({ user_id: newUserId, role: "employee" });
    await supabaseAdmin.from("subscriptions").delete().eq("owner_id", newUserId);

    return { id: newUserId };
  });

export const removeEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { employeeId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: roles }, { data: callerProfile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("id,owner_id").eq("id", userId).single(),
    ]);
    const roleNames = (roles ?? []).map((r) => r.role);
    const isAllowed = roleNames.includes("business_owner") || roleNames.includes("super_admin");
    if (!isAllowed) throw new Error("Only the business owner can remove team members");
    const ownerId = callerProfile?.owner_id ?? userId;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Only allow removing employees that belong to the caller's own business.
    const { data: target } = await supabaseAdmin
      .from("profiles")
      .select("id,owner_id")
      .eq("id", data.employeeId)
      .single();
    if (!target || target.owner_id !== ownerId) {
      throw new Error("That employee does not belong to your business");
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.employeeId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
