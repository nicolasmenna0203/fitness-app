# Modelo de datos

Postgres en Neon, definido en [db/schema.ts](../../db/schema.ts). Las tablas se
agregan a medida que se construye cada sección.

## Hoy

| Tabla | Qué guarda | Clave |
|---|---|---|
| `conexion_google` | Refresh token de Google (cifrado), permisos, última sincronización y último error | Una sola fila (`id = 1`) |
| `metricas_diarias` | Por día civil: pasos, calorías activas, FC en reposo, variabilidad, oxígeno, minutos de sueño; `crudo` con las respuestas diarias de Google | `fecha` |
| `suenos` | Sesiones de sueño con inicio, fin y minutos dormido | id del dato en Google |
| `actividades` | Ejercicios detectados por la pulsera (y en el futuro cargados a mano): tipo, duración, calorías, FC media, pasos, distancia | `id`; `externo_id` único para los de Google |

## Sincronización con Google

- **Cuándo:** al abrir la app si pasaron 15 minutos desde la última, con
  "Sincronizar ahora" en Datos y un cron diario de respaldo (`/api/cron/sync`).
- **Qué rango:** los últimos 3 días (7 con el botón, 14 al conectar). Los días
  del rango se sobrescriben con lo que diga Google, que es la fuente de verdad
  para estos datos.
- **Fallas parciales:** si un tipo de dato falla, los demás se guardan igual y
  el error queda en `conexion_google.ultimo_error`.
- **Día civil:** los datos se agrupan por la fecha local que informa Google, no
  por la fecha del servidor.

## Próximas tablas

- Entrenos: catálogo de ejercicios y equipamiento, plantillas de la rotación,
  entrenos y series.
- Nutrición: comidas frecuentes y registro diario.
- Cuerpo: pesajes, reportes de la balanza y fotos.
- Metas: peso objetivo, fecha y ajustes semanales de calorías.
