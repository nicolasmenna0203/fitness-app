"use server";

import { and, count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { entrenos, plantillas, series } from "@/db/schema";
import { fechaLocal } from "@/lib/fecha";

const entero = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

/** Empieza el entreno elegido; si ya hay uno en curso, vuelve a ese. */
export async function empezarEntreno(formData: FormData): Promise<void> {
  const [enCurso] = await db().select({ id: entrenos.id }).from(entrenos).where(eq(entrenos.estado, "en_curso")).limit(1);
  if (enCurso) redirect(`/entrenar/${enCurso.id}`);

  const plantillaId = entero(formData.get("plantillaId"), 1, 1e9);
  if (!plantillaId) throw new Error("Entreno inválido");
  const [p] = await db().select({ id: plantillas.id }).from(plantillas).where(eq(plantillas.id, plantillaId));
  if (!p) throw new Error("Entreno inexistente");

  const [nuevo] = await db()
    .insert(entrenos)
    .values({ plantillaId, fecha: fechaLocal(), liviana: formData.get("liviana") === "1" })
    .returning({ id: entrenos.id });
  redirect(`/entrenar/${nuevo.id}`);
}

async function enCurso(entrenoId: number): Promise<boolean> {
  const [e] = await db().select({ estado: entrenos.estado }).from(entrenos).where(eq(entrenos.id, entrenoId));
  return e?.estado === "en_curso";
}

export type RespuestaSerie = { ok: true } | { ok: false; error: string };

/** Guarda (o corrige) una serie. Se llama desde el cliente con actualización optimista. */
export async function registrarSerie(entrenoId: number, ejercicioId: number, numero: number, kg: number | null, reps: number): Promise<RespuestaSerie> {
  const e = entero(entrenoId, 1, 1e9);
  const ej = entero(ejercicioId, 1, 1e9);
  const n = entero(numero, 1, 20);
  const r = entero(reps, 0, 999);
  const k = kg === null ? null : typeof kg === "number" && Number.isFinite(kg) && kg >= 0 && kg <= 500 ? kg : NaN;
  if (!e || !ej || !n || r === null || Number.isNaN(k)) return { ok: false, error: "Datos inválidos" };
  if (!(await enCurso(e))) return { ok: false, error: "El entreno ya no está en curso" };

  await db()
    .insert(series)
    .values({ entrenoId: e, ejercicioId: ej, numero: n, kg: k, reps: r })
    .onConflictDoUpdate({ target: [series.entrenoId, series.ejercicioId, series.numero], set: { kg: k, reps: r, hechaEn: new Date() } });
  return { ok: true };
}

export async function deshacerSerie(entrenoId: number, ejercicioId: number, numero: number): Promise<RespuestaSerie> {
  if (!(await enCurso(entrenoId))) return { ok: false, error: "El entreno ya no está en curso" };
  await db()
    .delete(series)
    .where(and(eq(series.entrenoId, entrenoId), eq(series.ejercicioId, ejercicioId), eq(series.numero, numero)));
  return { ok: true };
}

/** Cierra el entreno. Sin ninguna serie registrada no cuenta: se descarta. */
export async function terminarEntreno(entrenoId: number): Promise<void> {
  if (await enCurso(entrenoId)) {
    const [{ n }] = await db().select({ n: count() }).from(series).where(eq(series.entrenoId, entrenoId));
    await db()
      .update(entrenos)
      .set(n > 0 ? { estado: "terminado", fin: new Date() } : { estado: "descartado", fin: new Date() })
      .where(eq(entrenos.id, entrenoId));
  }
  redirect("/entrenar");
}

export async function descartarEntreno(entrenoId: number): Promise<void> {
  if (await enCurso(entrenoId)) {
    await db().update(entrenos).set({ estado: "descartado", fin: new Date() }).where(eq(entrenos.id, entrenoId));
  }
  redirect("/entrenar");
}
