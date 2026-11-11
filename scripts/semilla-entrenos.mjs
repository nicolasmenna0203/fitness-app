/**
 * Carga el catálogo de ejercicios y la rotación inicial (lib/entrenos/catalogo.ts).
 * Idempotente: actualiza los ejercicios por slug y crea las plantillas solo si
 * no existen, así no pisa cambios hechos desde la app.
 *
 * Uso: npm run db:semilla   (lee DATABASE_URL de .env.local; Node 22.6+)
 */
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
import { EJERCICIOS, PLANTILLAS } from "../lib/entrenos/catalogo.ts";

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL en .env.local");
const sql = neon(process.env.DATABASE_URL);

for (const e of EJERCICIOS) {
  await sql`
    insert into ejercicios (slug, nombre, equipo, grupo, tipo_carga, reps_min, reps_max, incremento_kg, carga_max_kg, kg_guia, nota)
    values (${e.slug}, ${e.nombre}, ${e.equipo}, ${e.grupo}, ${e.tipoCarga}, ${e.repsMin}, ${e.repsMax}, ${e.incrementoKg}, ${e.cargaMaxKg}, ${e.kgGuia}, ${e.nota})
    on conflict (slug) do update set nombre = excluded.nombre, equipo = excluded.equipo, grupo = excluded.grupo, kg_guia = excluded.kg_guia, nota = excluded.nota`;
}
console.log(`✓ ${EJERCICIOS.length} ejercicios`);

for (const { nombre, orden, items } of PLANTILLAS) {
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
