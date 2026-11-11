import "server-only";
import { and, asc, count, desc, eq, gte, inArray, ne } from "drizzle-orm";
import { connection } from "next/server";
import { cache } from "react";
import { db } from "@/db";
import { actividades, ejercicios, entrenos, plantillaEjercicios, plantillas, series } from "@/db/schema";
import { recuperacionDeHoy } from "@/lib/datos/recuperacion";
import { motivoLiviana, siguientePlantilla, sugerir, type SerieHecha } from "@/lib/entrenos/progresion";
import { fechaLocal, sumarDias } from "@/lib/fecha";
import type { EjercicioPlan, ItemHistorial, ProximoPlan, SesionEntreno } from "@/types/entrenos";

export const META_ENTRENOS_SEMANA = 3;

/** Series de la última sesión terminada de cada ejercicio (para la progresión). */
async function ultimasSeries(ejercicioIds: number[], excluirEntreno?: number): Promise<Map<number, SerieHecha[]>> {
  const out = new Map<number, SerieHecha[]>();
  if (ejercicioIds.length === 0) return out;
  const filas = await db()
    .select({ ejercicioId: series.ejercicioId, entrenoId: series.entrenoId, numero: series.numero, kg: series.kg, reps: series.reps })
    .from(series)
    .innerJoin(entrenos, eq(entrenos.id, series.entrenoId))
    .where(
      and(
        eq(entrenos.estado, "terminado"),
        inArray(series.ejercicioId, ejercicioIds),
        excluirEntreno ? ne(series.entrenoId, excluirEntreno) : undefined,
      ),
    )
    .orderBy(desc(entrenos.inicio), asc(series.numero));

  const sesionDe = new Map<number, number>();
  for (const f of filas) {
    if (!sesionDe.has(f.ejercicioId)) sesionDe.set(f.ejercicioId, f.entrenoId);
    if (sesionDe.get(f.ejercicioId) !== f.entrenoId) continue;
    const lista = out.get(f.ejercicioId) ?? [];
    lista.push({ numero: f.numero, kg: f.kg, reps: f.reps });
    out.set(f.ejercicioId, lista);
  }
  return out;
}

/** Ejercicios de una plantilla con la sugerencia de hoy. */
async function planDe(plantillaId: number, excluirEntreno?: number): Promise<EjercicioPlan[]> {
  const filas = await db()
    .select({
      ejercicioId: ejercicios.id,
      orden: plantillaEjercicios.orden,
      nombre: ejercicios.nombre,
      equipo: ejercicios.equipo,
      nota: ejercicios.nota,
      tipoCarga: ejercicios.tipoCarga,
      repsMin: ejercicios.repsMin,
      repsMax: ejercicios.repsMax,
      incrementoKg: ejercicios.incrementoKg,
      cargaMaxKg: ejercicios.cargaMaxKg,
      kgGuia: ejercicios.kgGuia,
      series: plantillaEjercicios.series,
      descansoSeg: plantillaEjercicios.descansoSeg,
    })
    .from(plantillaEjercicios)
    .innerJoin(ejercicios, eq(ejercicios.id, plantillaEjercicios.ejercicioId))
    .where(eq(plantillaEjercicios.plantillaId, plantillaId))
    .orderBy(asc(plantillaEjercicios.orden));

  const ultimas = await ultimasSeries(
    filas.map((f) => f.ejercicioId),
    excluirEntreno,
  );
  return filas.map((f) => ({ ...f, sugerencia: sugerir(f, ultimas.get(f.ejercicioId) ?? [], f.series) }));
}

/** Duración estimada: cada serie ~40 s de trabajo más su descanso; redondeada a 5 min. */
export function minutosEstimados(plan: Pick<EjercicioPlan, "series" | "descansoSeg">[], liviana = false): number {
  const seg = plan.reduce((s, e) => s + (liviana ? Math.max(1, e.series - 1) : e.series) * (e.descansoSeg + 40), 0);
  return Math.max(5, Math.round(seg / 60 / 5) * 5);
}

