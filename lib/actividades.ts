/**
 * Partidos, cardio y ejercicios de la pulsera. Funciones puras.
 *
 * Las actividades llegan de Google (la pulsera las detecta) o se cargan a mano
 * cuando no las detectó. Para no contar dos veces lo mismo, una carga manual se
 * ignora si ese día la pulsera registró un deporte.
 */

/** Actividades que no cuentan como deporte: no suman calorías ni alivianan el entreno. */
export const LIVIANAS = new Set(["WALKING", "YOGA", "STRETCHING", "MEDITATION"]);

/**
 * Deportes para la carga manual, con su equivalente metabólico (MET) del
 * Compendio de Actividades Físicas (valores redondeados de uso recreativo).
 */
export const DEPORTES_MANUALES = [
  { tipo: "SOCCER", nombre: "Fútbol", met: 7 },
  { tipo: "PADEL", nombre: "Pádel", met: 6 },
  { tipo: "RUNNING", nombre: "Correr", met: 8 },
  { tipo: "BIKING", nombre: "Bici", met: 7 },
] as const;

export type TipoManual = (typeof DEPORTES_MANUALES)[number]["tipo"];

export const DURACIONES_MIN = [30, 45, 60, 90] as const;

const NOMBRES: Record<string, string> = {
  SOCCER: "Fútbol",
  PADEL: "Pádel",
  TENNIS: "Tenis",
  RUNNING: "Correr",
  BIKING: "Bici",
  WALKING: "Caminata",
};

export function nombreActividad(tipo: string, nombre: string | null): string {
  return nombre ?? NOMBRES[tipo] ?? tipo.charAt(0) + tipo.slice(1).toLowerCase().replaceAll("_", " ");
}

/**
 * Calorías activas estimadas: (MET − 1) × kg × horas. Se resta 1 MET porque el
 * gasto en reposo ya está en la meta base; así se suma solo lo extra.
 */
export function kcalEstimadas(met: number, pesoKg: number, minutos: number): number {
  return Math.round(((met - 1) * pesoKg * minutos) / 60 / 10) * 10;
}

export function esDeporte(a: { tipo: string; minutos: number }, minimo = 20): boolean {
  return !LIVIANAS.has(a.tipo) && a.minutos >= minimo;
}

/** Saca las cargas manuales de los días en que la pulsera ya registró un deporte. */
export function sinDuplicados<T extends { origen: "google" | "manual"; fecha: string; tipo: string; minutos: number }>(acts: T[]): T[] {
  const diasConPulsera = new Set(acts.filter((a) => a.origen === "google" && esDeporte(a)).map((a) => a.fecha));
  return acts.filter((a) => a.origen === "google" || !diasConPulsera.has(a.fecha));
}

export const minutosEntre = (inicio: Date, fin: Date) => (fin.getTime() - inicio.getTime()) / 60000;
