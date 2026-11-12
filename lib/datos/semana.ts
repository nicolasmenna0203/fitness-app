import "server-only";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { connection } from "next/server";
import { cache } from "react";
import { db } from "@/db";
import { actividades, entrenos, metasCalorias, metricasDiarias, registrosComida } from "@/db/schema";
import { esDeporte, minutosEntre, nombreActividad, sinDuplicados } from "@/lib/actividades";
import { metaProteina } from "@/lib/calorias";
import { META_ENTRENOS_SEMANA } from "@/lib/datos/entrenos";
import { fechaUltimaFoto } from "@/lib/datos/fotos";
import { calcularResumenPeso } from "@/lib/datos/progreso";
import { fechaLocal, sumarDias } from "@/lib/fecha";
import { resumirSemana, type RevisionSemanal } from "@/lib/semana";

/** Revisión de los últimos 7 días completos. Cacheada por pedido (Hoy y Progreso). */
export const revisionSemanal = cache(async function revisionSemanal(): Promise<RevisionSemanal> {
  await connection();
  const hoy = fechaLocal();
  const desde = sumarDias(hoy, -7);
  const hasta = sumarDias(hoy, -1);

  const [peso, [{ hechos }], acts, comidas, suenos, metas, ultimaFoto] = await Promise.all([
    calcularResumenPeso(),
    db()
      .select({ hechos: count() })
      .from(entrenos)
      .where(and(eq(entrenos.estado, "terminado"), gte(entrenos.fecha, desde), lte(entrenos.fecha, hasta))),
    db()
      .select({ origen: actividades.origen, fecha: actividades.fecha, tipo: actividades.tipo, nombre: actividades.nombre, inicio: actividades.inicio, fin: actividades.fin })
      .from(actividades)
      .where(and(gte(actividades.fecha, desde), lte(actividades.fecha, hasta))),
    db()
      .select({ fecha: registrosComida.fecha, kcal: sql<number>`sum(${registrosComida.kcal})::int`, proteinaG: sql<number>`sum(${registrosComida.proteinaG})::real` })
      .from(registrosComida)
      .where(and(gte(registrosComida.fecha, desde), lte(registrosComida.fecha, hasta)))
      .groupBy(registrosComida.fecha),
    db()
      .select({ suenoMin: metricasDiarias.suenoMin })
      .from(metricasDiarias)
      .where(and(gte(metricasDiarias.fecha, desde), lte(metricasDiarias.fecha, hasta))),
    db().select({ desde: metasCalorias.desde, kcal: metasCalorias.kcal, motivo: metasCalorias.motivo }).from(metasCalorias).orderBy(desc(metasCalorias.desde)).limit(2),
    fechaUltimaFoto(),
  ]);

  const deportes = sinDuplicados(acts.map((a) => ({ ...a, minutos: minutosEntre(a.inicio, a.fin) })))
    .filter((a) => esDeporte(a))
    .map((a) => ({ nombre: nombreActividad(a.tipo, a.nombre), minutos: Math.round(a.minutos) }));

  return resumirSemana({
    hoy,
    tendencia: peso.todos,
    entrenos: hechos,
    metaEntrenos: META_ENTRENOS_SEMANA,
    deportes,
    comidas: comidas.map((c) => ({ fecha: c.fecha, kcal: Number(c.kcal), proteinaG: Number(c.proteinaG) })),
    metaProteinaG: peso.meta && peso.actual !== null ? metaProteina(peso.actual, peso.meta.proteinaGPorKg) : null,
    suenoMin: suenos.map((s) => s.suenoMin),
    ajuste: metas[0] ? { ...metas[0], previa: metas[1]?.kcal ?? null } : null,
    ultimaFoto,
  });
});