/**
 * Lo que muestra Entrenar y la tarjeta de Hoy: el entreno en curso o el próximo
 * de la rotación. `cache` evita repetir las consultas dentro de un mismo pedido
 * (Hoy lo usa en dos tarjetas).
 */
export const proximoPlan = cache(async function proximoPlan(): Promise<ProximoPlan | null> {
  await connection();
  const hoy = fechaLocal();

  const [enCurso] = await db()
    .select({ id: entrenos.id, inicio: entrenos.inicio, nombre: plantillas.nombre })
    .from(entrenos)
    .innerJoin(plantillas, eq(plantillas.id, entrenos.plantillaId))
    .where(eq(entrenos.estado, "en_curso"))
    .orderBy(desc(entrenos.inicio))
    .limit(1);

  const [ultima] = await db()
    .select({ plantillaId: entrenos.plantillaId })
    .from(entrenos)
    .where(eq(entrenos.estado, "terminado"))
    .orderBy(desc(entrenos.inicio))
    .limit(1);

  const activas = await db().select({ id: plantillas.id, orden: plantillas.orden, nombre: plantillas.nombre }).from(plantillas).where(eq(plantillas.activa, true));
  const siguiente = siguientePlantilla(activas, ultima?.plantillaId ?? null);
  if (!siguiente) return null;

  const [plan, [{ hechos }], ayer, recuperacion] = await Promise.all([
    planDe(siguiente.id),
    db()
      .select({ hechos: count() })
      .from(entrenos)
      .where(and(eq(entrenos.estado, "terminado"), gte(entrenos.fecha, sumarDias(hoy, -6)))),
    db()
      .select({ tipo: actividades.tipo, nombre: actividades.nombre, inicio: actividades.inicio, fin: actividades.fin })
      .from(actividades)
      .where(eq(actividades.fecha, sumarDias(hoy, -1))),
    recuperacionDeHoy(),
  ]);

  return {
    plantilla: { id: siguiente.id, nombre: siguiente.nombre },
    ejercicios: plan,
    minutos: minutosEstimados(plan),
    motivoLiviana: motivoLiviana(
      ayer.map((a) => ({ tipo: a.tipo, nombre: a.nombre, minutos: (a.fin.getTime() - a.inicio.getTime()) / 60000 })),
      recuperacion.estado,
    ),
    enCurso: enCurso ? { id: enCurso.id, nombre: enCurso.nombre, inicio: enCurso.inicio.toISOString() } : null,
    hechos7Dias: hechos,
    metaSemana: META_ENTRENOS_SEMANA,
  };
});

/** Un entreno con sus series hechas; null si no existe. */
export async function sesionEntreno(id: number): Promise<SesionEntreno | null> {
  await connection();
  const [e] = await db()
    .select({ id: entrenos.id, plantillaId: entrenos.plantillaId, inicio: entrenos.inicio, liviana: entrenos.liviana, estado: entrenos.estado, nombre: plantillas.nombre })
    .from(entrenos)
    .innerJoin(plantillas, eq(plantillas.id, entrenos.plantillaId))
    .where(eq(entrenos.id, id));
  if (!e) return null;

  const [plan, hechas] = await Promise.all([
    planDe(e.plantillaId, e.id),
    db()
      .select({ ejercicioId: series.ejercicioId, numero: series.numero, kg: series.kg, reps: series.reps })
      .from(series)
      .where(eq(series.entrenoId, e.id))
      .orderBy(asc(series.ejercicioId), asc(series.numero)),
  ]);
  return { id: e.id, nombre: e.nombre, inicio: e.inicio.toISOString(), liviana: e.liviana, estado: e.estado, ejercicios: plan, hechas };
}

const DEPORTES: Record<string, string> = { SOCCER: "Fútbol", WALKING: "Caminata", RUNNING: "Correr", TENNIS: "Tenis", BIKING: "Bici" };

