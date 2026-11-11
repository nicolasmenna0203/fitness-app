import "server-only";
import { asc, desc, eq, gte } from "drizzle-orm";
import { connection } from "next/server";
import { cache } from "react";
import { db } from "@/db";
import { ejercicios, entrenos, perfil, pesajes, reportesBalanza, series } from "@/db/schema";
import { fechaLocal, sumarDias } from "@/lib/fecha";
import { avance, conTendencia, fechaEstimada, ritmoObjetivo, ritmoSemanal, type PuntoTendencia } from "@/lib/peso";

export type Meta = { pesoMetaKg: number; fechaMeta: string; pesoInicialKg: number; proteinaGPorKg: number };

export type ResumenPeso = {
  hoy: string;
  meta: Meta | null;
  /** Pesajes con tendencia de las últimas `semanas` semanas (para el gráfico). */
  puntos: PuntoTendencia[];
  /** Tendencia actual (último punto); null sin pesajes. */
  actual: number | null;
  ultimoPesaje: { fecha: string; kg: number } | null;
  ritmo: number | null;
  ritmoObjetivo: number | null;
  fechaEstimada: string | null;
  avance: number | null;
};

/** Todo lo que necesitan Progreso, Hoy y Comer sobre el peso. Cacheado por pedido. */
export const resumenPeso = cache(async function resumenPeso(semanas = 8): Promise<ResumenPeso> {
  await connection();
  const hoy = fechaLocal();
  const [filasMeta, filas] = await Promise.all([
    db().select().from(perfil).where(eq(perfil.id, 1)),
    // 26 semanas para que la tendencia arranque asentada antes de la ventana visible.
    db()
      .select({ fecha: pesajes.fecha, kg: pesajes.kg })
      .from(pesajes)
      .where(gte(pesajes.fecha, sumarDias(hoy, -7 * 26)))
      .orderBy(asc(pesajes.fecha)),
  ]);
  const m = filasMeta[0];
  const meta: Meta | null = m
    ? { pesoMetaKg: m.pesoMetaKg, fechaMeta: m.fechaMeta, pesoInicialKg: m.pesoInicialKg, proteinaGPorKg: m.proteinaGPorKg }
    : null;

  const todos = conTendencia(filas);
  const ultimo = todos.at(-1) ?? null;
  const actual = ultimo?.tendencia ?? null;
  const ritmo = ritmoSemanal(todos);
  return {
    hoy,
    meta,
    puntos: todos.filter((p) => p.fecha >= sumarDias(hoy, -7 * semanas)),
    actual,
    ultimoPesaje: ultimo ? { fecha: ultimo.fecha, kg: ultimo.kg } : null,
    ritmo,
    ritmoObjetivo: meta && actual !== null ? ritmoObjetivo(actual, meta.pesoMetaKg, hoy, meta.fechaMeta) : null,
    fechaEstimada: meta && actual !== null ? fechaEstimada(actual, meta.pesoMetaKg, ritmo, hoy) : null,
    avance: meta && actual !== null ? avance(meta.pesoInicialKg, actual, meta.pesoMetaKg) : null,
  };
});

export type ReporteResumido = {
  id: number;
  fecha: string;
  kg: number;
  grasaPct: number | null;
  masaMuscularKg: number | null;
  musculoEsqueleticoKg: number | null;
  grasaVisceral: number | null;
  basalKcal: number | null;
};

/** Los últimos reportes de la balanza, del más nuevo al más viejo. */
export async function ultimosReportes(n = 2): Promise<ReporteResumido[]> {
  await connection();
  return db()
    .select({
      id: reportesBalanza.id,
      fecha: reportesBalanza.fecha,
      kg: reportesBalanza.kg,
      grasaPct: reportesBalanza.grasaPct,
      masaMuscularKg: reportesBalanza.masaMuscularKg,
      musculoEsqueleticoKg: reportesBalanza.musculoEsqueleticoKg,
      grasaVisceral: reportesBalanza.grasaVisceral,
      basalKcal: reportesBalanza.basalKcal,
    })
    .from(reportesBalanza)
    .orderBy(desc(reportesBalanza.fecha), desc(reportesBalanza.id))
    .limit(n);
}

export type Marca = { ejercicio: string; texto: string; fecha: string };

/**
 * Mejor marca por ejercicio. Con carga: la serie de mayor 1RM estimado
 * (fórmula de Epley, kg × (1 + reps/30)), mostrada como kg × reps. Sin carga:
 * más repeticiones o más segundos.
 */
export async function marcasPersonales(): Promise<Marca[]> {
  await connection();
  const filas = await db()
    .select({
      ejercicio: ejercicios.nombre,
      tipoCarga: ejercicios.tipoCarga,
      kg: series.kg,
      reps: series.reps,
      fecha: entrenos.fecha,
    })
    .from(series)
    .innerJoin(entrenos, eq(entrenos.id, series.entrenoId))
    .innerJoin(ejercicios, eq(ejercicios.id, series.ejercicioId))
    .where(eq(entrenos.estado, "terminado"));

  const mejores = new Map<string, { puntaje: number; texto: string; fecha: string }>();
  for (const f of filas) {
    const conCarga = f.kg !== null && (f.tipoCarga === "pila" || f.tipoCarga === "mancuerna");
    const puntaje = conCarga ? f.kg! * (1 + f.reps / 30) : f.reps;
    const kg = conCarga ? (Number.isInteger(f.kg!) ? String(f.kg) : f.kg!.toFixed(1).replace(".", ",")) : "";
    const texto = conCarga ? `${kg} kg × ${f.reps}` : f.tipoCarga === "tiempo" ? `${f.reps} s` : `${f.reps} reps`;
    const previo = mejores.get(f.ejercicio);
    if (!previo || puntaje > previo.puntaje) mejores.set(f.ejercicio, { puntaje, texto, fecha: f.fecha });
  }
  return [...mejores.entries()].map(([ejercicio, m]) => ({ ejercicio, texto: m.texto, fecha: m.fecha })).sort((a, b) => b.fecha.localeCompare(a.fecha));
}
