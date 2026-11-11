import type { EstadoRecuperacion } from "@/lib/recuperacion";

/** null en un campo = la pulsera todavía no tiene ese dato. */
export type Recuperacion = {
  estado: EstadoRecuperacion | null;
  suenoMin: number | null;
  fcReposo: number | null;
  fcReposoVsPromedio: number | null;
  variabilidadMs: number | null;
};
