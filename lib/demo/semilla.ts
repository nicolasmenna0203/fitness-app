import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  actividades,
  comidasFrecuentes,
  ejercicios,
  entrenos,
  metasCalorias,
  metricasDiarias,
  perfil,
  pesajes,
  plantillaEjercicios,
  plantillas,
  registrosComida,
  reportesBalanza,
  series,
  suenos,
} from "@/db/schema";
import { EJERCICIOS, PLANTILLAS } from "@/lib/entrenos/catalogo";
import { fechaLocal, sumarDias } from "@/lib/fecha";
import { esDemo } from "./index";

/**
 * Datos sintéticos de la demo pública (ADR 0006). Se regeneran cada día desde
 * el cron, relativos a la fecha de hoy, así la demo nunca envejece y lo que
 * cargue un visitante dura hasta el día siguiente.
 *
 * Ningún valor sale de datos reales: todo es inventado con un generador
 * pseudoaleatorio de semilla fija.
 *
 * Doble candado para no tocar nunca la base real: el despliegue tiene que tener
 * DEMO=1 y la base tiene que tener la tabla `demo_marca`, que solo se crea a
 * mano en la base de la demo y no está en el esquema.
 */

const DIAS = 70;
/** Zona de la demo: Buenos Aires, UTC−3 todo el año. */
const OFFSET_H = 3;

/** mulberry32: pseudoaleatorio reproducible. */
function generador(semilla: number) {
  let a = semilla;
  const r = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    r,
    entre: (min: number, max: number) => min + r() * (max - min),
    entero: (min: number, max: number) => Math.floor(min + r() * (max - min + 1)),
    ruido: (desvio: number) => (r() + r() + r() - 1.5) * desvio * 1.4,
  };
}

/** Instante de una hora local de la demo en una fecha civil. */
const aLas = (fecha: string, hora: number, min = 0) => new Date(Date.UTC(+fecha.slice(0, 4), +fecha.slice(5, 7) - 1, +fecha.slice(8, 10), hora + OFFSET_H, min));
const r1 = (n: number) => Math.round(n * 10) / 10;

