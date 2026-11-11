/**
 * Modo demo: la copia pública con datos sintéticos (ADR 0006). Se activa con
 * DEMO=1 en ese despliegue; nunca en el de uso personal. Sin login, sin
 * conexión con Google y sin subida de fotos.
 */
export const esDemo = process.env.DEMO === "1";
