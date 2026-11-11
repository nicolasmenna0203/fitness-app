/**
 * Lector de reportes de la balanza de composición corporal (ADR 0003).
 *
 * Recibe lo que sale del OCR (palabras con su posición) o texto plano (PDF con
 * texto, .txt) y devuelve los valores reconocidos. No hace OCR: eso lo hace
 * quien lo llama (Tesseract en el navegador, o el script de terminal).
 *
 * Diseñado para el reporte de Huawei Health: tarjetas con el valor ARRIBA del
 * nombre, en dos columnas. Por eso, para cada nombre se busca el número que está
 * encima en la misma columna, no el siguiente en el texto.
 *
 * Tolerancias para OCR imperfecto:
 *  - nombres por similitud (no coincidencia exacta);
 *  - números con la unidad mal leída ("41,6kg" → "41,610"): se recortan a los
 *    decimales del campo y, si quedan fuera de rango, se prueba sin la cola;
 *  - controles cruzados: peso = peso sin grasa + grasa; % grasa = grasa / peso.
 * El resultado siempre se revisa antes de guardar.
 *
 * Sin imports: lo usan la app y scripts/leer-reporte.mjs.
 */

export type Campo = {
  clave: string;
  nombre: string;
  /** Nombres en el reporte (se comparan sin tildes ni mayúsculas). */
  etiquetas: string[];
  unidad: string;
  min: number;
  max: number;
  decimales: number;
  /** Si la línea del nombre contiene alguna de estas palabras, no es este campo. */
  excluir?: string[];
};

export const CAMPOS_REPORTE: Campo[] = [
  { clave: "peso", nombre: "Peso", etiquetas: ["peso"], unidad: "kg", min: 25, max: 300, decimales: 1, excluir: ["estandar", "control", "sugerencia", "sin grasa"] },
  { clave: "puntuacion", nombre: "Puntuación corporal", etiquetas: ["puntuacion corporal"], unidad: "pts", min: 0, max: 100, decimales: 0 },
  { clave: "imc", nombre: "IMC", etiquetas: ["imc"], unidad: "", min: 10, max: 60, decimales: 1 },
  { clave: "grasaPct", nombre: "Grasa corporal", etiquetas: ["porcentaje de grasa corporal"], unidad: "%", min: 2, max: 70, decimales: 1 },
  { clave: "grasaKg", nombre: "Grasa corporal (kg)", etiquetas: ["grasa corporal"], unidad: "kg", min: 0.5, max: 150, decimales: 1 },
  { clave: "masaMuscularKg", nombre: "Masa muscular", etiquetas: ["masa muscular"], unidad: "kg", min: 10, max: 150, decimales: 1 },
  { clave: "musculoPct", nombre: "Músculo", etiquetas: ["porcentaje de musculo"], unidad: "%", min: 20, max: 95, decimales: 1 },
  { clave: "musculoEsqueleticoKg", nombre: "Músculo esquelético", etiquetas: ["masa muscular esqueletica"], unidad: "kg", min: 5, max: 90, decimales: 1 },
  { clave: "aguaKg", nombre: "Agua corporal (kg)", etiquetas: ["masa de agua corporal"], unidad: "kg", min: 10, max: 120, decimales: 1 },
  { clave: "aguaPct", nombre: "Agua corporal", etiquetas: ["agua corporal"], unidad: "%", min: 30, max: 80, decimales: 1 },
  { clave: "proteinaKg", nombre: "Proteína (kg)", etiquetas: ["masa proteica"], unidad: "kg", min: 2, max: 40, decimales: 1 },
  { clave: "proteinaPct", nombre: "Proteína", etiquetas: ["porcentaje de proteinas"], unidad: "%", min: 5, max: 30, decimales: 1 },
  { clave: "oseoKg", nombre: "Mineral óseo (kg)", etiquetas: ["contenido mineral oseo"], unidad: "kg", min: 0.5, max: 8, decimales: 1 },
  { clave: "oseoPct", nombre: "Mineral óseo", etiquetas: ["porcentaje mineral oseo"], unidad: "%", min: 1, max: 10, decimales: 1 },
  { clave: "grasaVisceral", nombre: "Grasa visceral", etiquetas: ["calificacion de grasa visceral", "grasa visceral"], unidad: "", min: 1, max: 59, decimales: 1 },
  { clave: "basalKcal", nombre: "Metabolismo basal", etiquetas: ["indice metabolico basal", "metabolismo basal"], unidad: "kcal", min: 800, max: 4000, decimales: 0 },
  { clave: "cinturaCadera", nombre: "Cintura-cadera", etiquetas: ["estimacion de la relacion cintura cadera", "relacion cintura cadera"], unidad: "", min: 0.5, max: 1.5, decimales: 2 },
  { clave: "edadCorporal", nombre: "Edad corporal", etiquetas: ["edad corporal"], unidad: "años", min: 10, max: 100, decimales: 0 },
  { clave: "sinGrasaKg", nombre: "Peso sin grasa", etiquetas: ["peso corporal sin grasa"], unidad: "kg", min: 15, max: 200, decimales: 1 },
  { clave: "fcLpm", nombre: "Frecuencia cardíaca", etiquetas: ["frecuencia cardiaca"], unidad: "lpm", min: 30, max: 220, decimales: 0 },
];

