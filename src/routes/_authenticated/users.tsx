import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { backend } from "@/services/client";
import { useAuth } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserCog } from "lucide-react";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

function UsersPage() {
  const { role, user, loading } = useAuth();
  if (loading) return <Skeleton className="h-72" />;
  if (role !== "admin") return <Navigate to="/dashboard" />;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data: profiles } = await backend.from("profiles").select("id, display_name, email, created_at").order("created_at", { ascending: false });
      const { data: roles } = await backend.from("user_roles").select("user_id, role");
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
      }));
    },
  });

  async function changeRole(userId: string, newRole: "admin" | "employee" | "viewer") {
    if (userId === user?.id) return toast.error("No puedes cambiar tu propio rol");
    const del = await backend.from("user_roles").delete().eq("user_id", userId);
    if (del.error) return toast.error(del.error.message);
    const ins = await backend.from("user_roles").insert({ user_id: userId, role: newRole });
    if (ins.error) return toast.error(ins.error.message);
    toast.success("Rol actualizado");
    refetch();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UserCog className="h-7 w-7 text-primary-glow" />
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona roles del equipo</p>
        </div>
      </div>

      <Card className="glass-card overflow-hidden">
        {isLoading ? <Skeleton className="h-72" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/30 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Alta</th>
                  <th className="px-4 py-3">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data!.map((u) => {
                  const top = u.roles.includes("admin") ? "admin" : u.roles.includes("employee") ? "employee" : "viewer";
                  return (
                    <tr key={u.id}>
                      <td className="px-4 py-3 font-medium">{u.display_name ?? "—"} {u.id === user?.id && <Badge className="ml-1">tú</Badge>}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(u.created_at)}</td>
                      <td className="px-4 py-3">
                        <Select value={top} onValueChange={(v: any) => changeRole(u.id, v)} disabled={u.id === user?.id}>
                          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="employee">Empleado</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
