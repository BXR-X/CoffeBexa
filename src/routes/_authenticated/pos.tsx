import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { backend } from "@/services/client";
import { useAuth, canWrite } from "@/lib/auth";
import { fmtCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Trash2, Search, Package, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pos")({
  component: PosPage,
});

type CartItem = { id: string; name: string; price: number; stock: number; qty: number };

const TAX_RATE = 0.10;

function PosPage() {
  const { user, role } = useAuth();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [customerId, setCustomerId] = useState<string>("none");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [submitting, setSubmitting] = useState(false);

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ["pos-products", search],
    queryFn: async () => {
      let q = backend.from("products").select("id, name, price, stock, image_url").gt("stock", 0).order("name");
      if (search) q = q.ilike("name", `%${search}%`);
      const { data } = await q.limit(40);
      return data ?? [];
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["pos-customers"],
    queryFn: async () => (await backend.from("customers").select("id, name").order("name")).data ?? [],
  });

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = (subtotal - discount) * TAX_RATE;
    const total = Math.max(0, subtotal - discount + tax);
    return { subtotal, tax, total };
  }, [cart, discount]);

  function addToCart(p: any) {
    setCart((c) => {
      const ex = c.find((i) => i.id === p.id);
      if (ex) {
        if (ex.qty >= p.stock) { toast.error("No hay más stock"); return c; }
        return c.map((i) => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...c, { id: p.id, name: p.name, price: Number(p.price), stock: p.stock, qty: 1 }];
    });
  }

  function changeQty(id: string, delta: number) {
    setCart((c) => c.flatMap((i) => {
      if (i.id !== id) return [i];
      const q = i.qty + delta;
      if (q <= 0) return [];
      if (q > i.stock) { toast.error("Sin stock"); return [i]; }
      return [{ ...i, qty: q }];
    }));
  }

  async function checkout() {
    if (!canWrite(role)) return toast.error("Sin permisos para vender");
    if (cart.length === 0) return toast.error("Carrito vacío");
    setSubmitting(true);
    try {
      const { data: sale, error } = await backend.from("sales").insert({
        customer_id: customerId === "none" ? null : customerId,
        user_id: user!.id,
        subtotal: totals.subtotal,
        tax: totals.tax,
        discount,
        total: totals.total,
        payment_method: paymentMethod,
      }).select().single();
      if (error) throw error;

      const items = cart.map((i) => ({
        sale_id: sale.id,
        product_id: i.id,
        product_name: i.name,
        quantity: i.qty,
        unit_price: i.price,
        line_total: i.price * i.qty,
      }));
      const { error: e2 } = await backend.from("sale_items").insert(items);
      if (e2) throw e2;

      await backend.from("audit_logs").insert({
        user_id: user!.id, action: "sale_created", entity: "sales", entity_id: sale.id,
        details: { total: totals.total, items: cart.length },
      });

      toast.success(`Venta registrada · ${fmtCurrency(totals.total)}`);
      setCart([]); setDiscount(0); setCustomerId("none");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Punto de venta</h1>
          <p className="text-muted-foreground">Toca un producto para añadirlo al carrito</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar producto…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
          </div>
        ) : products!.length === 0 ? (
          <Card className="glass-card p-8 text-center">
            <Package className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hay productos disponibles.</p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products!.map((p) => (
              <button key={p.id} onClick={() => addToCart(p)}
                className="glass-card group overflow-hidden rounded-xl p-3 text-left transition-all hover:border-primary hover:glow">
                <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-secondary/40">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    : <div className="flex h-full items-center justify-center"><Package className="h-8 w-8 text-muted-foreground" /></div>}
                </div>
                <div className="font-medium leading-tight">{p.name}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-primary-glow">{fmtCurrency(Number(p.price))}</span>
                  <span className="text-xs text-muted-foreground">{p.stock}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Card className="glass-card sticky top-4 flex h-fit flex-col p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary-glow" />
          <h2 className="font-semibold">Carrito · {cart.length}</h2>
        </div>

        {cart.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carrito vacío</p>
        ) : (
          <div className="mb-4 max-h-72 space-y-2 overflow-y-auto">
            {cart.map((i) => (
              <div key={i.id} className="flex items-center gap-2 rounded-md bg-secondary/40 p-2 text-sm">
                <div className="flex-1 truncate">
                  <div className="truncate font-medium">{i.name}</div>
                  <div className="text-xs text-muted-foreground">{fmtCurrency(i.price)}</div>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => changeQty(i.id, -1)}><Minus className="h-3 w-3" /></Button>
                <span className="w-6 text-center font-mono">{i.qty}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => changeQty(i.id, 1)}><Plus className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCart((c) => c.filter((x) => x.id !== i.id))}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <div>
            <Label className="text-xs">Cliente</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Cliente ocasional</SelectItem>
                {customers?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Descuento</Label>
              <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} />
            </div>
            <div>
              <Label className="text-xs">Pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="my-4 space-y-1.5 border-t border-border pt-4 text-sm">
          <Row label="Subtotal" value={fmtCurrency(totals.subtotal)} />
          <Row label="Descuento" value={`− ${fmtCurrency(discount)}`} />
          <Row label={`Impuesto (${(TAX_RATE * 100).toFixed(0)}%)`} value={fmtCurrency(totals.tax)} />
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <span className="font-semibold">Total</span>
            <span className="font-display text-2xl font-bold text-gradient">{fmtCurrency(totals.total)}</span>
          </div>
        </div>

        <Button size="lg" disabled={submitting || cart.length === 0} onClick={checkout} className="glow">
          {submitting ? "Procesando…" : "Cobrar venta"}
        </Button>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
