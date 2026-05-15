import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { backend } from "@/services/client";
import { fmtCurrency, fmtDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Receipt, FileDown, Eye } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/_authenticated/sales")({
  component: SalesHistoryPage,
});

const PAGE = 20;

function SalesHistoryPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["sales-history", from, to, page],
    queryFn: async () => {
      let q = backend.from("sales").select("id, total, subtotal, tax, discount, payment_method, created_at, customers(name)", { count: "exact" }).order("created_at", { ascending: false });
      if (from) q = q.gte("created_at", new Date(from).toISOString());
      if (to) q = q.lte("created_at", new Date(to + "T23:59:59").toISOString());
      q = q.range(page * PAGE, page * PAGE + PAGE - 1);
      const { data, count } = await q;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  const { data: itemsForDetail } = useQuery({
    queryKey: ["sale-items", detail?.id],
    enabled: !!detail,
    queryFn: async () => (await backend.from("sale_items").select("*").eq("sale_id", detail.id)).data ?? [],
  });

  const totalSold = data?.rows.reduce((s, r: any) => s + Number(r.total), 0) ?? 0;
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE));

  async function exportPDF(sale: any) {
    const items = (await backend.from("sale_items").select("*").eq("sale_id", sale.id)).data ?? [];
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text("Cafe Bexa", 14, 18);
    doc.setFontSize(10); doc.setTextColor(120);
    doc.text(`Recibo #${sale.id.slice(0, 8)}`, 14, 25);
    doc.text(fmtDate(sale.created_at), 14, 30);
    doc.text(`Cliente: ${sale.customers?.name ?? "Ocasional"}`, 14, 35);
    doc.text(`Pago: ${sale.payment_method}`, 14, 40);

    autoTable(doc, {
      startY: 48,
      head: [["Producto", "Cant.", "Precio", "Subtotal"]],
      body: items.map((i: any) => [i.product_name, i.quantity, fmtCurrency(Number(i.unit_price)), fmtCurrency(Number(i.line_total))]),
      headStyles: { fillColor: [99, 91, 255] },
    });

    const y = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(10); doc.setTextColor(60);
    doc.text(`Subtotal: ${fmtCurrency(Number(sale.subtotal))}`, 140, y);
    doc.text(`Descuento: ${fmtCurrency(Number(sale.discount))}`, 140, y + 5);
    doc.text(`Impuesto: ${fmtCurrency(Number(sale.tax))}`, 140, y + 10);
    doc.setFontSize(13); doc.setTextColor(0);
    doc.text(`TOTAL: ${fmtCurrency(Number(sale.total))}`, 140, y + 18);

    doc.save(`recibo-${sale.id.slice(0, 8)}.pdf`);
    toast.success("PDF descargado");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Historial de ventas</h1>
        <p className="text-muted-foreground">Filtra y exporta recibos</p>
      </div>

      <Card className="glass-card flex flex-wrap items-end gap-3 p-4">
        <div><Label className="text-xs">Desde</Label><Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0); }} /></div>
        <div><Label className="text-xs">Hasta</Label><Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(0); }} /></div>
        <Button variant="ghost" onClick={() => { setFrom(""); setTo(""); setPage(0); }}>Limpiar</Button>
        <div className="ml-auto rounded-md bg-primary/15 px-4 py-2 text-sm">
          Total página: <span className="font-display text-lg font-bold text-primary-glow">{fmtCurrency(totalSold)}</span>
        </div>
      </Card>

      <Card className="glass-card overflow-hidden">
        {isLoading ? <Skeleton className="h-72" /> : data!.rows.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hay ventas en el rango.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/30 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Pago</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data!.rows.map((s: any) => (
                  <tr key={s.id} className="hover:bg-secondary/20">
                    <td className="px-4 py-3">{fmtDate(s.created_at)}</td>
                    <td className="px-4 py-3">{s.customers?.name ?? <span className="text-muted-foreground">Ocasional</span>}</td>
                    <td className="px-4 py-3 capitalize">{s.payment_method}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-primary-glow">{fmtCurrency(Number(s.total))}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="icon" variant="ghost" onClick={() => setDetail(s)}><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => exportPDF(s)}><FileDown className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">Página {page + 1} de {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalle de venta</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{fmtDate(detail.created_at)}</span>
                <span>#{detail.id.slice(0, 8)}</span>
              </div>
              <div className="divide-y divide-border rounded-md border border-border">
                {!itemsForDetail ? <Skeleton className="h-24" /> : itemsForDetail.map((i: any) => (
                  <div key={i.id} className="flex items-center justify-between p-3">
                    <div>
                      <div className="font-medium">{i.product_name}</div>
                      <div className="text-xs text-muted-foreground">{i.quantity} × {fmtCurrency(Number(i.unit_price))}</div>
                    </div>
                    <div className="font-mono">{fmtCurrency(Number(i.line_total))}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-1 border-t border-border pt-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmtCurrency(Number(detail.subtotal))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Descuento</span><span>− {fmtCurrency(Number(detail.discount))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Impuesto</span><span>{fmtCurrency(Number(detail.tax))}</span></div>
                <div className="mt-2 flex justify-between border-t border-border pt-2 text-lg font-bold">
                  <span>Total</span><span className="text-gradient">{fmtCurrency(Number(detail.total))}</span>
                </div>
              </div>
              <Button onClick={() => exportPDF(detail)} className="w-full gap-2"><FileDown className="h-4 w-4" /> Descargar PDF</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
