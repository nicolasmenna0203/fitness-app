import type { ResumenHoyDemo } from "@/types/hoy";

/**
 * Datos 100 % sintéticos para lo que Hoy todavía no puede leer de la base
 * (comidas). También son los de la demo pública (ADR 0006): nunca poner
 * acá valores reales.
 */
export function resumenHoyDemo(): ResumenHoyDemo {
  return {
    kcal: { consumidas: 1860, meta: 2750 },
    proteina: { consumida: 84, meta: 120 },
  };
}