/** Entrenos terminados y actividades de la pulsera de los últimos días, mezclados por fecha. */
export async function historial(dias = 14): Promise<ItemHistorial[]> {
  await connection();
  const desde = sumarDias(fechaLocal(), -(dias - 1));
  const [ents, acts] = await Promise.all([
    db()
      .select({ id: entrenos.id, fecha: entrenos.fecha, inicio: entrenos.inicio, fin: entrenos.fin, liviana: entrenos.liviana, nombre: plantillas.nombre, nSeries: count(series.id) })
      .from(entrenos)
      .innerJoin(plantillas, eq(plantillas.id, entrenos.plantillaId))
      .leftJoin(series, eq(series.entrenoId, entrenos.id))
      .where(and(eq(entrenos.estado, "terminado"), gte(entrenos.fecha, desde)))
      .groupBy(entrenos.id, plantillas.nombre),
    db()
      .select({ id: actividades.id, fecha: actividades.fecha, inicio: actividades.inicio, fin: actividades.fin, tipo: actividades.tipo, nombre: actividades.nombre, kcal: actividades.kcal })
      .from(actividades)
      .where(gte(actividades.fecha, desde)),
  ]);
  const min = (a: Date, b: Date | null) => (b ? Math.round((b.getTime() - a.getTime()) / 60000) : null);
  const items: (ItemHistorial & { orden: number })[] = [
    ...ents.map((e) => ({
      clave: `e${e.id}`,
      fecha: e.fecha,
      orden: e.inicio.getTime(),
      titulo: e.nombre + (e.liviana ? " · liviana" : ""),
      detalle: [`${e.nSeries} series`, min(e.inicio, e.fin) !== null ? `${min(e.inicio, e.fin)} min` : null].filter(Boolean).join(" · "),
      esEntreno: true,
    })),
    ...acts.map((a) => ({
      clave: `a${a.id}`,
      fecha: a.fecha,
      orden: a.inicio.getTime(),
      titulo: a.nombre ?? DEPORTES[a.tipo] ?? a.tipo,
      detalle: [`${min(a.inicio, a.fin)} min`, a.kcal !== null ? `${a.kcal} kcal` : null].filter(Boolean).join(" · "),
      esEntreno: false,
    })),
  ];
  return items
    .sort((a, b) => b.orden - a.orden)
    .map((i) => ({ clave: i.clave, fecha: i.fecha, titulo: i.titulo, detalle: i.detalle, esEntreno: i.esEntreno }));
}

export type EjercicioCatalogoConUso = {
  id: number;
  nombre: string;
  equipo: string;
  grupo: string;
  tipoCarga: EjercicioPlan["tipoCarga"];
  repsMin: number;
  repsMax: number;
  kgGuia: number | null;
  /** Último peso usado en un entreno terminado; null si nunca se hizo o no lleva carga. */
  ultimoKg: number | null;
};

/** Ejercicios de la rotación activa con el peso guía y el último usado (pantalla Datos). */
export async function catalogoConUso(): Promise<EjercicioCatalogoConUso[]> {
  await connection();
  const filas = await db()
    .selectDistinct({
      id: ejercicios.id,
      nombre: ejercicios.nombre,
      equipo: ejercicios.equipo,
      grupo: ejercicios.grupo,
      tipoCarga: ejercicios.tipoCarga,
      repsMin: ejercicios.repsMin,
      repsMax: ejercicios.repsMax,
      kgGuia: ejercicios.kgGuia,
    })
    .from(ejercicios)
    .innerJoin(plantillaEjercicios, eq(plantillaEjercicios.ejercicioId, ejercicios.id))
    .innerJoin(plantillas, and(eq(plantillas.id, plantillaEjercicios.plantillaId), eq(plantillas.activa, true)));
  const ultimas = await ultimasSeries(filas.map((f) => f.id));
  const orden = ["piernas", "empuje", "tirón", "core"];
  return filas
    .map((f) => ({ ...f, ultimoKg: ultimas.get(f.id)?.find((s) => s.kg !== null)?.kg ?? null }))
    .sort((a, b) => orden.indexOf(a.grupo) - orden.indexOf(b.grupo) || a.nombre.localeCompare(b.nombre));
}
