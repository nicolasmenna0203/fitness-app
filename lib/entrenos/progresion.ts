/**
 * Progresión doble (ADR 0004): cada ejercicio tiene un rango de repeticiones;
 * cuando en la última sesión todas las series llegaron al tope del rango, se
 * sugiere subir la carga al siguiente salto del equipo y volver al piso del
 * rango. Si el equipo no da más (la pila de la multigym), se sugiere una
 * variante más difícil. Funciones puras: sin base ni red.
 */
import type { TipoCarga } from "@/db/schema";

export type ConfigEjercicio = {
  tipoCarga: TipoCarga;
  repsMin: number;
  repsMax: number;
  incrementoKg: number | null;
  cargaMaxKg: number | null;
  /** Peso orientativo para la primera vez; null = a elegir. */
  kgGuia?: number | null;
};

export type SerieHecha = { numero: number; kg: number | null; reps: number };

export type Motivo = "primera" | "subir" | "mantener" | "tope";

export type Sugerencia = {
  /** Carga sugerida; null = sin carga externa, o primera vez (se elige al empezar). */
  kg: number | null;
  /** Repeticiones (o segundos) objetivo para cada serie. */
  repsPorSerie: number[];
  motivo: Motivo;
  mensaje: string | null;
};

const PASO_TIEMPO = 5; // segundos que se suman por sesión en ejercicios por tiempo

export function conCarga(tipo: TipoCarga): boolean {
  return tipo === "pila" || tipo === "mancuerna";
}

export function fmtCarga(kg: number): string {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1).replace(".", ",");
}

/**
 * @param ultima series de la última sesión terminada con este ejercicio (vacío si nunca se hizo)
 * @param cantidad series a hacer hoy
 */
export function sugerir(ej: ConfigEjercicio, ultima: SerieHecha[], cantidad: number): Sugerencia {
  const n = Math.max(1, cantidad);
  const repetir = (r: number) => Array.from({ length: n }, () => r);
  const unidad = ej.tipoCarga === "tiempo" ? "s" : "";

  if (ultima.length === 0) {
    const guia = conCarga(ej.tipoCarga) ? (ej.kgGuia ?? null) : null;
    const porMano = ej.tipoCarga === "mancuerna" ? " por mano" : "";
    return {
      kg: guia,
      repsPorSerie: repetir(ej.repsMin),
      motivo: "primera",
      mensaje: !conCarga(ej.tipoCarga)
        ? null
        : guia !== null
          ? `Primera vez: arrancá con unos ${fmtCarga(guia)} kg${porMano}, como guía. Si las ${ej.repsMin} repeticiones salen fáciles, subí; si cuesta la técnica, bajá.`
          : `Primera vez: elegí un peso con el que llegues a ${ej.repsMin} repeticiones con buena técnica.`,
    };
  }

  const ordenadas = [...ultima].sort((a, b) => a.numero - b.numero);
  const completo = ordenadas.every((s) => s.reps >= ej.repsMax);
  const siguiente = (i: number) => {
    const previa = ordenadas[Math.min(i, ordenadas.length - 1)].reps;
    const paso = ej.tipoCarga === "tiempo" ? PASO_TIEMPO : 1;
    return Math.min(ej.repsMax, Math.max(ej.repsMin, previa + paso));
  };
  const progresar = Array.from({ length: n }, (_, i) => siguiente(i));

  if (!conCarga(ej.tipoCarga)) {
    if (completo) {
      return {
        kg: null,
        repsPorSerie: repetir(ej.repsMax),
        motivo: "tope",
        mensaje:
          ej.tipoCarga === "tiempo"
            ? `Llegaste a ${ej.repsMax}${unidad}: pasá a una variante más difícil.`
            : "Completaste el máximo: pasá a una variante más difícil (más lenta, con pausa arriba).",
      };
    }
    return { kg: null, repsPorSerie: progresar, motivo: "mantener", mensaje: null };
  }

  const kg = ordenadas[0].kg ?? null;
  if (kg === null) return { kg: null, repsPorSerie: progresar, motivo: "mantener", mensaje: null };

  if (!completo) return { kg, repsPorSerie: progresar, motivo: "mantener", mensaje: null };

  const inc = ej.incrementoKg ?? 0;
  const tope = ej.cargaMaxKg;
  if (inc <= 0 || (tope !== null && kg >= tope)) {
    return {
      kg,
      repsPorSerie: repetir(ej.repsMax),
      motivo: "tope",
      mensaje: "Estás en el tope del equipo: hacelo más lento, con pausa o a un brazo o una pierna.",
    };
  }
  const nuevo = tope !== null ? Math.min(kg + inc, tope) : kg + inc;
  return {
    kg: nuevo,
    repsPorSerie: repetir(ej.repsMin),
    motivo: "subir",
    mensaje: `Subí a ${fmtCarga(nuevo)} kg: la última vez completaste ${ordenadas.length} × ${ej.repsMax} con ${fmtCarga(kg)} kg.`,
  };
}

/** Series de hoy: la versión liviana hace una menos (mínimo una). */
export function seriesDeHoy(series: number, liviana: boolean): number {
  return liviana ? Math.max(1, series - 1) : series;
}

/** Siguiente entreno de la rotación según el último terminado. */
export function siguientePlantilla<T extends { id: number; orden: number }>(activas: T[], ultimaPlantillaId: number | null): T | null {
  if (activas.length === 0) return null;
  const orden = [...activas].sort((a, b) => a.orden - b.orden);
  const i = orden.findIndex((p) => p.id === ultimaPlantillaId);
  return i === -1 ? orden[0] : orden[(i + 1) % orden.length];
}

export type ActividadReciente = { tipo: string; nombre: string | null; minutos: number };

/** Actividades que no cargan las piernas ni el cuerpo como para cambiar el entreno. */
const LIVIANAS = new Set(["WALKING", "YOGA", "STRETCHING", "MEDITATION"]);

/**
 * Motivo para sugerir la versión liviana, o null. Es una sugerencia: el usuario
 * decide con el interruptor.
 */
export function motivoLiviana(actividadesAyer: ActividadReciente[], recuperacion: "buena" | "media" | "baja" | null): string | null {
  const deporte = actividadesAyer.find((a) => a.minutos >= 40 && !LIVIANAS.has(a.tipo));
  if (deporte) return `Ayer: ${(deporte.nombre ?? deporte.tipo).toLowerCase()} (${Math.round(deporte.minutos)} min).`;
  if (recuperacion === "baja") return "Tu recuperación está baja hoy.";
  return null;
}
