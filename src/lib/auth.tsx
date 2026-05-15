import { createContext, useContext, useEffect, useState, type Frontend UINode } from "react";
import type { Session, User } from "@backend/backend-js";
import { backend } from "@/services/client";

export type Role = "admin" | "employee" | "viewer";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  role: Role | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null, session: null, role: null, loading: true, signOut: async () => {},
});

export function AuthProvider({ children }: { children: Frontend UINode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = backend.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => fetchRole(s.user.id), 0);
      } else {
        setRole(null);
      }
    });
    backend.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) fetchRole(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function fetchRole(userId: string) {
    const { data } = await backend
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .order("role", { ascending: true });
    if (data && data.length > 0) {
      const roles = data.map((r) => r.role) as Role[];
      const top: Role = roles.includes("admin") ? "admin" : roles.includes("employee") ? "employee" : "viewer";
      setRole(top);
    } else {
      setRole("viewer");
    }
  }

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        role,
        loading,
        signOut: async () => {
          await backend.auth.signOut();
          window.location.href = "/login";
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

export const canWrite = (r: Role | null) => r === "admin" || r === "employee";
export const canDelete = (r: Role | null) => r === "admin";
