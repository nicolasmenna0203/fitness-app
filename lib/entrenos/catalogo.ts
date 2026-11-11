/**
 * Catálogo de ejercicios y rotación inicial (ADR 0004). Lo usan la semilla
 * (scripts/semilla-entrenos.mjs) y la demo. Sin imports: Node lo carga directo.
 *
 * Criterio: principiante, ~3 entrenos por semana, ~55 min. Cada entreno trabaja
 * piernas, empuje y tirón. Las piernas cargan sobre todo con mancuernas, porque
 * la pila de la multigym (45 kg) queda corta pronto.
 *
 * Los pesos son una guía, no una regla: `kgGuia` es un punto de partida
 * orientativo para un principiante (en mancuernas, por mano) y los saltos son
 * aproximados. Se usa lo más cercano que se pueda armar.
 */

export type TipoCargaCatalogo = "pila" | "mancuerna" | "corporal" | "tiempo";

export type EjercicioCatalogo = {
  slug: string;
  nombre: string;
  equipo: string;
  grupo: "piernas" | "empuje" | "tirón" | "core";
  tipoCarga: TipoCargaCatalogo;
  repsMin: number;
  repsMax: number;
  incrementoKg: number | null;
  cargaMaxKg: number | null;
  kgGuia: number | null;
  nota: string | null;
};

/** Pila de la multigym Olmo Fit 90: hasta 45 kg, de a ~5 kg. */
export const PILA = { tipoCarga: "pila", incrementoKg: 5, cargaMaxKg: 45 } as const;
/** Mancuernas y discos variados: saltos de ~2 kg por mano, sin tope conocido. */
export const MANCUERNA = { tipoCarga: "mancuerna", incrementoKg: 2, cargaMaxKg: null } as const;
const CORPORAL = { tipoCarga: "corporal", incrementoKg: null, cargaMaxKg: null } as const;
const TIEMPO = { tipoCarga: "tiempo", incrementoKg: null, cargaMaxKg: null } as const;

export const EJERCICIOS: EjercicioCatalogo[] = [
  { slug: "sentadilla-goblet", nombre: "Sentadilla goblet", equipo: "mancuerna", grupo: "piernas", ...MANCUERNA, repsMin: 8, repsMax: 12, kgGuia: 10, nota: "una mancuerna" },
  { slug: "press-pecho", nombre: "Press de pecho", equipo: "multigym", grupo: "empuje", ...PILA, repsMin: 8, repsMax: 12, kgGuia: 20, nota: null },
  { slug: "remo-mancuerna", nombre: "Remo con mancuerna", equipo: "mancuerna y banco", grupo: "tirón", ...MANCUERNA, repsMin: 8, repsMax: 12, kgGuia: 10, nota: "por lado" },
  { slug: "peso-muerto-rumano", nombre: "Peso muerto rumano", equipo: "mancuernas", grupo: "piernas", ...MANCUERNA, repsMin: 8, repsMax: 12, kgGuia: 10, nota: null },
  { slug: "extension-cuadriceps", nombre: "Extensión de cuádriceps", equipo: "multigym", grupo: "piernas", ...PILA, repsMin: 10, repsMax: 15, kgGuia: 15, nota: null },
  { slug: "plancha", nombre: "Plancha", equipo: "peso corporal", grupo: "core", ...TIEMPO, repsMin: 30, repsMax: 60, kgGuia: null, nota: "segundos" },
  { slug: "sentadilla-bulgara", nombre: "Sentadilla búlgara", equipo: "mancuernas y banco", grupo: "piernas", ...MANCUERNA, repsMin: 8, repsMax: 12, kgGuia: 6, nota: "por pierna" },
  { slug: "press-inclinado", nombre: "Press inclinado", equipo: "mancuernas y banco", grupo: "empuje", ...MANCUERNA, repsMin: 8, repsMax: 12, kgGuia: 8, nota: null },
  { slug: "jalon-pecho", nombre: "Jalón al pecho", equipo: "multigym", grupo: "tirón", ...PILA, repsMin: 8, repsMax: 12, kgGuia: 25, nota: null },
  { slug: "hip-thrust", nombre: "Hip thrust", equipo: "mancuerna y banco", grupo: "piernas", ...MANCUERNA, repsMin: 10, repsMax: 15, kgGuia: 14, nota: "una mancuerna" },
  { slug: "dominadas", nombre: "Dominadas", equipo: "barra", grupo: "tirón", ...CORPORAL, repsMin: 3, repsMax: 8, kgGuia: null, nota: "negativas si todavía no salen" },
  { slug: "curl-femoral", nombre: "Curl femoral", equipo: "multigym", grupo: "piernas", ...PILA, repsMin: 10, repsMax: 15, kgGuia: 15, nota: null },
];

/** [slug, series, descanso en segundos] */
export type ItemPlantilla = [slug: string, series: number, descansoSeg: number];

export const PLANTILLAS: { nombre: string; orden: number; items: ItemPlantilla[] }[] = [
  {
    nombre: "Cuerpo completo A",
    orden: 1,
    items: [["sentadilla-goblet", 3, 120], ["press-pecho", 3, 120], ["remo-mancuerna", 3, 90], ["peso-muerto-rumano", 3, 120], ["extension-cuadriceps", 3, 75], ["plancha", 3, 60]],
  },
  {
    nombre: "Cuerpo completo B",
    orden: 2,
    items: [["sentadilla-bulgara", 3, 120], ["press-inclinado", 3, 120], ["jalon-pecho", 3, 90], ["hip-thrust", 3, 90], ["dominadas", 3, 120], ["curl-femoral", 3, 75]],
  },
];

/** El equipamiento de casa, como guía para la pantalla Datos. */
export const EQUIPAMIENTO: { nombre: string; detalle: string; uso: string }[] = [
  {
    nombre: "Multigym Olmo Fit 90",
    detalle: "Pila de hasta 45 kg, de a 5 kg aprox. Press de pecho, polea alta y baja, extensión de cuádriceps y curl femoral.",
    uso: "Empuje, tirón y accesorios. Para piernas queda corta pronto.",
  },
  {
    nombre: "Mancuernas y discos",
    detalle: "Pesos variados. La app sugiere saltos de unos 2 kg por mano: usá lo más cercano que puedas armar.",
    uso: "Piernas y casi todo el trabajo libre.",
  },
  { nombre: "Banco multiposición", detalle: "Plano, inclinado y declinado.", uso: "Press, remo, búlgaras y hip thrust." },
  { nombre: "Barra de dominadas", detalle: "Peso corporal: progresa por repeticiones.", uso: "Tirón vertical." },
  { nombre: "Espacio al aire libre", detalle: "Pasto y lugar para correr.", uso: "Cardio, sprints y partidos." },
];
