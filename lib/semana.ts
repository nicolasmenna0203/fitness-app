/**
 * Revisión semanal (flujo 4 de docs/producto/secciones.md): los últimos 7 días
 * completos, sin calendario fijo. Acompaña al ajuste semanal de calorías
 * (ADR 0005), que corre cada 7 días desde la meta anterior. Funciones puras.
 */
import { diasEntre, type PuntoTendencia } from "./peso";
import { sumarDias } from "./fecha";

/** Cada cuántos días conviene una foto nueva. */
export const DIAS_ENTRE_FOTOS = 21;
/** Un día "cumple" la proteína con el 90 % de la meta. */
const UMBRAL_PROTEINA = 0.9;

export type EntradaSemana = {
  hoy: string;
  tendencia: PuntoTendencia[];
  entrenos: number;
  metaEntrenos: number;
  deportes: { nombre: string; minutos: number }[];
  /** Totales por día con comidas registradas. */
  comidas: { fecha: string; kcal: number; proteinaG: number }[];
  metaProteinaG: number | null;
  suenoMin: (number | null)[];
  /** Última meta de calorías y la anterior, para mostrar el ajuste. */
  ajuste: { desde: string; kcal: number; motivo: string; previa: number | null } | null;
  ultimaFoto: string | null;
};

export type RevisionSemanal = {
  desde: string;
  hasta: string;
  /** Cambio de la tendencia del peso en la semana; null sin pesajes suficientes. */
  cambioPesoKg: number | null;
  entrenos: { hechos: number; meta: number };
  deportes: { nombre: string; minutos: number }[];
  comidas: { dias: number; kcalPromedio: number | null; proteinaPromedio: number | null; diasProteinaOk: number | null };
  suenoPromedioMin: number | null;
  /** El ajuste de calorías si se hizo en los últimos 2 días. */
  ajuste: { kcal: number; delta: number | null; motivo: string } | null;
  fotoSugerida: boolean;
};

function tendenciaEn(puntos: PuntoTendencia[], fecha: string): number | null {
  return puntos.filter((p) => p.fecha <= fecha).at(-1)?.tendencia ?? null;
}

const promedio = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function resumirSemana(e: EntradaSemana): RevisionSemanal {
  const hasta = sumarDias(e.hoy, -1);
  const desde = sumarDias(e.hoy, -7);

  const pesajesSemana = e.tendencia.filter((p) => p.fecha >= desde && p.fecha <= hasta).length;
  const inicio = tendenciaEn(e.tendencia, sumarDias(desde, -1));
  const fin = tendenciaEn(e.tendencia, hasta);
  const cambioPesoKg = pesajesSemana >= 2 && inicio !== null && fin !== null ? fin - inicio : null;

  const comidas = e.comidas.filter((c) => c.fecha >= desde && c.fecha <= hasta);
  const kcal = promedio(comidas.map((c) => c.kcal));
  const prot = promedio(comidas.map((c) => c.proteinaG));
  const meta = e.metaProteinaG;

  const sueno = promedio(e.suenoMin.filter((s): s is number => s !== null));
  const fresco = e.ajuste && diasEntre(e.ajuste.desde, e.hoy) <= 1;

  return {
    desde,
    hasta,
    cambioPesoKg,
    entrenos: { hechos: e.entrenos, meta: e.metaEntrenos },
    deportes: e.deportes,
    comidas: {
      dias: comidas.length,
      kcalPromedio: kcal !== null ? Math.round(kcal / 10) * 10 : null,
      proteinaPromedio: prot !== null ? Math.round(prot) : null,
      diasProteinaOk: meta ? comidas.filter((c) => c.proteinaG >= meta * UMBRAL_PROTEINA).length : null,
    },
    suenoPromedioMin: sueno !== null ? Math.round(sueno) : null,
    ajuste: fresco && e.ajuste ? { kcal: e.ajuste.kcal, delta: e.ajuste.previa !== null ? e.ajuste.kcal - e.ajuste.previa : null, motivo: e.ajuste.motivo } : null,
    fotoSugerida: e.ultimaFoto === null || diasEntre(e.ultimaFoto, e.hoy) >= DIAS_ENTRE_FOTOS,
  };
}
