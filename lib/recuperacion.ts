/**
 * Estado de recuperación a partir del sueño y la FC en reposo.
 *
 * Heurística propia y simple (umbrales arbitrarios, a calibrar con datos):
 *  - sueño ≥ 7 h suma, < 6 h resta;
 *  - FC en reposo hasta 1 lpm sobre el promedio de 14 días suma, 4 o más resta.
 * Total ≥ 1 → buena, 0 → media, < 0 → baja. Sin ningún dato → null.
 * Es una sugerencia para el entreno (ADR 0004), nunca un bloqueo.
 */
export type EstadoRecuperacion = "buena" | "media" | "baja";

export function estadoRecuperacion(suenoMin: number | null, fcReposo: number | null, fcPromedio: number | null): EstadoRecuperacion | null {
  const tieneFc = fcReposo !== null && fcPromedio !== null;
  if (suenoMin === null && !tieneFc) return null;
  let puntos = 0;
  if (suenoMin !== null) puntos += suenoMin >= 420 ? 1 : suenoMin < 360 ? -1 : 0;
  if (tieneFc) {
    const delta = fcReposo - fcPromedio;
    puntos += delta <= 1 ? 1 : delta >= 4 ? -1 : 0;
  }
  return puntos >= 1 ? "buena" : puntos === 0 ? "media" : "baja";
}
