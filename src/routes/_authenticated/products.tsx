import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { backend } from "@/services/client";
import { useAuth, canWrite, canDelete } from "@/lib/auth";
import { fmtCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Plus, Search, Trash2, Upload, Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/products")({
  component: ProductsPage,
});

const PAGE = 12;

const productSchema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().max(50).optional().or(z.literal("")),
  price: z.coerce.number().min(0).max(1_000_000),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  low_stock_threshold: z.coerce.number().int().min(0).max(10000),
  category_id: z.string().uuid().nullable().optional(),
  supplier: z.string().trim().max(120).optional().or(z.literal("")),
});

function ProductsPage() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await backend.from("categories").select("*").order("name")).data ?? [],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["products", search, page],
    queryFn: async () => {
      let q = backend.from("products").select("*, categories(name)", { count: "exact" }).order("created_at", { ascending: false });
      if (search) q = q.ilike("name", `%${search}%`);
      q = q.range(page * PAGE, page * PAGE + PAGE - 1);
      const { data, count } = await q;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE));

  const delMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await backend.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Producto eliminado");
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="text-muted-foreground">Gestiona tu inventario de café</p>
        </div>
        {canWrite(role) && (
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Nuevo producto</Button>
            </DialogTrigger>
            <ProductDialog
              product={editing}
              categories={cats ?? []}
              onClose={() => { setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ["products"] }); }}
            />
          </Dialog>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Buscar producto…" className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : data!.rows.length === 0 ? (
        <Card className="glass-card flex flex-col items-center justify-center p-12 text-center">
          <Package className="mb-3 h-12 w-12 text-muted-foreground" />
          <h3 className="font-semibold">Aún no hay productos</h3>
          <p className="text-sm text-muted-foreground">Crea tu primer producto para empezar a vender.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data!.rows.map((p: any) => (
            <Card key={p.id} className="glass-card overflow-hidden p-0">
              <div className="aspect-video bg-secondary/40">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground"><Package className="h-10 w-10" /></div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold leading-tight">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.categories?.name ?? "Sin categoría"}</p>
                  </div>
                  <Badge variant={p.stock <= p.low_stock_threshold ? "destructive" : "secondary"}>{p.stock}</Badge>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <span className="font-display text-xl font-bold text-primary-glow">{fmtCurrency(Number(p.price))}</span>
                  {canWrite(role) && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      {canDelete(role) && (
                        <Button size="icon" variant="ghost" onClick={() => { if (confirm(`¿Eliminar ${p.name}?`)) delMutation.mutate(p.id); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">Página {page + 1} de {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
        </div>
      )}
    </div>
  );
}

function ProductDialog({ product, categories, onClose }: { product: any; categories: any[]; onClose: () => void }) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name ?? "",
    code: product?.code ?? "",
    price: product?.price ?? 0,
    stock: product?.stock ?? 0,
    low_stock_threshold: product?.low_stock_threshold ?? 5,
    category_id: product?.category_id ?? "",
    supplier: product?.supplier ?? "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(product?.image_url ?? null);
  const [saving, setSaving] = useState(false);

  function handleFile(f: File | null) {
    setImageFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    }
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return product?.image_url ?? null;
    const ext = imageFile.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await backend.storage.from("product-images").upload(path, imageFile, { upsert: true });
    if (error) throw error;
    const { data } = backend.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSave(e: Frontend UI.FormEvent) {
    e.preventDefault();
    const parsed = productSchema.safeParse({ ...form, category_id: form.category_id || null });
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    setSaving(true);
    try {
      const image_url = await uploadImage();
      const payload = {
        name: parsed.data.name,
        code: parsed.data.code || null,
        price: parsed.data.price,
        stock: parsed.data.stock,
        low_stock_threshold: parsed.data.low_stock_threshold,
        category_id: parsed.data.category_id || null,
        supplier: parsed.data.supplier || null,
        image_url,
      };
      const res = isEdit
        ? await backend.from("products").update(payload).eq("id", product.id)
        : await backend.from("products").insert(payload);
      if (res.error) throw res.error;
      toast.success(isEdit ? "Producto actualizado" : "Producto creado");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{isEdit ? "Editar producto" : "Nuevo producto"}</DialogTitle></DialogHeader>
      <form onSubmit={handleSave} className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-20 w-20 overflow-hidden rounded-lg border border-border bg-secondary/40">
            {preview ? <img src={preview} alt="preview" className="h-full w-full object-cover" /> : <Upload className="m-auto mt-6 h-8 w-8 text-muted-foreground" />}
          </div>
          <div className="flex-1">
            <Label htmlFor="img" className="text-xs">Imagen del producto</Label>
            <Input id="img" type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} className="mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><Label>Código</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div><Label>Categoría</Label>
            <Select value={form.category_id || "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin categoría</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Precio</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
          <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></div>
          <div><Label>Aviso bajo stock</Label><Input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })} /></div>
          <div><Label>Proveedor</Label><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
