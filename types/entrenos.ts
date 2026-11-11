import type { TipoCarga } from "@/db/schema";
import type { Sugerencia } from "@/lib/entrenos/progresion";

/** Un ejercicio dentro de un entreno, con la sugerencia para hoy. */
export type EjercicioPlan = {
  ejercicioId: number;
  orden: number;
  nombre: string;
  equipo: string;
  nota: string | null;
  tipoCarga: TipoCarga;
  repsMin: number;
  repsMax: number;
  incrementoKg: number | null;
  cargaMaxKg: number | null;
  kgGuia: number | null;
  /** Series de la versión normal. */
  series: number;
  descansoSeg: number;
  /** Calculada para `series` series; la liviana usa las primeras. */
  sugerencia: Sugerencia;
};

export type ProximoPlan = {
  plantilla: { id: number; nombre: string };
  ejercicios: EjercicioPlan[];
  minutos: number;
  motivoLiviana: string | null;
  enCurso: { id: number; nombre: string; inicio: string } | null;
  hechos7Dias: number;
  metaSemana: number;
};

export type SerieRegistrada = { ejercicioId: number; numero: number; kg: number | null; reps: number };

export type SesionEntreno = {
  id: number;
  nombre: string;
  inicio: string;
  liviana: boolean;
  estado: "en_curso" | "terminado" | "descartado";
  ejercicios: EjercicioPlan[];
  hechas: SerieRegistrada[];
};

export type ItemHistorial = {
  clave: string;
  fecha: string;
  titulo: string;
  detalle: string;
  esEntreno: boolean;
  /** Id de una actividad cargada a mano (se puede borrar); null en el resto. */
  borrableId: number | null;
};
