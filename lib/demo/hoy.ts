import type { ResumenHoy } from "@/types/hoy";

/**
 * Datos 100 % sintéticos para la pantalla Hoy, hasta que exista la base de datos.
 * También son los de la demo pública (ADR 0006): nunca poner acá valores reales.
 */
export function resumenHoyDemo(): ResumenHoy {
  return {
    fecha: "Martes 10 de noviembre",
    proximo: {
      nombre: "Cuerpo completo A",
      minutos: 55,
      sugerenciaLiviana: "Ayer jugaste al fútbol.",
      ejercicios: [
        { nombre: "Sentadilla goblet", equipo: "mancuerna", series: 3, reps: "10", carga: "22 kg" },
        { nombre: "Remo en polea baja", equipo: "multigym", series: 3, reps: "8–12", carga: "30 kg" },
        { nombre: "Press inclinado", equipo: "mancuernas y banco", series: 3, reps: "8–12", carga: "14 kg c/u" },
        { nombre: "Peso muerto rumano", equipo: "mancuernas", series: 3, reps: "10", carga: "18 kg c/u" },
        { nombre: "Jalón al pecho", equipo: "multigym", series: 3, reps: "10", carga: "35 kg" },
        { nombre: "Plancha", equipo: "peso corporal", series: 3, reps: "40 s", carga: "—" },
      ],
    },
    entrenos7Dias: 2,
    metaEntrenosSemana: 3,
    kcal: { consumidas: 1860, meta: 2750 },
    proteina: { consumida: 84, meta: 120 },
    recuperacion: { estado: "media", suenoMin: 385, fcReposo: 64, fcReposoVsPromedio: 3, variabilidadMs: 48 },
    peso: { tendencia: 66.2, inicio: 66.0, meta: 70, ritmoSemanal: 0.28, ritmoObjetivo: 0.25, mesMeta: "abril" },
  };
}
