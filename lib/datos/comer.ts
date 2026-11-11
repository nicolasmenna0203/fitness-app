import "server-only";
import { and, asc, avg, desc, eq, gte, isNotNull, lt, lte, sql, sum } from "drizzle-orm";
import { connection } from "next/server";
import { cache } from "react";
import { db } from "@/db";
import { actividades, comidasFrecuentes, metasCalorias, metricasDiarias, registrosComida, reportesBalanza } from "@/db/schema";
import { minutosEntre, sinDuplicados } from "@/lib/actividades";
import { ajusteSemanal, extraPorDeporte, metaInicial, metaProteina } from "@/lib/calorias";
import { fechaLocal, sumarDias } from "@/lib/fecha";
import { calcularResumenPeso } from "./progreso";

async function basalMedido(): Promise<number | null> {
  const [r] = await db()
    .select({ basal: reportesBalanza.basalKcal })
    .from(reportesBalanza)
    .where(isNotNull(reportesBalanza.basalKcal))
    .orderBy(desc(reportesBalanza.fecha))
    .limit(1);
  return r?.basal ?? null;
}

/** Calorías activas promedio de la pulsera en los 7 días anteriores (hoy está incompleto). */
async function activasPromedio(hoy: string): Promise<number | null> {
  const [r] = await db()
    .select({ promedio: avg(metricasDiarias.kcalActivas) })
    .from(metricasDiarias)
    .where(and(gte(metricasDiarias.fecha, sumarDias(hoy, -7)), lt(metricasDiarias.fecha, hoy), isNotNull(metricasDiarias.kcalActivas)));
  return r?.promedio != null ? Number(r.promedio) : null;
}

async function metaVigente(fecha: string) {
  const [m] = await db().select().from(metasCalorias).where(lte(metasCalorias.desde, fecha)).orderBy(desc(metasCalorias.desde)).limit(1);
  return m ?? null;
}

/** Tendencia del peso en una fecha: el último punto hasta ese día. */
function tendenciaEn(puntos: { fecha: string; tendencia: number }[], fecha: string): number | null {
  const previos = puntos.filter((p) => p.fecha <= fecha);
  return previos.at(-1)?.tendencia ?? null;
}

export type ResultadoAjuste = "sin-meta-de-peso" | "creada" | "ajustada" | "sin-cambios" | "al-dia";

/**
 * Crea la meta inicial o hace el ajuste semanal si pasaron 7 días desde la
 * última (ADR 0005). Se llama al abrir la app y desde el cron diario; no
 * escribe nada si no corresponde.
 */
export async function ajustarMetaSiCorresponde(): Promise<ResultadoAjuste> {
  const hoy = fechaLocal();
  const peso = await calcularResumenPeso();
  if (!peso.meta || peso.actual === null || peso.ritmoObjetivo === null) return "sin-meta-de-peso";

  const [ultima] = await db().select().from(metasCalorias).orderBy(desc(metasCalorias.desde)).limit(1);
  if (!ultima) {
    const [basal, activas] = await Promise.all([basalMedido(), activasPromedio(hoy)]);
    const { kcal, gasto } = metaInicial({ basalKcal: basal, pesoKg: peso.actual, kcalActivasPromedio: activas, ritmoObjetivo: peso.ritmoObjetivo });
    const basalTxt = basal !== null ? "el metabolismo basal de tu balanza" : "un metabolismo basal aproximado según tu peso";
    const activasTxt = activas !== null ? "tu actividad de la pulsera" : "una actividad promedio";
    await db()
      .insert(metasCalorias)
      .values({ desde: hoy, kcal, gastoEstimado: gasto, motivo: `Calculada con ${basalTxt} y ${activasTxt}. Se ajusta cada semana.` })
      .onConflictDoNothing();
    return "creada";
  }

  if (sumarDias(ultima.desde, 7) > hoy) return "al-dia";

  const desde = sumarDias(hoy, -7);
  const consumo = await db()
    .select({ fecha: registrosComida.fecha, kcal: sum(registrosComida.kcal) })
    .from(registrosComida)
    .where(and(gte(registrosComida.fecha, desde), lt(registrosComida.fecha, hoy)))
    .groupBy(registrosComida.fecha);
  const inicio = tendenciaEn(peso.todos, sumarDias(desde, -1));
  const fin = tendenciaEn(peso.todos, sumarDias(hoy, -1));
  const ajuste = ajusteSemanal(
    { consumoPorDia: consumo.map((c) => Number(c.kcal)), cambioTendenciaKg: inicio !== null && fin !== null ? fin - inicio : null, dias: 7 },
    ultima.kcal,
    peso.ritmoObjetivo,
  );
  await db()
    .insert(metasCalorias)
    .values({ desde: hoy, kcal: ajuste.kcal ?? ultima.kcal, gastoEstimado: "gasto" in ajuste ? ajuste.gasto : ultima.gastoEstimado, motivo: ajuste.motivo })
    .onConflictDoNothing();
  return ajuste.kcal === null || ajuste.kcal === ultima.kcal ? "sin-cambios" : "ajustada";
}

