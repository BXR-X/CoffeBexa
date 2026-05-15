export const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" }).format(n || 0);

export const fmtDate = (d: string | Date) =>
  new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));

export const fmtDateShort = (d: string | Date) =>
  new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(d));
