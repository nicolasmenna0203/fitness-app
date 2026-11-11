/**
 * Lee un reporte de la balanza desde la terminal, con el mismo lector que la app
 * (lib/balanza/lector.ts, ADR 0003). Sirve para probar archivos nuevos.
 *
 * Uso: npm run leer-reporte -- <archivo> [--json]
 *   Imágenes (png, jpg, webp…): OCR con Tesseract; las chicas se agrandan antes.
 *   PDF: el texto del PDF con su posición; si no tiene texto (escaneado), avisa.
 *   Texto (txt, csv): línea por línea.
 *
 * Node 22.6+ (importa el lector .ts directamente). No guarda nada.
 */
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [archivo, ...flags] = process.argv.slice(2);
if (!archivo) {
  console.error("Uso: npm run leer-reporte -- <archivo> [--json]");
  process.exit(1);
}
const { leerDePalabras, leerDeTexto, CAMPOS_REPORTE } = await import(pathToFileURL(resolve("lib/balanza/lector.ts")).href);
const ext = extname(archivo).toLowerCase();

/** Ancho mínimo para que el OCR lea bien los nombres de los campos. */
const ANCHO_MINIMO = 1000;

async function deImagen(ruta) {
  const { default: sharp } = await import("sharp");
  const { createWorker } = await import("tesseract.js");
  const { width = 0 } = await sharp(ruta).metadata();
  const escala = width < ANCHO_MINIMO ? Math.min(6, Math.ceil(ANCHO_MINIMO / Math.max(1, width))) : 1;
  const imagen = await sharp(ruta)
    .resize({ width: width * escala, kernel: "lanczos3" })
    .grayscale()
    .normalize()
    .png()
    .toBuffer();
  const worker = await createWorker("spa");
  await worker.setParameters({ tessedit_pageseg_mode: "11" }); // texto disperso: tarjetas, no párrafos
  const { data } = await worker.recognize(imagen, {}, { blocks: true });
  await worker.terminate();
  const palabras = (data.blocks ?? []).flatMap((b) => b.paragraphs.flatMap((p) => p.lines.flatMap((l) => l.words)));
  if (escala > 1) console.error(`(imagen de ${width} px de ancho: se agrandó ×${escala} para el OCR)`);
  return leerDePalabras(palabras.map((w) => ({ texto: w.text, ...w.bbox })));
}

async function dePdf(ruta) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await readFile(ruta)) }).promise;
  const palabras = [];
  let desplazamiento = 0;
  for (let n = 1; n <= doc.numPages; n++) {
    const pagina = await doc.getPage(n);
    const { height } = pagina.getViewport({ scale: 1 });
    const { items } = await pagina.getTextContent();
    for (const it of items) {
      if (!("str" in it) || !it.str.trim()) continue;
      const [, , , , x, y] = it.transform;
      const h = it.height || Math.abs(it.transform[3]) || 10;
      palabras.push({ texto: it.str, x0: x, x1: x + it.width, y0: desplazamiento + height - y - h, y1: desplazamiento + height - y });
    }
    desplazamiento += height;
  }
  if (palabras.length === 0) {
    console.error("El PDF no tiene texto (es una imagen escaneada): exportalo como imagen y probá de nuevo.");
    process.exit(2);
  }
  // Con posiciones si el PDF las trae ordenadas como tarjetas; si no, el texto plano suele alcanzar.
  const conPosicion = leerDePalabras(palabras);
  const plano = leerDeTexto(palabras.map((p) => p.texto).join("\n"));
  return Object.keys(conPosicion.valores).length >= Object.keys(plano.valores).length ? conPosicion : plano;
}

const lectura = [".txt", ".csv", ".tsv"].includes(ext)
  ? leerDeTexto(await readFile(archivo, "utf8"))
  : ext === ".pdf"
    ? await dePdf(archivo)
    : await deImagen(archivo);

if (flags.includes("--json")) {
  console.log(JSON.stringify(lectura, null, 2));
} else {
  console.log(`Fecha: ${lectura.fecha ?? "—"}`);
  for (const c of CAMPOS_REPORTE) {
    const v = lectura.valores[c.clave];
    console.log(`${c.nombre.padEnd(24)} ${v === undefined ? "—" : `${String(v).replace(".", ",")} ${c.unidad}`.trim()}`);
  }
  const leidos = Object.keys(lectura.valores).length;
  console.log(`\n${leidos} de ${CAMPOS_REPORTE.length} campos. Revisalos antes de usarlos.`);
}
