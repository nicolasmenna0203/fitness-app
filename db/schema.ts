/**
 * Esquema de la base (Postgres en Neon, ADR 0007). Nombres en snake_case en la
 * base y camelCase en TypeScript. Modelo completo: docs/producto/modelo-de-datos.md
 *
 * Cambios: editar este archivo, `npm run db:generate` y `npm run db:migrate`.
 */
import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const actualizado = () => timestamp({ withTimezone: true }).notNull().defaultNow();

/** Conexión con la Google Health API: una sola fila (app de un usuario). */
export const conexionGoogle = pgTable(
  "conexion_google",
  {
    id: smallint().primaryKey().default(1),
    /** Refresh token cifrado con AES-256-GCM (lib/cifrado.ts). Nunca en claro. */
    refreshTokenCifrado: text().notNull(),
    permisos: text().notNull(),
    conectadoEn: timestamp({ withTimezone: true }).notNull().defaultNow(),
    ultimaSync: timestamp({ withTimezone: true }),
    ultimoError: text(),
  },
  (t) => [check("una_sola_conexion", sql`${t.id} = 1`)],
);

/**
 * Resumen por día civil (hora local del usuario). `crudo` guarda la respuesta
 * original de cada tipo de dato, para poder releerla si cambia el formato.
 */
export const metricasDiarias = pgTable("metricas_diarias", {
  fecha: date().primaryKey(),
  pasos: integer(),
  kcalActivas: integer(),
  fcReposo: smallint(),
  vfcMs: real(),
  spo2Pct: real(),
  suenoMin: integer(),
  crudo: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  actualizado: actualizado(),
});

/** Sesiones de sueño (una noche puede tener siesta aparte). */
export const suenos = pgTable(
  "suenos",
  {
    id: text().primaryKey(), // identificador del dato en Google
    fecha: date().notNull(), // día civil en que terminó
    inicio: timestamp({ withTimezone: true }).notNull(),
    fin: timestamp({ withTimezone: true }).notNull(),
    minutosDormido: integer(),
    crudo: jsonb().$type<Record<string, unknown>>().notNull(),
    actualizado: actualizado(),
  },
  (t) => [index("suenos_fecha_idx").on(t.fecha)],
);

/** Actividades: ejercicios detectados por la pulsera o cargados a mano (partidos, cardio). */
export const actividades = pgTable(
  "actividades",
  {
    id: serial().primaryKey(),
    origen: text({ enum: ["google", "manual"] }).notNull(),
    externoId: text().unique(),
    tipo: text().notNull(),
    nombre: text(),
    fecha: date().notNull(),
    inicio: timestamp({ withTimezone: true }).notNull(),
    fin: timestamp({ withTimezone: true }).notNull(),
    kcal: integer(),
    fcMedia: smallint(),
    pasos: integer(),
    distanciaM: integer(),
    crudo: jsonb().$type<Record<string, unknown>>(),
    actualizado: actualizado(),
  },
  (t) => [index("actividades_fecha_idx").on(t.fecha)],
);