export type ValoresReporte = Partial<Record<string, number>>;
export type Palabra = { texto: string; x0: number; y0: number; x1: number; y1: number };
export type Lectura = { fecha: string | null; valores: ValoresReporte };

// ─── Texto ──────────────────────────────────────────────────────────────────

export function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ.,%/ -]/g, " ")
    .replace(/[-/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Similitud 0–1 por distancia de Levenshtein. */
export function similitud(a: string, b: string): number {
  if (a === b) return 1;
  const m = a.length;
  const n = b.length;
  if (!m || !n) return 0;
  let previa = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const fila = [i];
    for (let j = 1; j <= n; j++) fila[j] = Math.min(previa[j] + 1, fila[j - 1] + 1, previa[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    previa = fila;
  }
  return 1 - previa[n] / Math.max(m, n);
}

const UMBRAL = 0.72;

/**
 * Número de un campo a partir de un texto de OCR. Toma el primer número
 * ("47,8kg" → 47,8), lo recorta a los decimales del campo y, si queda fuera de
 * rango, prueba quitando dígitos de la cola (la unidad leída como número).
 */
export function numeroDeCampo(texto: string, campo: Pick<Campo, "min" | "max" | "decimales">): number | null {
  const m = texto.replace(/\s/g, "").match(/[+-]?\d+(?:[.,]\d+)?/);
  if (!m) return null;
  let [entera, dec = ""] = m[0].replace("+", "").split(/[.,]/);
  for (let intento = 0; intento < 3; intento++) {
    const d = dec.slice(0, campo.decimales);
    const v = Number(d ? `${entera}.${d}` : entera);
    if (Number.isFinite(v) && v >= campo.min && v <= campo.max) return v;
    if (dec.length === 0 && entera.length > 1) entera = entera.slice(0, -1);
    else dec = "";
  }
  return null;
}

/** Fecha dd/mm/aaaa del reporte → aaaa-mm-dd. */
export function leerFecha(texto: string): string | null {
  const m = texto.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](20\d{2})\b/);
  if (!m) return null;
  const [, d, mes, a] = m;
  const iso = `${a}-${mes.padStart(2, "0")}-${d.padStart(2, "0")}`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

// ─── Palabras con posición (OCR, PDF) ───────────────────────────────────────

type Caja = { x0: number; y0: number; x1: number; y1: number };
const alto = (c: Caja) => Math.max(1, c.y1 - c.y0);
const centroY = (c: Caja) => (c.y0 + c.y1) / 2;

function agruparLineas(palabras: Palabra[]): Palabra[][] {
  const orden = [...palabras].sort((a, b) => centroY(a) - centroY(b) || a.x0 - b.x0);
  const lineas: Palabra[][] = [];
  for (const p of orden) {
    const l = lineas.find((l) => Math.abs(centroY(l[0]) - centroY(p)) < alto(l[0]) * 0.6);
    if (l) l.push(p);
    else lineas.push([p]);
  }
  return lineas.map((l) => l.sort((a, b) => a.x0 - b.x0));
}

type Etiqueta = { campo: Campo; caja: Caja; usadas: Palabra[] };

/** Busca cada nombre de campo (los más largos primero, para que "masa muscular" no se coma a "masa muscular esquelética"). */
function buscarEtiquetas(lineas: Palabra[][]): Etiqueta[] {
  const usadas = new Set<Palabra>();
  const out: Etiqueta[] = [];
  const pares = CAMPOS_REPORTE.flatMap((c) => c.etiquetas.map((e) => ({ campo: c, etiqueta: e }))).sort((a, b) => b.etiqueta.length - a.etiqueta.length);
  for (const { campo, etiqueta } of pares) {
    if (out.some((e) => e.campo.clave === campo.clave)) continue;
    const nPalabras = etiqueta.split(" ").length;
    let mejor: { sim: number; palabras: Palabra[] } | null = null;
    for (const linea of lineas) {
      const textoLinea = normalizar(linea.map((p) => p.texto).join(" "));
      if (campo.excluir?.some((x) => textoLinea.includes(x))) continue;
      for (let i = 0; i < linea.length; i++) {
        for (const n of [nPalabras - 1, nPalabras, nPalabras + 1]) {
          const ventana = linea.slice(i, i + n);
          if (ventana.length !== n || n < 1 || ventana.some((p) => usadas.has(p))) continue;
          const sim = similitud(normalizar(ventana.map((p) => p.texto).join(" ")), etiqueta);
          if (sim >= UMBRAL && (!mejor || sim > mejor.sim)) mejor = { sim, palabras: ventana };
        }
      }
    }
    if (mejor) {
      mejor.palabras.forEach((p) => usadas.add(p));
      const caja = {
        x0: Math.min(...mejor.palabras.map((p) => p.x0)),
        y0: Math.min(...mejor.palabras.map((p) => p.y0)),
        x1: Math.max(...mejor.palabras.map((p) => p.x1)),
        y1: Math.max(...mejor.palabras.map((p) => p.y1)),
      };
      out.push({ campo, caja, usadas: mejor.palabras });
    }
  }
  return out;
}

/**
 * Valor de cada etiqueta: el número más cercano ENCIMA y en la misma columna;
 * si no hay, a la derecha en la misma línea; si no, debajo.
 */
export function leerDePalabras(palabras: Palabra[]): Lectura {
  const lineas = agruparLineas(palabras);
  const etiquetas = buscarEtiquetas(lineas);
  const usadasEtiqueta = new Set(etiquetas.flatMap((e) => e.usadas));
  const numericas = palabras.filter((p) => !usadasEtiqueta.has(p) && /\d/.test(p.texto));
  const tomadas = new Set<Palabra>();
  const valores: ValoresReporte = {};

  for (const { campo, caja } of etiquetas) {
    const h = alto(caja);
    const mismaColumna = (p: Palabra) => p.x0 < caja.x1 && p.x1 > caja.x0 - h * 2 && Math.abs(p.x0 - caja.x0) < Math.max(h * 4, (caja.x1 - caja.x0) * 0.6);
    const candidatos = numericas
      .filter((p) => !tomadas.has(p))
      .map((p) => {
        const arriba = mismaColumna(p) && p.y1 <= caja.y0 + h * 0.3 && caja.y0 - p.y1 < h * 4;
        const derecha = Math.abs(centroY(p) - centroY(caja)) < h * 0.7 && p.x0 >= caja.x1 - h;
        const abajo = mismaColumna(p) && p.y0 >= caja.y1 - h * 0.3 && p.y0 - caja.y1 < h * 2.5;
        const orden = arriba ? 0 : derecha ? 1 : abajo ? 2 : -1;
        const distancia = arriba ? caja.y0 - p.y1 : derecha ? p.x0 - caja.x1 : p.y0 - caja.y1;
        return { p, orden, distancia, valor: numeroDeCampo(p.texto, campo) };
      })
      .filter((c) => c.orden >= 0 && c.valor !== null)
      .sort((a, b) => a.orden - b.orden || a.distancia - b.distancia);
    const elegido = candidatos[0];
    if (elegido) {
      valores[campo.clave] = elegido.valor!;
      tomadas.add(elegido.p);
    }
  }

  // El peso principal del reporte de Huawei no tiene etiqueta: es el número más grande arriba de todo.
  if (valores.peso === undefined) {
    const campoPeso = CAMPOS_REPORTE[0];
    const grandes = numericas
      .filter((p) => !tomadas.has(p))
      .map((p) => ({ p, v: numeroDeCampo(p.texto, campoPeso) }))
      .filter((c) => c.v !== null)
      .sort((a, b) => alto(b.p) - alto(a.p) || a.p.y0 - b.p.y0);
    if (grandes[0] && alto(grandes[0].p) >= 1.5 * medianaAlto(palabras)) valores.peso = grandes[0].v!;
  }

  return { fecha: leerFecha(palabras.map((p) => p.texto).join(" ")), valores: derivar(valores) };
}

function medianaAlto(palabras: Palabra[]): number {
  const hs = palabras.map(alto).sort((a, b) => a - b);
  return hs[Math.floor(hs.length / 2)] ?? 1;
}

// ─── Texto plano (PDF con texto, .txt, .csv) ────────────────────────────────

/** Línea por línea: el número en la misma línea del nombre; si no, en la anterior o la siguiente. */
export function leerDeTexto(texto: string): Lectura {
  const lineas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const norm = lineas.map(normalizar);
  const usadas = new Set<number>();
  const valores: ValoresReporte = {};
  const pares = CAMPOS_REPORTE.flatMap((c) => c.etiquetas.map((e) => ({ campo: c, etiqueta: e }))).sort((a, b) => b.etiqueta.length - a.etiqueta.length);

  for (const { campo, etiqueta } of pares) {
    if (valores[campo.clave] !== undefined) continue;
    for (let i = 0; i < norm.length; i++) {
      const pos = norm[i].indexOf(etiqueta);
      const excluida = campo.excluir?.some((x) => norm[i].includes(x)) ?? false;
      const igual = pos >= 0 && !usadas.has(i) && !excluida;
      if (!igual) continue;
      const resto = norm[i].slice(pos + etiqueta.length);
      const enLinea = numeroDeCampo(resto, campo);
      const antes = norm[i].slice(0, pos);
      const candidatos = [enLinea, numeroDeCampo(antes, campo), i > 0 ? numeroDeCampo(lineas[i - 1], campo) : null, i + 1 < lineas.length ? numeroDeCampo(lineas[i + 1], campo) : null];
      const v = candidatos.find((c) => c !== null);
      if (v !== undefined && v !== null) {
        valores[campo.clave] = v;
        usadas.add(i);
        break;
      }
    }
  }
  return { fecha: leerFecha(texto), valores: derivar(valores) };
}

// ─── Controles cruzados ─────────────────────────────────────────────────────

/** Completa o corrige con las relaciones entre campos. */
export function derivar(v: ValoresReporte): ValoresReporte {
  const out = { ...v };
  const r1 = (n: number) => Math.round(n * 10) / 10;
  if (out.sinGrasaKg !== undefined && out.grasaKg !== undefined) {
    const suma = r1(out.sinGrasaKg + out.grasaKg);
    if (out.peso === undefined || Math.abs(out.peso - suma) > 0.6) out.peso = suma;
  }
  if (out.grasaPct === undefined && out.grasaKg !== undefined && out.peso) out.grasaPct = r1((out.grasaKg / out.peso) * 100);
  if (out.grasaKg === undefined && out.grasaPct !== undefined && out.peso) out.grasaKg = r1((out.grasaPct / 100) * out.peso);
  return out;
}
