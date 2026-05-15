import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { backend } from "@/services/client";
import { useAuth } from "@/lib/auth";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, ShoppingBag, Package, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { startOfDay, subDays, format } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();
      const last7 = subDays(new Date(), 6);

      const [todaySales, allSales, products, recent] = await Promise.all([
        backend.from("sales").select("total").gte("created_at", today),
        backend.from("sales").select("total, created_at").gte("created_at", last7.toISOString()),
        backend.from("products").select("id, name, stock, low_stock_threshold"),
        backend.from("sales").select("id, total, created_at, customers(name)").order("created_at", { ascending: false }).limit(5),
      ]);

      const todayTotal = todaySales.data?.reduce((s, r) => s + Number(r.total), 0) ?? 0;
      const todayCount = todaySales.data?.length ?? 0;
      const weekTotal = allSales.data?.reduce((s, r) => s + Number(r.total), 0) ?? 0;
      const lowStock = products.data?.filter((p) => p.stock <= p.low_stock_threshold) ?? [];

      // chart by day
      const days = Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(new Date(), 6 - i);
        const key = format(d, "yyyy-MM-dd");
        const total = allSales.data?.filter((s) => format(new Date(s.created_at), "yyyy-MM-dd") === key)
          .reduce((s, r) => s + Number(r.total), 0) ?? 0;
        return { day: format(d, "dd/MM"), total };
      });

      return { todayTotal, todayCount, weekTotal, lowStock, recent: recent.data ?? [], days, totalProducts: products.data?.length ?? 0 };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hola, {user?.email?.split("@")[0]} 👋</h1>
        <p className="text-muted-foreground">Resumen de tu negocio hoy</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ventas hoy" value={isLoading ? null : fmtCurrency(data!.todayTotal)} icon={DollarSign} accent />
        <StatCard label="Tickets hoy" value={isLoading ? null : String(data!.todayCount)} icon={ShoppingBag} />
        <StatCard label="Ventas 7d" value={isLoading ? null : fmtCurrency(data!.weekTotal)} icon={DollarSign} />
        <StatCard label="Bajo stock" value={isLoading ? null : String(data!.lowStock.length)} icon={AlertTriangle} warn={!isLoading && data!.lowStock.length > 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2 p-5">
          <h3 className="mb-4 font-semibold">Ventas últimos 7 días</h3>
          <div className="h-64">
            {isLoading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data!.days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="day" stroke="oklch(0.68 0.04 270)" fontSize={12} />
                  <YAxis stroke="oklch(0.68 0.04 270)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "oklch(0.21 0.04 270)", border: "1px solid oklch(0.30 0.04 270 / 0.6)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="total" stroke="oklch(0.62 0.22 275)" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="glass-card p-5">
          <h3 className="mb-4 font-semibold">Productos bajos</h3>
          {isLoading ? <Skeleton className="h-48 w-full" /> : data!.lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todo el stock está OK ✅</p>
          ) : (
            <ul className="space-y-2">
              {data!.lowStock.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2 text-sm">
                  <span className="truncate">{p.name}</span>
                  <span className="font-mono font-bold text-destructive">{p.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="glass-card p-5">
        <h3 className="mb-4 font-semibold">Últimas ventas</h3>
        {isLoading ? <Skeleton className="h-32 w-full" /> : data!.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay ventas. ¡Registra la primera en el POS!</p>
        ) : (
          <div className="divide-y divide-border">
            {data!.recent.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{s.customers?.name ?? "Cliente ocasional"}</div>
                  <div className="text-xs text-muted-foreground">{fmtDate(s.created_at)}</div>
                </div>
                <div className="font-mono font-semibold text-primary-glow">{fmtCurrency(Number(s.total))}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent, warn }: { label: string; value: string | null; icon: any; accent?: boolean; warn?: boolean }) {
  return (
    <Card className={`glass-card p-5 ${accent ? "glow" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${warn ? "text-destructive" : accent ? "text-primary-glow" : "text-muted-foreground"}`} />
      </div>
      <div className={`mt-2 font-display text-2xl font-bold ${warn ? "text-destructive" : ""}`}>
        {value ?? <Skeleton className="h-8 w-24" />}
      </div>
    </Card>
  );
}
