import type { EstadoRecuperacion } from "@/lib/recuperacion";

/** null en un campo = la pulsera todavía no tiene ese dato. */
export type Recuperacion = {
  estado: EstadoRecuperacion | null;
  suenoMin: number | null;
  fcReposo: number | null;
  fcReposoVsPromedio: number | null;
  variabilidadMs: number | null;
};

/** Lo que Hoy todavía muestra con datos sintéticos (secciones sin construir). */
export type ResumenHoyDemo = {
  kcal: { consumidas: number; meta: number };
  proteina: { consumida: number; meta: number };
  peso: { tendencia: number; ritmoSemanal: number; ritmoObjetivo: number; meta: number; inicio: number; mesMeta: string };
};
