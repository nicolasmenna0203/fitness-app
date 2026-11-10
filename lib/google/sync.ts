import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { actividades, conexionGoogle, metricasDiarias, suenos } from "@/db/schema";
import { descifrar } from "@/lib/cifrado";
import { fechaLocal, rangoFechas, sumarDias } from "@/lib/fecha";
import { accessToken, ErrorGoogle, listar } from "./api";
import {
  aActividad,
  aSueno,
  leerFcReposo,
  leerSpo2,
  leerVfc,
  porDia,
  sumarPorDia,
  type FilaActividad,
  type FilaSueno,
  type Punto,
} from "./transformar";

/** Sincronizar al abrir la app solo si la última fue hace más que esto. */
export const MINUTOS_ENTRE_SYNC = 15;

export type ResultadoSync =
  | { estado: "sin-conexion" }
  | { estado: "al-dia" }
  | { estado: "ok"; dias: number; actividades: number; suenos: number; fallidos: string[] }
  | { estado: "error"; mensaje: string; reconectar: boolean };

type Campo = "pasos" | "kcalActivas" | "fcReposo" | "vfcMs" | "spo2Pct" | "suenoMin";
const COLUMNA: Record<Campo, string> = {
  pasos: "pasos",
  kcalActivas: "kcal_activas",
  fcReposo: "fc_reposo",
  vfcMs: "vfc_ms",
  spo2Pct: "spo2_pct",
  suenoMin: "sueno_min",
};

