"use server";

import { eq, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { comidasFrecuentes, registrosComida } from "@/db/schema";
import { fechaLocal } from "@/lib/fecha";

export type Resultado = { ok: true } | { ok: false; error: string };

const texto = (v: FormDataEntryValue | null, max = 60) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const numero = (v: FormDataEntryValue | null) => {
  const n = Number(texto(v).replace(",", "."));
  return texto(v) === "" || !Number.isFinite(n) ? null : n;
};

function validar(kcal: number | null, proteina: number | null): string | null {
  if (kcal === null || kcal < 0 || kcal > 5000) return "Las calorías van de 0 a 5000.";
  if (proteina === null || proteina < 0 || proteina > 300) return "La proteína va de 0 a 300 g.";
  return null;
}

/** Un toque: registra una comida frecuente en el día de hoy. */
export async function registrarFrecuente(id: number): Promise<Resultado> {
  const [f] = await db().select().from(comidasFrecuentes).where(eq(comidasFrecuentes.id, id));
  if (!f || !f.activa) return { ok: false, error: "Esa comida ya no está." };
  await db().insert(registrosComida).values({ fecha: fechaLocal(), nombre: f.nombre, kcal: f.kcal, proteinaG: f.proteinaG, frecuenteId: f.id });
  await db().update(comidasFrecuentes).set({ usos: sql`${comidasFrecuentes.usos} + 1` }).where(eq(comidasFrecuentes.id, id));
  refresh();
  return { ok: true };
}

/** Carga libre. Si se marca, también la guarda como frecuente. */
export async function registrarLibre(_: Resultado | null, formData: FormData): Promise<Resultado> {
  const nombre = texto(formData.get("nombre")) || "Comida";
  const kcal = numero(formData.get("kcal"));
  const proteina = numero(formData.get("proteina")) ?? 0;
  const error = validar(kcal, proteina);
  if (error) return { ok: false, error };

  let frecuenteId: number | null = null;
  if (formData.get("guardar") === "on" && nombre !== "Comida") {
    const [f] = await db().insert(comidasFrecuentes).values({ nombre, kcal: Math.round(kcal!), proteinaG: proteina, usos: 1 }).returning({ id: comidasFrecuentes.id });
    frecuenteId = f.id;
  }
  await db().insert(registrosComida).values({ fecha: fechaLocal(), nombre, kcal: Math.round(kcal!), proteinaG: proteina, frecuenteId });
  refresh();
  return { ok: true };
}

export async function borrarRegistro(id: number): Promise<void> {
  // Solo los de hoy: el historial de días anteriores alimenta el ajuste semanal.
  const [r] = await db().select({ fecha: registrosComida.fecha }).from(registrosComida).where(eq(registrosComida.id, id));
  if (r?.fecha === fechaLocal()) await db().delete(registrosComida).where(eq(registrosComida.id, id));
  refresh();
}

/** La saca de la grilla sin borrar los registros que la usaron. */
export async function ocultarFrecuente(id: number): Promise<void> {
  await db().update(comidasFrecuentes).set({ activa: false }).where(eq(comidasFrecuentes.id, id));
  refresh();
}

/** Corrige las calorías o la proteína de una comida frecuente (no cambia los registros ya hechos). */
export async function editarFrecuente(id: number, _: Resultado | null, formData: FormData): Promise<Resultado> {
  const nombre = texto(formData.get("nombre"));
  const kcal = numero(formData.get("kcal"));
  const proteina = numero(formData.get("proteina")) ?? 0;
  const error = !nombre ? "Falta el nombre." : validar(kcal, proteina);
  if (error) return { ok: false, error };
  await db().update(comidasFrecuentes).set({ nombre, kcal: Math.round(kcal!), proteinaG: proteina }).where(eq(comidasFrecuentes.id, id));
  refresh();
  return { ok: true };
}