export async function regenerarDemo(): Promise<Record<string, number>> {
  if (!esDemo) throw new Error("Solo en el despliegue de la demo (DEMO=1).");
  const marca = await db().execute<{ t: string | null }>(sql`select to_regclass('public.demo_marca')::text as t`);
  if (!marca.rows[0]?.t) throw new Error("Esta base no tiene la tabla demo_marca: no es la base de la demo.");

  await db().execute(sql`truncate table series, entrenos, plantilla_ejercicios, plantillas, ejercicios, registros_comida,
    comidas_frecuentes, metas_calorias, pesajes, reportes_balanza, perfil, actividades, suenos, metricas_diarias, fotos,
    conexion_google restart identity cascade`);

  const g = generador(20261111);
  const hoy = fechaLocal();
  const dias = Array.from({ length: DIAS }, (_, i) => sumarDias(hoy, i - DIAS + 1)); // incluye hoy
  const pasados = dias.slice(0, -1);

  // Fútbol una vez por semana (el pádel, alguna); caminatas sueltas.
  const futbol = new Set(pasados.filter((_, i) => (DIAS - 1 - i) % 7 === 3));
  const acts: (typeof actividades.$inferInsert)[] = [];
  for (const f of pasados) {
    if (futbol.has(f)) {
      const padel = g.r() < 0.25;
      const min = padel ? 60 : g.entero(60, 80);
      const inicio = aLas(f, 20);
      acts.push({ origen: "google", externoId: `demo-${f}`, tipo: padel ? "PADEL" : "SOCCER", nombre: padel ? "Pádel" : "Fútbol", fecha: f, inicio, fin: new Date(+inicio + min * 60_000), kcal: g.entero(420, 620), fcMedia: g.entero(135, 150) });
    } else if (g.r() < 0.3) {
      const min = g.entero(25, 50);
      const inicio = aLas(f, 9, 30);
      acts.push({ origen: "google", externoId: `demo-cam-${f}`, tipo: "WALKING", nombre: "Caminar", fecha: f, inicio, fin: new Date(+inicio + min * 60_000), kcal: g.entero(90, 180), pasos: min * 105 });
    }
  }

  // Pulsera: pasos, calorías activas, FC en reposo, variabilidad y sueño.
  const metricas: (typeof metricasDiarias.$inferInsert)[] = [];
  const noches: (typeof suenos.$inferInsert)[] = [];
  dias.forEach((f, i) => {
    const deporte = futbol.has(sumarDias(f, -1));
    const sueno = Math.round(g.entre(375, 470) - (deporte ? 15 : 0));
    const esHoy = f === hoy;
    metricas.push({
      fecha: f,
      pasos: esHoy ? g.entero(2500, 4000) : g.entero(6000, 11500) + (futbol.has(f) ? 4000 : 0),
      kcalActivas: esHoy ? g.entero(150, 250) : g.entero(380, 620) + (futbol.has(f) ? 450 : 0),
      fcReposo: Math.round(61 - i * 0.03 + g.ruido(1.2) + (deporte ? 2 : 0)),
      vfcMs: r1(52 + g.ruido(6) - (deporte ? 6 : 0)),
      spo2Pct: r1(g.entre(96, 98.5)),
      suenoMin: sueno,
    });
    const inicio = aLas(sumarDias(f, -1), 23, g.entero(0, 50));
    noches.push({ id: `demo-${f}`, fecha: f, inicio, fin: new Date(+inicio + (sueno + 25) * 60_000), minutosDormido: sueno, crudo: {} });
  });

  // Peso: de 63 kg hacia una meta de 68 kg, ~0,28 kg por semana, con ruido diario y días sin pesarse.
  const pesos: (typeof pesajes.$inferInsert)[] = [];
  dias.forEach((f, i) => {
    if (i < DIAS - 1 && g.r() < 0.2) return;
    pesos.push({ fecha: f, kg: r1(63 + i * 0.04 + g.ruido(0.3)), origen: "manual" });
  });
  const reportes = [63, 35, 7].map((atras, k) => ({
    fecha: sumarDias(hoy, -atras),
    kg: r1(63 + (DIAS - 1 - atras) * 0.04),
    grasaPct: [14.6, 14.4, 14.3][k],
    masaMuscularKg: [50.9, 51.6, 52.4][k],
    musculoEsqueleticoKg: [27.9, 28.3, 28.8][k],
    aguaPct: [57.8, 58.0, 58.1][k],
    grasaVisceral: 5,
    basalKcal: [1575, 1590, 1610][k],
    valores: {},
  }));

  // Entrenos: catálogo real, rotación A/B, ~3 por semana, con progresión doble simulada.
  const ejs = EJERCICIOS.map((e, i) => ({ id: i + 1, ...e }));
  const idDe = new Map(ejs.map((e) => [e.slug, e.id]));
  const pls = PLANTILLAS.map((p, i) => ({ id: i + 1, ...p }));
  const estado = new Map(ejs.map((e) => [e.id, { kg: e.kgGuia, reps: e.repsMin }]));
  const ents: (typeof entrenos.$inferInsert)[] = [];
  const sers: (typeof series.$inferInsert)[] = [];
  let ultimoEntreno = -9;
  let turno = 0;
  pasados.forEach((f, i) => {
    if (futbol.has(f) || i - ultimoEntreno < 2 || (i - ultimoEntreno === 2 && g.r() < 0.35)) return;
    ultimoEntreno = i;
    const p = pls[turno++ % pls.length];
    const id = ents.length + 1;
    const liviana = futbol.has(sumarDias(f, -1));
    const inicio = aLas(f, 18, g.entero(0, 40));
    ents.push({ id, plantillaId: p.id, fecha: f, inicio, fin: new Date(+inicio + g.entero(48, 62) * 60_000), liviana, estado: "terminado" });
    let t = +inicio;
    for (const [slug, nSeries, descanso] of p.items) {
      const ej = ejs.find((e) => e.slug === slug)!;
      const s = estado.get(ej.id)!;
      const n = liviana ? nSeries - 1 : nSeries;
      const paso = ej.tipoCarga === "tiempo" ? 5 : 1;
      const hechas = Array.from({ length: n }, (_, k) => Math.min(ej.repsMax, Math.max(ej.repsMin, s.reps - (k === n - 1 && g.r() < 0.4 ? paso : 0))));
      hechas.forEach((reps, k) => {
        t += (descanso + 40) * 1000;
        sers.push({ entrenoId: id, ejercicioId: ej.id, numero: k + 1, kg: s.kg, reps, hechaEn: new Date(t) });
      });
      // La próxima vez: si completó el tope en todas, sube el peso; si no, una repetición más.
      if (hechas.every((r) => r >= ej.repsMax) && ej.incrementoKg && s.kg !== null) {
        s.kg = Math.min(s.kg + ej.incrementoKg, ej.cargaMaxKg ?? Infinity);
        s.reps = ej.repsMin;
      } else {
        s.reps = Math.min(ej.repsMax, s.reps + (g.r() < 0.75 ? paso : 0));
      }
    }
  });

  // Comidas: un menú de comidas frecuentes y ~2600 kcal por día, con algún día sin registrar.
  const menu = [
    { nombre: "Avena con banana", kcal: 450, proteinaG: 14 },
    { nombre: "Tostadas con huevo", kcal: 380, proteinaG: 18 },
    { nombre: "Pollo con arroz", kcal: 680, proteinaG: 40 },
    { nombre: "Milanesa con puré", kcal: 760, proteinaG: 36 },
    { nombre: "Yogur con granola", kcal: 320, proteinaG: 12 },
    { nombre: "Licuado de proteína", kcal: 290, proteinaG: 25 },
    { nombre: "Fideos con carne", kcal: 820, proteinaG: 32 },
    { nombre: "Sándwich de jamón y queso", kcal: 430, proteinaG: 20 },
    { nombre: "Mate con facturas", kcal: 400, proteinaG: 7 },
  ].map((m, i) => ({ id: i + 1, ...m, usos: 0 }));
  const comidas: (typeof registrosComida.$inferInsert)[] = [];
  const registrar = (f: string, hora: number, m: (typeof menu)[number]) => {
    m.usos++;
    comidas.push({ fecha: f, hora: aLas(f, hora, g.entero(0, 45)), nombre: m.nombre, kcal: m.kcal, proteinaG: m.proteinaG, frecuenteId: m.id });
  };
  for (const f of dias.slice(-56)) {
    const esHoy = f === hoy;
    if (!esHoy && g.r() < 0.12) continue;
    registrar(f, 8, menu[g.entero(0, 1)]);
    registrar(f, 13, menu[g.entero(2, 3)]);
    if (esHoy) continue;
    registrar(f, 17, menu[g.entero(4, 5)]);
    if (g.r() < 0.3) registrar(f, 18, menu[8]);
    registrar(f, 21, menu[[2, 3, 6][g.entero(0, 2)]]);
    if (g.r() < 0.5) registrar(f, 23, menu[7]);
  }

  // Metas de calorías: la inicial hace 8 semanas y un ajuste cada 7 días; el último, ayer.
  const ajustes = [0, 100, 0, 50, 100, 0, -50, 100];
  const motivos: Record<string, string> = {
    "0": "La semana pasada fue según lo previsto: la meta sigue igual.",
    "50": "La semana pasada aumentaste menos de lo previsto: +50 kcal por día.",
    "100": "La semana pasada aumentaste menos de lo previsto: +100 kcal por día.",
    "-50": "La semana pasada aumentaste más de lo previsto: -50 kcal por día.",
  };
  let kcal = 2450;
  const metas = ajustes.map((d, k) => {
    const desde = sumarDias(hoy, -1 - 7 * (ajustes.length - 1 - k));
    if (k === 0) return { desde, kcal, gastoEstimado: 2180, motivo: "Calculada con el metabolismo basal de tu balanza y tu actividad de la pulsera. Se ajusta cada semana." };
    kcal += d;
    return { desde, kcal, gastoEstimado: kcal - 270, motivo: motivos[String(d)] };
  });

  const d = db();
  await d.insert(perfil).values({ id: 1, pesoMetaKg: 68, fechaMeta: sumarDias(hoy, 75), pesoInicialKg: 63, proteinaGPorKg: 1.8 });
  await d.insert(pesajes).values(pesos);
  await d.insert(reportesBalanza).values(reportes);
  await d.insert(metricasDiarias).values(metricas);
  await d.insert(suenos).values(noches);
  await d.insert(actividades).values(acts);
  await d.insert(ejercicios).values(ejs);
  await d.insert(plantillas).values(pls.map((p) => ({ id: p.id, nombre: p.nombre, orden: p.orden })));
  await d.insert(plantillaEjercicios).values(
    pls.flatMap((p) => p.items.map(([slug, nSeries, descansoSeg], i) => ({ plantillaId: p.id, orden: i + 1, ejercicioId: idDe.get(slug)!, series: nSeries, descansoSeg }))),
  );
  await d.insert(entrenos).values(ents);
  await d.insert(series).values(sers);
  await d.insert(comidasFrecuentes).values(menu);
  await d.insert(registrosComida).values(comidas);
  await d.insert(metasCalorias).values(metas);
  // Los ids se cargaron a mano: las secuencias siguen desde el máximo.
  for (const t of ["ejercicios", "plantillas", "entrenos", "comidas_frecuentes"]) {
    await d.execute(sql.raw(`select setval(pg_get_serial_sequence('${t}', 'id'), (select max(id) from ${t}))`));
  }

  return { pesajes: pesos.length, entrenos: ents.length, series: sers.length, comidas: comidas.length, actividades: acts.length, dias: metricas.length };
}
