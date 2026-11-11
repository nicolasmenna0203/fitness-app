/**
 * Carga el catálogo de ejercicios y la rotación inicial (A/B de cuerpo completo).
 * Idempotente: actualiza los ejercicios por slug y crea las plantillas solo si
 * no existen, así no pisa cambios hechos desde la app.
 *
 * Uso: node scripts/semilla-entrenos.mjs   (lee DATABASE_URL de .env.local)
 *
 * Criterio (ADR 0004): principiante, ~3 entrenos por semana, ~55 min. Cada
 * entreno trabaja piernas, empuje y tirón. Las piernas cargan sobre todo con
 * mancuernas, porque la pila de la multigym (45 kg) queda corta pronto.
 * Saltos de carga supuestos: 5 kg en la pila, 2 kg por mano en mancuernas;
 * se ajustan en la base si el equipo real difiere.
 */
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL en .env.local");
const sql = neon(process.env.DATABASE_URL);

const PILA = { tipo: "pila", inc: 5, max: 45 };
const MANC = { tipo: "mancuerna", inc: 2, max: null };

// slug, nombre, equipo, grupo, carga, repsMin, repsMax, nota
const EJERCICIOS = [
  ["sentadilla-goblet", "Sentadilla goblet", "mancuerna", "piernas", MANC, 8, 12, null],
  ["press-pecho", "Press de pecho", "multigym", "empuje", PILA, 8, 12, null],
  ["remo-mancuerna", "Remo con mancuerna", "mancuerna y banco", "tirón", MANC, 8, 12, "por lado"],
  ["peso-muerto-rumano", "Peso muerto rumano", "mancuernas", "piernas", MANC, 8, 12, null],
  ["extension-cuadriceps", "Extensión de cuádriceps", "multigym", "piernas", PILA, 10, 15, null],
  ["plancha", "Plancha", "peso corporal", "core", { tipo: "tiempo", inc: null, max: null }, 30, 60, "segundos"],
  ["sentadilla-bulgara", "Sentadilla búlgara", "mancuernas y banco", "piernas", MANC, 8, 12, "por pierna"],
  ["press-inclinado", "Press inclinado", "mancuernas y banco", "empuje", MANC, 8, 12, null],
  ["jalon-pecho", "Jalón al pecho", "multigym", "tirón", PILA, 8, 12, null],
  ["hip-thrust", "Hip thrust", "mancuerna y banco", "piernas", MANC, 10, 15, null],
  ["dominadas", "Dominadas", "barra", "tirón", { tipo: "corporal", inc: null, max: null }, 3, 8, "con banda si hace falta"],
  ["curl-femoral", "Curl femoral", "multigym", "piernas", PILA, 10, 15, null],
];

// nombre, orden, [slug, series, descanso en segundos]
const PLANTILLAS = [
  ["Cuerpo completo A", 1, [["sentadilla-goblet", 3, 120], ["press-pecho", 3, 120], ["remo-mancuerna", 3, 90], ["peso-muerto-rumano", 3, 120], ["extension-cuadriceps", 3, 75], ["plancha", 3, 60]]],
  ["Cuerpo completo B", 2, [["sentadilla-bulgara", 3, 120], ["press-inclinado", 3, 120], ["jalon-pecho", 3, 90], ["hip-thrust", 3, 90], ["dominadas", 3, 120], ["curl-femoral", 3, 75]]],
];

for (const [slug, nombre, equipo, grupo, c, min, max, nota] of EJERCICIOS) {
  await sql`
    insert into ejercicios (slug, nombre, equipo, grupo, tipo_carga, reps_min, reps_max, incremento_kg, carga_max_kg, nota)
    values (${slug}, ${nombre}, ${equipo}, ${grupo}, ${c.tipo}, ${min}, ${max}, ${c.inc}, ${c.max}, ${nota})
    on conflict (slug) do update set nombre = excluded.nombre, equipo = excluded.equipo, grupo = excluded.grupo, nota = excluded.nota`;
}
console.log(`✓ ${EJERCICIOS.length} ejercicios`);

for (const [nombre, orden, items] of PLANTILLAS) {
  const existe = await sql`select id from plantillas where orden = ${orden}`;
  if (existe.length) {
    console.log(`· ${nombre}: ya existe, no se toca`);
    continue;
  }
  const [{ id }] = await sql`insert into plantillas (nombre, orden) values (${nombre}, ${orden}) returning id`;
  for (const [i, [slug, seriesN, descanso]] of items.entries()) {
    await sql`
      insert into plantilla_ejercicios (plantilla_id, orden, ejercicio_id, series, descanso_seg)
      select ${id}, ${i + 1}, id, ${seriesN}, ${descanso} from ejercicios where slug = ${slug}`;
  }
  console.log(`✓ ${nombre}: ${items.length} ejercicios`);
}
