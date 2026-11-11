/**
 * Metas de calorías y proteína (ADR 0005). Funciones puras.
 *
 * Constantes y su origen:
 *  - 7700 kcal por kg: aproximación habitual de la densidad energética del
 *    tejido; el ajuste semanal corrige el error, así que no se acumula.
 *  - Efecto térmico de la comida ≈ 10 % del gasto: gasto = (basal + activas) / 0,9.
 *  - Sin basal medido: 22 kcal por kg de peso (estimación gruesa; la primera
 *    semana de ajuste la corrige).
 *  - Tope de cambio semanal: ±150 kcal (arbitrario, para no reaccionar al ruido).
 *  - Ajuste solo con al menos 5 días con comidas registradas en la semana.
 */
import { esDeporte } from "./actividades";

export const KCAL_POR_KG = 7700;
export const TOPE_AJUSTE = 150;
export const DIAS_MINIMOS = 5;

const a10 = (n: number) => Math.round(n / 10) * 10;

/** Calorías diarias extra para ganar `ritmoKgSemana` (negativo = déficit). */
export function excedenteDiario(ritmoKgSemana: number): number {
  return (ritmoKgSemana * KCAL_POR_KG) / 7;
}

/** Gasto diario estimado antes de tener datos de consumo. */
export function gastoInicial({ basalKcal, pesoKg, kcalActivasPromedio }: { basalKcal: number | null; pesoKg: number; kcalActivasPromedio: number | null }): number {
  const basal = basalKcal ?? 22 * pesoKg;
  const activas = kcalActivasPromedio ?? basal * 0.3;
  return (basal + activas) / 0.9;
}

export function metaInicial(params: { basalKcal: number | null; pesoKg: number; kcalActivasPromedio: number | null; ritmoObjetivo: number }): { kcal: number; gasto: number } {
  const gasto = gastoInicial(params);
  return { kcal: a10(gasto + excedenteDiario(params.ritmoObjetivo)), gasto: Math.round(gasto) };
}

export type DatosSemana = {
  /** Calorías por día con registros (días sin registrar no cuentan). */
  consumoPorDia: number[];
  /** Cambio de la tendencia del peso en la semana (kg). null si no hay pesajes suficientes. */
  cambioTendenciaKg: number | null;
  dias: number;
};

export type Ajuste = { kcal: number; gasto: number; motivo: string } | { kcal: null; motivo: string };

/**
 * Ajuste semanal: el gasto real sale de lo que se comió y cómo se movió el
 * peso. La meta nueva es ese gasto más el excedente del ritmo objetivo, con un
 * cambio máximo de ±150 kcal respecto de la meta actual.
 */
export function ajusteSemanal(semana: DatosSemana, metaActual: number, ritmoObjetivo: number): Ajuste {
  if (semana.consumoPorDia.length < DIAS_MINIMOS) return { kcal: null, motivo: `Se registraron comidas en ${semana.consumoPorDia.length} de ${semana.dias} días: sin ajuste esta semana.` };
  if (semana.cambioTendenciaKg === null) return { kcal: null, motivo: "Faltan pesajes para ver la tendencia: sin ajuste esta semana." };
  const consumo = semana.consumoPorDia.reduce((a, b) => a + b, 0) / semana.consumoPorDia.length;
  const gasto = consumo - (semana.cambioTendenciaKg * KCAL_POR_KG) / semana.dias;
  const deseada = gasto + excedenteDiario(ritmoObjetivo);
  const kcal = a10(Math.max(metaActual - TOPE_AJUSTE, Math.min(metaActual + TOPE_AJUSTE, deseada)));
  const delta = kcal - metaActual;
  const motivo =
    delta === 0
      ? "La semana pasada fue según lo previsto: la meta sigue igual."
      : delta > 0
        ? `La semana pasada aumentaste menos de lo previsto: +${delta} kcal por día.`
        : `La semana pasada aumentaste más de lo previsto: ${delta} kcal por día.`;
  return { kcal, gasto: Math.round(gasto), motivo };
}

export function metaProteina(pesoKg: number, gPorKg: number): number {
  return Math.round(pesoKg * gPorKg);
}

/** Deportes que suman a la meta del día: no caminatas ni elongación, y de 40 min o más. */
export function extraPorDeporte(actividades: { tipo: string; minutos: number; kcal: number | null }[]): number {
  return a10(actividades.filter((a) => esDeporte(a, 40) && a.kcal).reduce((s, a) => s + (a.kcal ?? 0), 0));
}
