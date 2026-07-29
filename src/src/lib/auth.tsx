import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "business_owner" | "employee";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  business_name: string | null;
  owner_id: string | null;
  commission_rate: number;
}

interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  /** The business whose data should be read/written — self for owners/admins, employer for employees. */
  effectiveOwnerId: string | null;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (args: {
    email: string;
    password: string;
    fullName: string;
    businessName: string;
    phone: string;
  }) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function loadProfileAndRole(userId: string) {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  const role = (roles?.[0]?.role as AppRole | undefined) ?? null;
  return { profile: (profile as Profile | null) ?? null, role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);

  useEffect(() => {
    let mounted = true;

    async function hydrate(sess: Session | null) {
      setSession(sess);
      if (!sess?.user) {
        setProfile(null);
        setRole(null);
        setLoading(false);
        return;
      }
      const { profile: p, role: r } = await loadProfileAndRole(sess.user.id);
      if (!mounted) return;
      setProfile(p);
      setRole(r);
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => hydrate(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setLoading(true);
      hydrate(sess);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (!session?.user) return;
    const { profile: p, role: r } = await loadProfileAndRole(session.user.id);
    setProfile(p);
    setRole(r);
  };

  const signIn: AuthState["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp: AuthState["signUp"] = async ({ email, password, fullName, businessName, phone }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, business_name: businessName, phone },
      },
    });
    if (error) return { error: error.message, needsEmailConfirmation: false };
    // Supabase returns a user but no session when "Confirm email" is enabled
    // on the project (the default for new projects) — the account exists but
    // can't log in until the confirmation link is clicked.
    const needsEmailConfirmation = !data.session;
    return { error: null, needsEmailConfirmation };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const effectiveOwnerId = profile ? profile.owner_id ?? profile.id : null;

  return (
    <AuthContext.Provider
      value={{
        loading,
        session,
        user: session?.user ?? null,
        profile,
        role,
        effectiveOwnerId,
        refreshProfile,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
