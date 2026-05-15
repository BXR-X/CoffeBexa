import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { backend } from "@/services/client";
import { useAuth, canWrite, canDelete } from "@/lib/auth";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Users, Search, Mail, Phone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/customers")({
  component: CustomersPage,
});

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

function CustomersPage() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [detail, setDetail] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: async () => {
      let q = backend.from("customers").select("*").order("created_at", { ascending: false });
      if (search) q = q.ilike("name", `%${search}%`);
      return (await q).data ?? [];
    },
  });

  const { data: history } = useQuery({
    queryKey: ["customer-history", detail?.id],
    enabled: !!detail,
    queryFn: async () => (await backend.from("sales").select("id, total, created_at").eq("customer_id", detail.id).order("created_at", { ascending: false })).data ?? [],
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await backend.from("customers").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Cliente eliminado"); qc.invalidateQueries({ queryKey: ["customers"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Tu cartera de clientes habituales</p>
        </div>
        {canWrite(role) && (
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nuevo cliente</Button></DialogTrigger>
            <CustomerDialog customer={editing} onClose={() => { setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ["customers"] }); }} />
          </Dialog>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente…" className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      ) : data!.length === 0 ? (
        <Card className="glass-card flex flex-col items-center p-12 text-center">
          <Users className="mb-3 h-12 w-12 text-muted-foreground" />
          <h3 className="font-semibold">Aún no hay clientes</h3>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((c) => (
            <Card key={c.id} className="glass-card cursor-pointer p-4 transition-all hover:border-primary" onClick={() => setDetail(c)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{c.name}</h3>
                  {c.email && <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3 w-3" /> <span className="truncate">{c.email}</span></div>}
                  {c.phone && <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3 w-3" /> {c.phone}</div>}
                </div>
                {canWrite(role) && (
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                    {canDelete(role) && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm(`¿Eliminar ${c.name}?`)) del.mutate(c.id); }}><Trash2 className="h-3 w-3 text-destructive" /></Button>}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{detail?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            {detail?.email && <p><span className="text-muted-foreground">Email:</span> {detail.email}</p>}
            {detail?.phone && <p><span className="text-muted-foreground">Teléfono:</span> {detail.phone}</p>}
            {detail?.notes && <p className="text-muted-foreground">{detail.notes}</p>}
          </div>
          <h4 className="mt-2 font-semibold">Historial de compras</h4>
          {!history ? <Skeleton className="h-24" /> : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin compras todavía</p>
          ) : (
            <div className="max-h-64 divide-y divide-border overflow-y-auto">
              {history.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-muted-foreground">{fmtDate(s.created_at)}</span>
                  <span className="font-mono font-semibold text-primary-glow">{fmtCurrency(Number(s.total))}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomerDialog({ customer, onClose }: { customer: any; onClose: () => void }) {
  const isEdit = !!customer;
  const [form, setForm] = useState({
    name: customer?.name ?? "", email: customer?.email ?? "", phone: customer?.phone ?? "", notes: customer?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave(e: Frontend UI.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    setSaving(true);
    const payload = {
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
    };
    const res = isEdit
      ? await backend.from("customers").update(payload).eq("id", customer.id)
      : await backend.from("customers").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(isEdit ? "Cliente actualizado" : "Cliente creado");
    onClose();
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{isEdit ? "Editar cliente" : "Nuevo cliente"}</DialogTitle></DialogHeader>
      <form onSubmit={handleSave} className="space-y-3">
        <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div><Label>Correo</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div><Label>Notas</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
