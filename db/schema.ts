/**
 * Esquema de la base (Postgres en Neon, ADR 0007). Nombres en snake_case en la
 * base y camelCase en TypeScript. Modelo completo: docs/producto/modelo-de-datos.md
 *
 * Cambios: editar este archivo, `npm run db:generate` y `npm run db:migrate`.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  serial,
  smallint,
  text,
  timestamp,
  unique,
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

// ─── Entrenamiento (ADR 0004) ────────────────────────────────────────────────

/**
 * Cómo se carga un ejercicio, que define cómo progresa:
 *  - pila: peso de la pila de la multigym (saltos fijos, con tope)
 *  - mancuerna: kg por mano
 *  - corporal: sin carga externa; progresa por repeticiones
 *  - tiempo: segundos en vez de repeticiones (plancha)
 */
export const TIPOS_CARGA = ["pila", "mancuerna", "corporal", "tiempo"] as const;
export type TipoCarga = (typeof TIPOS_CARGA)[number];

/** Catálogo de ejercicios con el equipamiento de casa. */
export const ejercicios = pgTable("ejercicios", {
  id: serial().primaryKey(),
  slug: text().notNull().unique(),
  nombre: text().notNull(),
  equipo: text().notNull(),
  grupo: text().notNull(),
  tipoCarga: text({ enum: TIPOS_CARGA }).notNull(),
  /** Rango objetivo: repeticiones, o segundos si tipoCarga = tiempo. */
  repsMin: smallint().notNull(),
  repsMax: smallint().notNull(),
  /** Salto de carga al progresar (kg; por mano en mancuernas). */
  incrementoKg: real(),
  /** Tope del equipo (la pila de la multigym); null = sin tope conocido. */
  cargaMaxKg: real(),
  /** "por lado" en ejercicios unilaterales. */
  nota: text(),
});

/** Entrenos de la rotación (A, B…): se hacen en orden, sin días fijos. */
export const plantillas = pgTable("plantillas", {
  id: serial().primaryKey(),
  nombre: text().notNull(),
  orden: smallint().notNull().unique(),
  activa: boolean().notNull().default(true),
});

export const plantillaEjercicios = pgTable(
  "plantilla_ejercicios",
  {
    plantillaId: integer()
      .notNull()
      .references(() => plantillas.id, { onDelete: "cascade" }),
    orden: smallint().notNull(),
    ejercicioId: integer()
      .notNull()
      .references(() => ejercicios.id),
    series: smallint().notNull(),
    descansoSeg: smallint().notNull().default(90),
  },
  (t) => [primaryKey({ columns: [t.plantillaId, t.orden] })],
);

export const ESTADOS_ENTRENO = ["en_curso", "terminado", "descartado"] as const;

export const entrenos = pgTable(
  "entrenos",
  {
    id: serial().primaryKey(),
    plantillaId: integer()
      .notNull()
      .references(() => plantillas.id),
    fecha: date().notNull(),
    inicio: timestamp({ withTimezone: true }).notNull().defaultNow(),
    fin: timestamp({ withTimezone: true }),
    liviana: boolean().notNull().default(false),
    estado: text({ enum: ESTADOS_ENTRENO }).notNull().default("en_curso"),
  },
  (t) => [index("entrenos_fecha_idx").on(t.fecha)],
);

export const series = pgTable(
  "series",
  {
    id: serial().primaryKey(),
    entrenoId: integer()
      .notNull()
      .references(() => entrenos.id, { onDelete: "cascade" }),
    ejercicioId: integer()
      .notNull()
      .references(() => ejercicios.id),
    numero: smallint().notNull(),
    /** null en ejercicios sin carga externa. */
    kg: real(),
    /** Repeticiones, o segundos si el ejercicio es por tiempo. */
    reps: smallint().notNull(),
    hechaEn: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("series_unica").on(t.entrenoId, t.ejercicioId, t.numero), index("series_ejercicio_idx").on(t.ejercicioId)],
);

// ─── Cuerpo y metas (ADR 0005) ───────────────────────────────────────────────

/** Perfil y meta: una sola fila. Datos personales: viven solo en la base. */
export const perfil = pgTable(
  "perfil",
  {
    id: smallint().primaryKey().default(1),
    pesoMetaKg: real().notNull(),
    fechaMeta: date().notNull(),
    /** Peso al fijar la meta: punto de partida de la barra de avance. */
    pesoInicialKg: real().notNull(),
    proteinaGPorKg: real().notNull().default(1.8),
    actualizado: actualizado(),
  },
  (t) => [check("un_solo_perfil", sql`${t.id} = 1`)],
);

/** Un pesaje por día (el último del día manda). */
export const pesajes = pgTable("pesajes", {
  fecha: date().primaryKey(),
  kg: real().notNull(),
  origen: text({ enum: ["manual", "balanza"] }).notNull(),
  actualizado: actualizado(),
});

/**
 * Reportes de la balanza de composición corporal. Los campos principales van en
 * columnas para graficarlos; `valores` guarda todo lo leído del reporte.
 */
export const reportesBalanza = pgTable(
  "reportes_balanza",
  {
    id: serial().primaryKey(),
    fecha: date().notNull(),
    kg: real().notNull(),
    grasaPct: real(),
    masaMuscularKg: real(),
    musculoEsqueleticoKg: real(),
    aguaPct: real(),
    grasaVisceral: real(),
    basalKcal: integer(),
    valores: jsonb().$type<Record<string, number>>().notNull().default({}),
    creado: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reportes_balanza_fecha_idx").on(t.fecha)],
);
