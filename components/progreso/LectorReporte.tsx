"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { guardarReporte } from "@/app/acciones/progreso";
import { Etiqueta, Tarjeta } from "@/components/ui";
import { CAMPOS_REPORTE, leerDePalabras, leerDeTexto, type Lectura, type Palabra } from "@/lib/balanza/lector";

/** Ancho mínimo para que el OCR lea bien los nombres; las capturas chicas se agrandan. */
const ANCHO_MINIMO = 1000;
/** Tope de píxeles de un canvas en iOS. */
const MAX_PIXELES = 16_000_000;
const PRINCIPALES = ["peso", "grasaPct", "masaMuscularKg", "musculoEsqueleticoKg", "grasaVisceral", "basalKcal", "aguaPct"];

type Estado = { fase: "inicio" } | { fase: "leyendo"; detalle: string; progreso: number } | { fase: "revisar"; leidos: number } | { fase: "error"; mensaje: string };

async function ocr(fuente: HTMLCanvasElement, alProgresar: (p: number) => void): Promise<Palabra[]> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("spa", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") alProgresar(m.progress);
    },
  });
  // Texto disperso: el reporte son tarjetas sueltas, no párrafos.
  await worker.setParameters({ tessedit_pageseg_mode: "11" as never });
  const { data } = await worker.recognize(fuente, {}, { blocks: true });
  await worker.terminate();
  return (data.blocks ?? []).flatMap((b) => b.paragraphs.flatMap((p) => p.lines.flatMap((l) => l.words.map((w) => ({ texto: w.text, ...w.bbox })))));
}

function lienzo(ancho: number, alto: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, ancho, alto);
  ctx.imageSmoothingQuality = "high";
  ctx.filter = "grayscale(1) contrast(1.15)";
  return { canvas, ctx };
}

async function leerImagen(archivo: File, alProgresar: (p: number) => void): Promise<Lectura> {
  const bmp = await createImageBitmap(archivo);
  let escala = bmp.width < ANCHO_MINIMO ? Math.min(6, Math.ceil(ANCHO_MINIMO / bmp.width)) : 1;
  while (escala > 1 && bmp.width * bmp.height * escala * escala > MAX_PIXELES) escala--;
  const { canvas, ctx } = lienzo(bmp.width * escala, bmp.height * escala);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return leerDePalabras(await ocr(canvas, alProgresar));
}

async function leerPdf(archivo: File, alProgresar: (p: number) => void, alCambiarDetalle: (d: string) => void): Promise<Lectura> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await archivo.arrayBuffer()) }).promise;
  const palabras: Palabra[] = [];
  let desplazamiento = 0;
  for (let n = 1; n <= doc.numPages; n++) {
    const pagina = await doc.getPage(n);
    const { height } = pagina.getViewport({ scale: 1 });
    const { items } = await pagina.getTextContent();
    for (const it of items) {
      if (!("str" in it) || !it.str.trim()) continue;
      const x = it.transform[4];
      const y = it.transform[5];
      const h = it.height || Math.abs(it.transform[3]) || 10;
      palabras.push({ texto: it.str, x0: x, x1: x + it.width, y0: desplazamiento + height - y - h, y1: desplazamiento + height - y });
    }
    desplazamiento += height;
  }
  if (palabras.length > 0) {
    const conPosicion = leerDePalabras(palabras);
    const plano = leerDeTexto(palabras.map((p) => p.texto).join("\n"));
    return Object.keys(conPosicion.valores).length >= Object.keys(plano.valores).length ? conPosicion : plano;
  }
  // PDF escaneado: se dibuja la primera página y se lee como imagen.
  alCambiarDetalle("El PDF no tiene texto: leyendo la imagen…");
  const pagina = await doc.getPage(1);
  const viewport = pagina.getViewport({ scale: 3 });
  const { canvas, ctx } = lienzo(viewport.width, viewport.height);
  await pagina.render({ canvas, canvasContext: ctx, viewport }).promise;
  return leerDePalabras(await ocr(canvas, alProgresar));
}

const aTexto = (v: number | undefined) => (v === undefined ? "" : String(v).replace(".", ","));

