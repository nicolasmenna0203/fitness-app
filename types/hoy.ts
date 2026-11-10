import type { EstadoRecuperacion } from "@/lib/recuperacion";

export type Ejercicio = {
  nombre: string;
  equipo: string;
  /** Series en la versión normal; la liviana hace una menos. */
  series: number;
  reps: string;
  carga: string;
};

export type ProximoEntreno = {
  nombre: string;
  minutos: number;
  ejercicios: Ejercicio[];
  /** Motivo para sugerir la versión liviana (deporte de ayer, poco sueño). */
  sugerenciaLiviana: string | null;
};

/** null en un campo = la pulsera todavía no tiene ese dato. */
export type Recuperacion = {
  estado: EstadoRecuperacion | null;
  suenoMin: number | null;
  fcReposo: number | null;
  fcReposoVsPromedio: number | null;
  variabilidadMs: number | null;
};

export type ResumenHoy = {
  fecha: string;
  proximo: ProximoEntreno;
  entrenos7Dias: number;
  metaEntrenosSemana: number;
  kcal: { consumidas: number; meta: number };
  proteina: { consumida: number; meta: number };
  recuperacion: Recuperacion;
  peso: { tendencia: number; ritmoSemanal: number; ritmoObjetivo: number; meta: number; inicio: number; mesMeta: string };
};
