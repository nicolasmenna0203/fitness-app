/** Fechas civiles (YYYY-MM-DD) en la zona horaria del usuario, no la del servidor. */
export const ZONA = process.env.ZONA_HORARIA ?? "America/Argentina/Buenos_Aires";

/** Fecha civil de un instante en la zona dada. */
export function fechaLocal(instante: Date = new Date(), zona: string = ZONA): string {
  // en-CA formatea como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" }).format(instante);
}

/** Suma (o resta) días a una fecha civil, sin pasar por zonas horarias. */
export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** "2026-11-10" → "Martes 10 de noviembre" */
export function fechaLarga(fecha: string): string {
  const texto = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${fecha}T12:00:00Z`),
  );
  return texto.charAt(0).toUpperCase() + texto.slice(1).replace(",", "");
}

/** Fechas civiles desde `desde` hasta `hasta`, inclusive. */
export function rangoFechas(desde: string, hasta: string): string[] {
  const out: string[] = [];
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) out.push(f);
  return out;
}
