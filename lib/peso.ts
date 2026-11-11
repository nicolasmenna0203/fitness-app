/**
 * Matemática del peso (ADR 0005): tendencia, ritmo y proyección.
 * Funciones puras sobre fechas civiles (YYYY-MM-DD).
 *
 * - Tendencia: media móvil exponencial con α = 0,1 por día. Con días sin
 *   pesaje, el peso acumulado del intervalo es 1 − (1 − α)^días.
 * - Ritmo: pendiente de la tendencia (regresión lineal) en las últimas semanas.
 * - Ritmo objetivo: lo que falta dividido las semanas que quedan, con tope de
 *   0,5 % del peso por semana (convención para que el aumento no sea mayormente grasa).
 */
export const ALFA = 0.1;
export const TOPE_RITMO_PCT = 0.005;

export type Pesaje = { fecha: string; kg: number };
export type PuntoTendencia = { fecha: string; kg: number; tendencia: number };

const DIA_MS = 86_400_000;
export const diasEntre = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / DIA_MS);

/** Pesajes ordenados por fecha con su valor de tendencia. */
export function conTendencia(pesajes: Pesaje[]): PuntoTendencia[] {
  const orden = [...pesajes].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const out: PuntoTendencia[] = [];
  let t: number | null = null;
  let previa: string | null = null;
  for (const p of orden) {
    if (t === null || previa === null) t = p.kg;
    else {
      const peso = 1 - Math.pow(1 - ALFA, Math.max(1, diasEntre(previa, p.fecha)));
      t = t + peso * (p.kg - t);
    }
    previa = p.fecha;
    out.push({ fecha: p.fecha, kg: p.kg, tendencia: t });
  }
  return out;
}

/**
 * Kg por semana según la pendiente de la tendencia en los últimos `dias` días.
 * null si hay menos de 2 semanas de datos o menos de 5 pesajes en la ventana.
 */
export function ritmoSemanal(puntos: PuntoTendencia[], dias = 21): number | null {
  if (puntos.length < 5) return null;
  const ultima = puntos[puntos.length - 1].fecha;
  if (diasEntre(puntos[0].fecha, ultima) < 14) return null;
  const ventana = puntos.filter((p) => diasEntre(p.fecha, ultima) <= dias);
  if (ventana.length < 5) return null;
  const xs = ventana.map((p) => diasEntre(ventana[0].fecha, p.fecha));
  const ys = ventana.map((p) => p.tendencia);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? null : (num / den) * 7;
}

/** Kg por semana necesarios para llegar a la meta en la fecha, con tope de 0,5 % del peso. */
export function ritmoObjetivo(actual: number, meta: number, hoy: string, fechaMeta: string): number {
  const semanas = Math.max(1, diasEntre(hoy, fechaMeta) / 7);
  const necesario = (meta - actual) / semanas;
  const tope = actual * TOPE_RITMO_PCT;
  return Math.max(-tope, Math.min(tope, necesario));
}

/** Fecha estimada de llegada a la meta al ritmo actual; null si no se acerca. */
export function fechaEstimada(actual: number, meta: number, ritmo: number | null, hoy: string): string | null {
  if (ritmo === null || ritmo === 0 || Math.sign(meta - actual) !== Math.sign(ritmo)) return null;
  const dias = Math.round(((meta - actual) / ritmo) * 7);
  if (dias > 3 * 365) return null;
  const d = new Date(`${hoy}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Avance (0–1) desde el peso inicial hacia la meta. */
export function avance(inicial: number, actual: number, meta: number): number {
  if (meta === inicial) return 1;
  return Math.max(0, Math.min(1, (actual - inicial) / (meta - inicial)));
}