export type RegistroComida = { id: number; hora: string; nombre: string; kcal: number; proteinaG: number };
export type Frecuente = { id: number; nombre: string; kcal: number; proteinaG: number };

export type ResumenComer = {
  fecha: string;
  /** null sin meta de peso: no hay contra qué calcular. */
  meta: { kcal: number; base: number; extraDeporte: number; proteinaG: number; motivo: string; desde: string | null } | null;
  consumido: { kcal: number; proteinaG: number };
  registros: RegistroComida[];
  frecuentes: Frecuente[];
};

/** Lo que muestran Comer y los anillos de Hoy. */
export const resumenComer = cache(async function resumenComer(): Promise<ResumenComer> {
  await connection();
  const hoy = fechaLocal();
  const [peso, vigente, regs, frecs, acts] = await Promise.all([
    calcularResumenPeso(),
    metaVigente(hoy),
    db()
      .select({ id: registrosComida.id, hora: registrosComida.hora, nombre: registrosComida.nombre, kcal: registrosComida.kcal, proteinaG: registrosComida.proteinaG })
      .from(registrosComida)
      .where(eq(registrosComida.fecha, hoy))
      .orderBy(asc(registrosComida.hora)),
    db()
      .select({ id: comidasFrecuentes.id, nombre: comidasFrecuentes.nombre, kcal: comidasFrecuentes.kcal, proteinaG: comidasFrecuentes.proteinaG })
      .from(comidasFrecuentes)
      .where(eq(comidasFrecuentes.activa, true))
      .orderBy(desc(comidasFrecuentes.usos), asc(comidasFrecuentes.nombre)),
    db()
      .select({ origen: actividades.origen, fecha: actividades.fecha, tipo: actividades.tipo, inicio: actividades.inicio, fin: actividades.fin, kcal: actividades.kcal })
      .from(actividades)
      .where(eq(actividades.fecha, hoy))
      .then((filas) => sinDuplicados(filas.map((a) => ({ ...a, minutos: minutosEntre(a.inicio, a.fin) })))),
  ]);

  let meta: ResumenComer["meta"] = null;
  if (peso.meta && peso.actual !== null && peso.ritmoObjetivo !== null) {
    let base = vigente?.kcal ?? null;
    let motivo = vigente?.motivo ?? "";
    if (base === null) {
      // Todavía no se guardó la inicial (se guarda al abrir la app): se muestra la estimación.
      const [basal, activas] = await Promise.all([basalMedido(), activasPromedio(hoy)]);
      base = metaInicial({ basalKcal: basal, pesoKg: peso.actual, kcalActivasPromedio: activas, ritmoObjetivo: peso.ritmoObjetivo }).kcal;
      motivo = "Estimación inicial. Se ajusta cada semana según tu peso.";
    }
    const extra = extraPorDeporte(acts);
    meta = { kcal: base + extra, base, extraDeporte: extra, proteinaG: metaProteina(peso.actual, peso.meta.proteinaGPorKg), motivo, desde: vigente?.desde ?? null };
  }

  const fmtHora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: process.env.ZONA_HORARIA ?? "America/Argentina/Buenos_Aires" });
  return {
    fecha: hoy,
    meta,
    consumido: { kcal: regs.reduce((s, r) => s + r.kcal, 0), proteinaG: Math.round(regs.reduce((s, r) => s + r.proteinaG, 0)) },
    registros: regs.map((r) => ({ ...r, hora: fmtHora.format(r.hora) })),
    frecuentes: frecs,
  };
});

/** Total por día de los últimos `dias` días (para la revisión semanal). */
export async function consumoPorDia(dias = 7) {
  const hoy = fechaLocal();
  return db()
    .select({ fecha: registrosComida.fecha, kcal: sql<number>`sum(${registrosComida.kcal})::int`, proteinaG: sql<number>`round(sum(${registrosComida.proteinaG}))::int` })
    .from(registrosComida)
    .where(gte(registrosComida.fecha, sumarDias(hoy, -(dias - 1))))
    .groupBy(registrosComida.fecha)
    .orderBy(asc(registrosComida.fecha));
}

/** Comidas frecuentes activas, para gestionarlas en Datos. */
export async function frecuentesActivas(): Promise<(Frecuente & { usos: number })[]> {
  await connection();
  return db()
    .select({ id: comidasFrecuentes.id, nombre: comidasFrecuentes.nombre, kcal: comidasFrecuentes.kcal, proteinaG: comidasFrecuentes.proteinaG, usos: comidasFrecuentes.usos })
    .from(comidasFrecuentes)
    .where(eq(comidasFrecuentes.activa, true))
    .orderBy(asc(comidasFrecuentes.nombre));
}
