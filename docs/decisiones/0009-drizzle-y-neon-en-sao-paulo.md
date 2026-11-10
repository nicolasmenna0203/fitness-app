---
numero: 0009
titulo: Drizzle con el driver HTTP de Neon, base y funciones en São Paulo
estado: Aceptada
fecha: 2026-11-10
codigo: db/schema.ts, db/index.ts, drizzle.config.ts, vercel.json
---

# 0009 — Drizzle con el driver HTTP de Neon, base y funciones en São Paulo

## Contexto

La base es Postgres en Neon (ADR 0007), creada desde el marketplace de Vercel
en el plan gratuito. Las funciones de Vercel son efímeras: abrir una conexión
TCP por pedido es lento y agota conexiones. El usuario está en Argentina, y por
defecto Vercel ejecuta en EE. UU. (Virginia). Hacen falta tipos de TypeScript
para el esquema y migraciones versionadas.

## Alternativas descartadas

- **Prisma** — motor más pesado y generación de cliente aparte; para un esquema
  chico, Drizzle da tipos equivalentes con SQL más visible.
- **SQL a mano con `@neondatabase/serverless`** — sin tipos del esquema ni
  migraciones; los errores de columnas aparecen en producción.
- **Driver por WebSocket o TCP (`pg`)** — necesita conexiones persistentes o
  pooling externo; el HTTP alcanza para consultas cortas sin transacciones
  interactivas.
- **Región por defecto (Virginia)** — unos 100 ms más por pedido desde Argentina,
  en cada consulta.

## Decisión

- **Drizzle ORM** con `drizzle-orm/neon-http`. Nombres `snake_case` en la base y
  `camelCase` en TypeScript (`casing: "snake_case"`).
- **Migraciones** con drizzle-kit en `db/migraciones/`, versionadas.
  `npm run db:generate` y `npm run db:migrate`; la migración usa la conexión
  directa (`DATABASE_URL_UNPOOLED`) y la app, la del pooler (`DATABASE_URL`).
- **Base en `sa-east-1` (São Paulo)** y funciones en **`gru1`** (`vercel.json`):
  las dos en la misma región y cerca del usuario.
- **Secretos guardados en la base** (el refresh token de Google) cifrados con
  AES-256-GCM y una clave fuera de la base (`TOKEN_KEY`, `lib/cifrado.ts`).
- Las respuestas originales de Google se guardan en columnas `crudo` (jsonb)
  para poder releerlas si cambia o se corrige el formato.

## Consecuencias y límites

- **Límite:** el driver HTTP no soporta transacciones interactivas; si hacen
  falta, usar `neon-serverless` (WebSocket) para esa operación.
- **Límite:** desarrollo local y producción usan la **misma base**: lo que se
  pruebe en local escribe datos reales. Se puede separar con una rama de Neon
  cuando haga falta.
- **Límite:** el plan gratuito de Neon suspende la base sin uso; la primera
  consulta después tarda un poco más.
- **Revisar si:** aparecen operaciones que necesiten transacciones, o el volumen
  de datos por minuto (FC intradía) hace conveniente otra estrategia.