/** Trae un tipo; si falla, lo anota y sigue con los demás (un tipo roto no frena la sync). */
async function intentar<T>(nombre: string, fallidos: string[], fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ErrorGoogle && e.reconectar) throw e;
    fallidos.push(`${nombre}: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

/**
 * Trae de Google los últimos `dias` días (incluido hoy) y los guarda. Los días
 * del rango se sobrescriben con lo que diga Google, que es la fuente de verdad
 * para estos datos.
 */
export async function sincronizarGoogle(dias = 3): Promise<ResultadoSync> {
  const [conexion] = await db().select().from(conexionGoogle).where(eq(conexionGoogle.id, 1));
  if (!conexion) return { estado: "sin-conexion" };

  const hoy = fechaLocal();
  const desde = sumarDias(hoy, -(dias - 1));
  const fallidos: string[] = [];

  try {
    const token = await accessToken(descifrar(conexion.refreshTokenCifrado));
    const desdeCivil = `"${desde}T00:00:00"`;
    const [pasos, kcal, fcReposo, vfc, spo2, puntosSueno, puntosEjercicio] = await Promise.all([
      intentar("pasos", fallidos, () => listar(token, "steps", `steps.interval.civil_start_time >= ${desdeCivil}`)),
      intentar("calorías activas", fallidos, () =>
        listar(token, "active-energy-burned", `active_energy_burned.interval.civil_start_time >= ${desdeCivil}`),
      ),
      intentar("FC en reposo", fallidos, () =>
        listar(token, "daily-resting-heart-rate", `daily_resting_heart_rate.date >= "${desde}"`),
      ),
      intentar("variabilidad de FC", fallidos, () =>
        listar(token, "daily-heart-rate-variability", `daily_heart_rate_variability.date >= "${desde}"`),
      ),
      intentar("oxígeno en sangre", fallidos, () =>
        listar(token, "daily-oxygen-saturation", `daily_oxygen_saturation.date >= "${desde}"`),
      ),
      intentar("sueño", fallidos, () => listar(token, "sleep", `sleep.interval.civil_end_time >= ${desdeCivil}`, 25)),
      intentar("ejercicios", fallidos, () => listar(token, "exercise", `exercise.interval.civil_start_time >= ${desdeCivil}`, 25)),
    ]);

    const sesionesSueno = (puntosSueno ?? []).map(aSueno).filter((s): s is FilaSueno => s !== null);
    const ejercicios = (puntosEjercicio ?? []).map(aActividad).filter((a): a is FilaActividad => a !== null);

    const porFecha = {
      pasos: pasos && sumarPorDia(pasos, "steps", "count"),
      kcalActivas: kcal && sumarPorDia(kcal, "activeEnergyBurned", "kcal"),
      fcReposo: fcReposo && porDia(fcReposo, "dailyRestingHeartRate", leerFcReposo),
      vfcMs: vfc && porDia(vfc, "dailyHeartRateVariability", leerVfc),
      spo2Pct: spo2 && porDia(spo2, "dailyOxygenSaturation", leerSpo2),
    };
    const suenoPorFecha = new Map<string, number>();
    for (const s of sesionesSueno) suenoPorFecha.set(s.fecha, (suenoPorFecha.get(s.fecha) ?? 0) + (s.minutosDormido ?? 0));

    // Solo se escriben los campos de los tipos que se pudieron traer.
    const campos: Campo[] = [
      ...(porFecha.pasos ? (["pasos"] as const) : []),
      ...(porFecha.kcalActivas ? (["kcalActivas"] as const) : []),
      ...(porFecha.fcReposo ? (["fcReposo"] as const) : []),
      ...(porFecha.vfcMs ? (["vfcMs"] as const) : []),
      ...(porFecha.spo2Pct ? (["spo2Pct"] as const) : []),
      ...(puntosSueno ? (["suenoMin"] as const) : []),
    ];

    const filas = rangoFechas(desde, hoy).map((fecha) => {
      const crudo: Record<string, Punto> = {};
      const fc = porFecha.fcReposo?.get(fecha);
      const v = porFecha.vfcMs?.get(fecha);
      const o = porFecha.spo2Pct?.get(fecha);
      if (fc) crudo.fcReposo = fc.crudo;
      if (v) crudo.vfc = v.crudo;
      if (o) crudo.spo2 = o.crudo;
      const redondear = (n: number | null | undefined) => (n == null ? null : Math.round(n));
      return {
        fecha,
        pasos: redondear(porFecha.pasos?.get(fecha)),
        kcalActivas: redondear(porFecha.kcalActivas?.get(fecha)),
        fcReposo: redondear(fc?.valor),
        vfcMs: v?.valor ?? null,
        spo2Pct: o?.valor ?? null,
        suenoMin: puntosSueno ? (suenoPorFecha.get(fecha) ?? null) : null,
        crudo,
      };
    });

    if (campos.length > 0) {
      await db()
        .insert(metricasDiarias)
        .values(filas)
        .onConflictDoUpdate({
          target: metricasDiarias.fecha,
          set: {
            ...Object.fromEntries(campos.map((c) => [c, sql.raw(`excluded.${COLUMNA[c]}`)])),
            crudo: sql`${metricasDiarias.crudo} || excluded.crudo`,
            actualizado: sql`now()`,
          },
        });
    }

    if (sesionesSueno.length > 0) {
      await db()
        .insert(suenos)
        .values(sesionesSueno)
        .onConflictDoUpdate({
          target: suenos.id,
          set: {
            fecha: sql`excluded.fecha`,
            inicio: sql`excluded.inicio`,
            fin: sql`excluded.fin`,
            minutosDormido: sql`excluded.minutos_dormido`,
            crudo: sql`excluded.crudo`,
            actualizado: sql`now()`,
          },
        });
    }

    if (ejercicios.length > 0) {
      await db()
        .insert(actividades)
        .values(ejercicios.map((e) => ({ ...e, origen: "google" as const })))
        .onConflictDoUpdate({
          target: actividades.externoId,
          set: {
            tipo: sql`excluded.tipo`,
            nombre: sql`excluded.nombre`,
            fecha: sql`excluded.fecha`,
            inicio: sql`excluded.inicio`,
            fin: sql`excluded.fin`,
            kcal: sql`excluded.kcal`,
            fcMedia: sql`excluded.fc_media`,
            pasos: sql`excluded.pasos`,
            distanciaM: sql`excluded.distancia_m`,
            crudo: sql`excluded.crudo`,
            actualizado: sql`now()`,
          },
        });
    }

    await db()
      .update(conexionGoogle)
      .set({ ultimaSync: new Date(), ultimoError: fallidos.length ? fallidos.join(" · ") : null })
      .where(eq(conexionGoogle.id, 1));

    return { estado: "ok", dias, actividades: ejercicios.length, suenos: sesionesSueno.length, fallidos };
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e);
    const reconectar = e instanceof ErrorGoogle && e.reconectar;
    await db()
      .update(conexionGoogle)
      .set({ ultimoError: reconectar ? "Google revocó el acceso: hay que volver a conectar" : mensaje })
      .where(eq(conexionGoogle.id, 1));
    return { estado: "error", mensaje, reconectar };
  }
}

/** Para el momento de abrir la app: no repite si sincronizó hace poco. */
export async function sincronizarSiHaceFalta(): Promise<ResultadoSync> {
  const [conexion] = await db().select({ ultimaSync: conexionGoogle.ultimaSync }).from(conexionGoogle).where(eq(conexionGoogle.id, 1));
  if (!conexion) return { estado: "sin-conexion" };
  if (conexion.ultimaSync && Date.now() - conexion.ultimaSync.getTime() < MINUTOS_ENTRE_SYNC * 60_000) return { estado: "al-dia" };
  return sincronizarGoogle(3);
}
