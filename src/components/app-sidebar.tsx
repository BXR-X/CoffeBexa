import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingCart, Users, Receipt, UserCog, LogOut, Coffee } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pos", label: "Punto de venta", icon: ShoppingCart },
  { to: "/products", label: "Productos", icon: Package },
  { to: "/customers", label: "Clientes", icon: Users },
  { to: "/sales", label: "Historial", icon: Receipt },
] as const;

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const { role, user, signOut } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground glow">
          <Coffee className="h-5 w-5" />
        </div>
        <div>
          <div className="font-display text-lg font-bold tracking-tight">Cafe Bexa</div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Mini ERP</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map((n) => {
          const Icon = n.icon;
          const active = pathname === n.to || pathname.startsWith(n.to + "/");
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
        {role === "admin" && (
          <Link
            to="/users"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              pathname.startsWith("/users")
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <UserCog className="h-4 w-4" />
            Usuarios
          </Link>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 rounded-lg bg-sidebar-accent/40 px-3 py-2">
          <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
          <div className="text-xs font-semibold capitalize text-primary-glow">{role ?? "—"}</div>
        </div>
        <Button onClick={signOut} variant="ghost" size="sm" className="w-full justify-start gap-2">
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
