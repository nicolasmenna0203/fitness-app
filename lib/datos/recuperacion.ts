import "server-only";
import { and, desc, gte, lte } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { metricasDiarias } from "@/db/schema";
import { fechaLocal, sumarDias } from "@/lib/fecha";
import { estadoRecuperacion } from "@/lib/recuperacion";
import type { Recuperacion } from "@/types/hoy";

/**
 * Recuperación de hoy con datos reales de la pulsera. El sueño de "hoy" es el
 * que terminó esta mañana. La FC en reposo se compara con el promedio de los
 * 14 días anteriores.
 */
export async function recuperacionDeHoy(): Promise<Recuperacion> {
  await connection(); // depende del día y de la base: siempre en el momento del pedido
  const hoy = fechaLocal();
  const filas = await db()
    .select({ fecha: metricasDiarias.fecha, suenoMin: metricasDiarias.suenoMin, fcReposo: metricasDiarias.fcReposo, vfcMs: metricasDiarias.vfcMs })
    .from(metricasDiarias)
    .where(and(gte(metricasDiarias.fecha, sumarDias(hoy, -14)), lte(metricasDiarias.fecha, hoy)))
    .orderBy(desc(metricasDiarias.fecha));

  const deHoy = filas.find((f) => f.fecha === hoy);
  const anteriores = filas.filter((f) => f.fecha < hoy && f.fcReposo !== null).map((f) => f.fcReposo!);
  const promedio = anteriores.length >= 3 ? anteriores.reduce((a, b) => a + b, 0) / anteriores.length : null;

  const suenoMin = deHoy?.suenoMin ?? null;
  const fcReposo = deHoy?.fcReposo ?? null;
  return {
    estado: estadoRecuperacion(suenoMin, fcReposo, promedio),
    suenoMin,
    fcReposo,
    fcReposoVsPromedio: fcReposo !== null && promedio !== null ? Math.round(fcReposo - promedio) : null,
    variabilidadMs: deHoy?.vfcMs ?? null,
  };
}
