"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { actividades } from "@/db/schema";
import { DEPORTES_MANUALES, kcalEstimadas } from "@/lib/actividades";
import { calcularResumenPeso } from "@/lib/datos/progreso";
import { fechaLocal } from "@/lib/fecha";

export type ResultadoActividad = { ok: true; texto: string } | { ok: false; error: string };

/** Partido o cardio que la pulsera no registró. Dos toques: deporte y duración. */
export async function registrarActividad(tipo: string, minutos: number, ayer: boolean): Promise<ResultadoActividad> {
  const deporte = DEPORTES_MANUALES.find((d) => d.tipo === tipo);
  if (!deporte) return { ok: false, error: "Deporte desconocido" };
  if (!Number.isInteger(minutos) || minutos < 5 || minutos > 300) return { ok: false, error: "Duración inválida" };

  const fin = new Date(Date.now() - (ayer ? 24 * 3600_000 : 0));
  const inicio = new Date(fin.getTime() - minutos * 60_000);
  const peso = (await calcularResumenPeso()).actual ?? 70;
  const kcal = kcalEstimadas(deporte.met, peso, minutos);
  await db().insert(actividades).values({ origen: "manual", tipo, nombre: deporte.nombre, fecha: fechaLocal(fin), inicio, fin, kcal });
  refresh();
  return { ok: true, texto: `${deporte.nombre} · ${minutos} min · ~${kcal} kcal` };
}

/** Solo las cargadas a mano: las de la pulsera vuelven en la próxima sincronización. */
export async function borrarActividad(id: number): Promise<void> {
  await db().delete(actividades).where(and(eq(actividades.id, id), eq(actividades.origen, "manual")));
  refresh();
}
