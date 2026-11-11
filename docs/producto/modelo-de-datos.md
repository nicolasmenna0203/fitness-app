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

## Entrenamiento

| Tabla | Qué guarda | Clave |
|---|---|---|
| `ejercicios` | Catálogo: equipo, grupo, tipo de carga (pila, mancuerna, corporal, tiempo), rango de repeticiones, salto de carga y tope del equipo | `id`; `slug` único |
| `plantillas` | Entrenos de la rotación (A, B…) con su orden | `id`; `orden` único |
| `plantilla_ejercicios` | Ejercicios de cada plantilla: orden, series y descanso | (`plantilla_id`, `orden`) |
| `entrenos` | Cada sesión: plantilla, fecha, inicio y fin, si fue liviana, estado (en curso, terminado, descartado) | `id` |
| `series` | Cada serie hecha: kg (null sin carga externa) y repeticiones o segundos | `id`; única por (entreno, ejercicio, número) |

- La progresión mira solo entrenos **terminados**: uno descartado no cuenta.
- Terminar un entreno sin ninguna serie lo descarta.
- La rotación inicial se carga con `npm run db:semilla` (idempotente).

## Cuerpo y metas

| Tabla | Qué guarda | Clave |
|---|---|---|
| `perfil` | Peso meta, fecha meta, peso de partida y proteína por kg | Una sola fila (`id = 1`) |
| `pesajes` | Un peso por día, manual o de la balanza (el manual tiene prioridad) | `fecha` |
| `reportes_balanza` | Reportes de composición corporal: columnas para los campos principales y `valores` (jsonb) con todo lo leído | `id` |

- La tendencia del peso se calcula al leer (`lib/peso.ts`), no se guarda.
- Guardar un reporte registra su peso como pesaje de ese día, salvo que ya
  haya uno manual.

## Nutrición

| Tabla | Qué guarda | Clave |
|---|---|---|
| `comidas_frecuentes` | Comidas que se repiten: calorías, proteína y cantidad de usos (ordena la grilla) | `id` |
| `registros_comida` | Cada comida registrada: fecha, hora, calorías y proteína | `id` |
| `metas_calorias` | Historial de metas: cada fila vale desde `desde`, con el gasto estimado y el motivo del ajuste | `id`; `desde` único |

- Solo se pueden borrar registros del día: los anteriores alimentan el ajuste.
- Quitar una frecuente la oculta; los registros que la usaron se conservan.

## Próximas tablas

- Fotos de progreso.
