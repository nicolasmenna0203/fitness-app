import type { ResumenHoyDemo } from "@/types/hoy";

/**
 * Datos 100 % sintéticos para lo que Hoy todavía no puede leer de la base
 * (comidas y peso). También son los de la demo pública (ADR 0006): nunca poner
 * acá valores reales.
 */
export function resumenHoyDemo(): ResumenHoyDemo {
  return {
    kcal: { consumidas: 1860, meta: 2750 },
    proteina: { consumida: 84, meta: 120 },
    peso: { tendencia: 66.2, inicio: 66.0, meta: 70, ritmoSemanal: 0.28, ritmoObjetivo: 0.25, mesMeta: "abril" },
  };
}
