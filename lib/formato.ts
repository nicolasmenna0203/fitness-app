const entero = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const unDecimal = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** 1860 → "1.860" */
export function fmtEntero(n: number): string {
  return entero.format(n);
}

/** 66.2 → "66,2" */
export function fmtKg(n: number): string {
  return unDecimal.format(n);
}

/** 0.28 → "+0,28" (con signo, dos decimales) */
export function fmtDelta(n: number, decimales = 2): string {
  const f = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
    signDisplay: "always",
  });
  return f.format(n).replace("-", "−");
}

/** 385 → "6 h 25 min" */
export function fmtDuracion(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}