/** Subir un reporte (imagen, PDF o texto), revisar lo leído y guardarlo. Todo se procesa en el dispositivo. */
export function LectorReporte({ hoy }: { hoy: string }) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>({ fase: "inicio" });
  const [fecha, setFecha] = useState(hoy);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [leidos, setLeidos] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [guardando, iniciar] = useTransition();

  async function alElegir(archivo: File | undefined) {
    if (!archivo) return;
    setError(null);
    const nombre = archivo.name.toLowerCase();
    const progreso = (p: number) => setEstado({ fase: "leyendo", detalle: "Reconociendo el texto…", progreso: p });
    try {
      setEstado({ fase: "leyendo", detalle: "Preparando…", progreso: 0 });
      let lectura: Lectura;
      if (archivo.type === "application/pdf" || nombre.endsWith(".pdf")) {
        lectura = await leerPdf(archivo, progreso, (detalle) => setEstado({ fase: "leyendo", detalle, progreso: 0 }));
      } else if (archivo.type.startsWith("text/") || /\.(txt|csv|tsv)$/.test(nombre)) {
        lectura = leerDeTexto(await archivo.text());
      } else {
        lectura = await leerImagen(archivo, progreso);
      }
      const claves = Object.keys(lectura.valores);
      setValores(Object.fromEntries(claves.map((k) => [k, aTexto(lectura.valores[k])])));
      setLeidos(new Set(claves));
      if (lectura.fecha && lectura.fecha <= hoy) setFecha(lectura.fecha);
      setEstado({ fase: "revisar", leidos: claves.length });
    } catch (e) {
      setEstado({ fase: "error", mensaje: e instanceof Error ? e.message : "No se pudo leer el archivo." });
    }
  }

  function guardar() {
    const numeros: Record<string, number> = {};
    for (const c of CAMPOS_REPORTE) {
      const t = valores[c.clave]?.trim();
      if (!t) continue;
      const n = Number(t.replace(",", "."));
      if (!Number.isFinite(n)) {
        setError(`${c.nombre}: no es un número.`);
        return;
      }
      numeros[c.clave] = n;
    }
    iniciar(async () => {
      const r = await guardarReporte(fecha, numeros);
      if (r.ok) router.push("/progreso");
      else setError(r.error);
    });
  }

  const campo = (clave: string) => {
    const c = CAMPOS_REPORTE.find((x) => x.clave === clave)!;
    const id = `campo-${clave}`;
    return (
      <div key={clave} className="flex min-h-11 items-center gap-2 border-b-[0.5px] border-sep pr-1 last:border-b-0">
        <label htmlFor={id} className="flex-1 text-[15px]">
          {c.nombre}
          {estado.fase === "revisar" && !leidos.has(clave) && PRINCIPALES.includes(clave) && <span className="ml-1.5 text-xs text-warn">sin leer</span>}
        </label>
        <input
          id={id}
          inputMode="decimal"
          value={valores[clave] ?? ""}
          onChange={(e) => setValores((v) => ({ ...v, [clave]: e.target.value }))}
          placeholder="—"
          className="w-20 bg-transparent text-right text-[17px] tabular-nums outline-none placeholder:text-ink2"
        />
        <span className="w-9 text-[13px] text-ink2">{c.unidad}</span>
      </div>
    );
  };

  return (
    <div className="flex max-w-xl flex-col gap-3">
      <Tarjeta className="flex flex-col gap-3">
        <Etiqueta>Leer un reporte</Etiqueta>
        <p className="text-[15px] text-ink2">Captura de pantalla, foto, PDF o texto exportado. Se lee en tu dispositivo: el archivo no se sube.</p>
        <label className="flex h-[50px] cursor-pointer items-center justify-center rounded-[14px] bg-accent text-[17px] font-semibold text-on-accent">
          Elegir archivo
          <input
            type="file"
            accept="image/*,application/pdf,text/plain,text/csv,.txt,.csv,.tsv,.pdf"
            className="sr-only"
            onChange={(e) => alElegir(e.target.files?.[0])}
          />
        </label>
        {estado.fase === "leyendo" && (
          <div aria-live="polite" className="flex flex-col gap-1.5">
            <p className="text-sm text-ink2">{estado.detalle}</p>
            <div className="h-1.5 overflow-hidden rounded bg-track">
              <div className="h-full rounded bg-accent transition-[width]" style={{ width: `${Math.round(estado.progreso * 100)}%` }} />
            </div>
          </div>
        )}
        {estado.fase === "revisar" && (
          <p aria-live="polite" className="rounded-xl bg-fill px-3 py-2 text-sm">
            Leímos {estado.leidos} de {CAMPOS_REPORTE.length} valores. Revisalos antes de guardar.
            {estado.leidos < 4 && " Si salieron pocos, probá con la captura original (no reenviada por WhatsApp, que la achica)."}
          </p>
        )}
        {estado.fase === "error" && <p role="alert" className="rounded-xl bg-warnbg px-3 py-2 text-sm">{estado.mensaje}</p>}
      </Tarjeta>

      <Tarjeta className="flex flex-col gap-1">
        <div className="flex min-h-11 items-center gap-2 border-b-[0.5px] border-sep">
          <label htmlFor="fecha-reporte" className="flex-1 text-[15px]">
            Fecha de la medición
          </label>
          <input
            id="fecha-reporte"
            type="date"
            value={fecha}
            max={hoy}
            onChange={(e) => setFecha(e.target.value)}
            className="bg-transparent text-right text-[17px] text-link outline-none"
          />
        </div>
        {PRINCIPALES.map(campo)}
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer items-center text-[15px] text-link">Más valores</summary>
          {CAMPOS_REPORTE.filter((c) => !PRINCIPALES.includes(c.clave)).map((c) => campo(c.clave))}
        </details>
      </Tarjeta>

      {error && <p role="alert" className="rounded-xl bg-warnbg px-3 py-2 text-sm">{error}</p>}
      <button
        type="button"
        onClick={guardar}
        disabled={guardando || !valores.peso}
        className="h-[50px] rounded-[14px] bg-accent text-[17px] font-semibold text-on-accent disabled:opacity-50"
      >
        {guardando ? "Guardando…" : "Guardar reporte"}
      </button>
      <Link href="/progreso" className="flex min-h-11 items-center justify-center text-[17px] text-link">
        Cancelar
      </Link>
    </div>
  );
}
