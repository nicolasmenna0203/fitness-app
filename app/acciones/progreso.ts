"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { perfil, pesajes, reportesBalanza } from "@/db/schema";
import { fechaLocal } from "@/lib/fecha";
import { conTendencia } from "@/lib/peso";
import { CAMPOS_REPORTE, type ValoresReporte } from "@/lib/balanza/lector";

export type Resultado = { ok: true } | { ok: false; error: string };

const numero = (v: FormDataEntryValue | null): number | null => {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const esFecha = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const pesoValido = (kg: number | null): kg is number => kg !== null && kg >= 25 && kg <= 300;

/** Registra el peso de hoy (o de la fecha indicada). Un pesaje por día: el último manda. */
export async function registrarPesaje(_: Resultado | null, formData: FormData): Promise<Resultado> {
  const kg = numero(formData.get("kg"));
  const fechaForm = formData.get("fecha");
  const fecha = esFecha(fechaForm) ? fechaForm : fechaLocal();
  if (!pesoValido(kg)) return { ok: false, error: "Ingresá un peso entre 25 y 300 kg." };
  if (fecha > fechaLocal()) return { ok: false, error: "La fecha no puede ser futura." };
  await db()
    .insert(pesajes)
    .values({ fecha, kg, origen: "manual" })
    .onConflictDoUpdate({ target: pesajes.fecha, set: { kg, origen: "manual", actualizado: sql`now()` } });
  refresh();
  return { ok: true };
}

export async function borrarPesaje(fecha: string): Promise<void> {
  if (esFecha(fecha)) await db().delete(pesajes).where(eq(pesajes.fecha, fecha));
  refresh();
}

/** Fija o cambia la meta. El punto de partida es la tendencia actual (o el peso indicado). */
export async function guardarMeta(_: Resultado | null, formData: FormData): Promise<Resultado> {
  const pesoMetaKg = numero(formData.get("pesoMeta"));
  const fechaMeta = formData.get("fechaMeta");
  const proteina = numero(formData.get("proteina")) ?? 1.8;
  if (!pesoValido(pesoMetaKg)) return { ok: false, error: "Ingresá un peso meta entre 25 y 300 kg." };
  if (!esFecha(fechaMeta) || fechaMeta <= fechaLocal()) return { ok: false, error: "La fecha de la meta tiene que ser futura." };
  if (proteina < 1 || proteina > 3) return { ok: false, error: "La proteína va de 1 a 3 g por kg." };

  const todos = await db().select({ fecha: pesajes.fecha, kg: pesajes.kg }).from(pesajes);
  const tendencia = conTendencia(todos).at(-1)?.tendencia ?? null;
  const [actual] = await db().select({ pesoInicialKg: perfil.pesoInicialKg }).from(perfil).where(eq(perfil.id, 1));
  const pesoInicialKg = actual?.pesoInicialKg ?? tendencia ?? numero(formData.get("pesoActual"));
  if (!pesoValido(pesoInicialKg ?? null)) return { ok: false, error: "Registrá primero tu peso de hoy." };

  const fila = { id: 1, pesoMetaKg, fechaMeta, pesoInicialKg: pesoInicialKg!, proteinaGPorKg: proteina };
  await db()
    .insert(perfil)
    .values(fila)
    .onConflictDoUpdate({ target: perfil.id, set: { ...fila, actualizado: sql`now()` } });
  refresh();
  return { ok: true };
}

/** Guarda un reporte de la balanza revisado y registra su peso como pesaje del día. */
export async function guardarReporte(fecha: string, valores: ValoresReporte): Promise<Resultado> {
  if (!esFecha(fecha) || fecha > fechaLocal()) return { ok: false, error: "Fecha inválida." };
  const limpios: Record<string, number> = {};
  for (const c of CAMPOS_REPORTE) {
    const v = valores[c.clave];
    if (v === undefined || v === null) continue;
    if (typeof v !== "number" || !Number.isFinite(v) || v < c.min || v > c.max) return { ok: false, error: `${c.nombre}: valor fuera de rango.` };
    limpios[c.clave] = v;
  }
  const kg = limpios.peso;
  if (!pesoValido(kg ?? null)) return { ok: false, error: "Falta el peso del reporte." };

  const [repetido] = await db()
    .select({ id: reportesBalanza.id })
    .from(reportesBalanza)
    .where(and(eq(reportesBalanza.fecha, fecha), eq(reportesBalanza.kg, kg)))
    .orderBy(desc(reportesBalanza.id))
    .limit(1);
  if (repetido) return { ok: false, error: "Ese reporte ya está cargado." };

  await db().insert(reportesBalanza).values({
    fecha,
    kg,
    grasaPct: limpios.grasaPct ?? null,
    masaMuscularKg: limpios.masaMuscularKg ?? null,
    musculoEsqueleticoKg: limpios.musculoEsqueleticoKg ?? null,
    aguaPct: limpios.aguaPct ?? null,
    grasaVisceral: limpios.grasaVisceral ?? null,
    basalKcal: limpios.basalKcal !== undefined ? Math.round(limpios.basalKcal) : null,
    valores: limpios,
  });
  // El peso de la balanza también cuenta como pesaje, salvo que ya haya uno manual ese día.
  await db().insert(pesajes).values({ fecha, kg, origen: "balanza" }).onConflictDoNothing();
  refresh();
  return { ok: true };
}
