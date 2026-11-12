"use client";

import { useRef, useState, useTransition } from "react";
import { borrarFoto, subirFoto } from "@/app/acciones/fotos";
import type { Pose } from "@/db/schema";
import { NOMBRE_POSE } from "@/lib/poses";

const LADO_MAX = 1600;
const PESO_MAX = 700_000;

/** Reduce la foto en el dispositivo (ADR 0011): 1600 px de lado mayor, JPEG de menos de 700 KB. */
async function comprimir(archivo: File): Promise<{ blob: Blob; ancho: number; alto: number }> {
  // createImageBitmap respeta la orientación EXIF del iPhone.
  const imagen = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAX / Math.max(imagen.width, imagen.height));
  const ancho = Math.round(imagen.width * escala);
  const alto = Math.round(imagen.height * escala);
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  lienzo.getContext("2d")!.drawImage(imagen, 0, 0, ancho, alto);
  imagen.close();

  const aBlob = (calidad: number) =>
    new Promise<Blob>((ok, mal) => lienzo.toBlob((b) => (b ? ok(b) : mal(new Error("No se pudo comprimir"))), "image/jpeg", calidad));
  let calidad = 0.82;
  let blob = await aBlob(calidad);
  while (blob.size > PESO_MAX && calidad > 0.5) {
    calidad -= 0.1;
    blob = await aBlob(calidad);
  }
  return { blob, ancho, alto };
}

/**
 * Un botón por pose: abre la cámara o la fototeca (el iPhone deja elegir), y al
 * elegir la foto se guarda. Dos toques.
 */
export function SubirFoto({ deshabilitado = false }: { deshabilitado?: boolean }) {
  const [estado, setEstado] = useState<{ ok: boolean; texto: string } | null>(null);
  const [subiendo, iniciar] = useTransition();
  const [pose, setPose] = useState<Pose>("frente");
  const input = useRef<HTMLInputElement>(null);

  function elegir(p: Pose) {
    setPose(p);
    setEstado(null);
    input.current?.click();
  }

  function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    const p = pose;
    iniciar(async () => {
      try {
        const { blob, ancho, alto } = await comprimir(archivo);
        const datos = new FormData();
        datos.set("foto", blob, "foto.jpg");
        datos.set("pose", p);
        datos.set("ancho", String(ancho));
        datos.set("alto", String(alto));
        const r = await subirFoto(datos);
        setEstado(r.ok ? { ok: true, texto: `Foto de ${NOMBRE_POSE[p].toLowerCase()} guardada.` } : { ok: false, texto: r.error });
      } catch {
        setEstado({ ok: false, texto: "No se pudo leer la imagen. Probá con otra." });
      }
    });
  }

  if (deshabilitado) return <p className="text-[13px] text-ink2">En la demo no se suben fotos.</p>;

  return (
    <div className="flex flex-col gap-2">
      <input ref={input} type="file" accept="image/*" onChange={alElegir} className="hidden" aria-hidden tabIndex={-1} />
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(NOMBRE_POSE) as Pose[]).map((p) => (
          <button
            key={p}
            type="button"
            disabled={subiendo}
            onClick={() => elegir(p)}
            className="h-11 rounded-xl bg-fill text-[15px] font-semibold text-link active:opacity-70 disabled:opacity-50"
          >
            {subiendo && pose === p ? "Guardando…" : NOMBRE_POSE[p]}
          </button>
        ))}
      </div>
      {estado && (
        <p role={estado.ok ? "status" : "alert"} className={`text-[13px] ${estado.ok ? "text-ink2" : "text-warn"}`}>
          {estado.texto}
        </p>
      )}
    </div>
  );
}

export function BorrarFoto({ id }: { id: number }) {
  const [borrando, iniciar] = useTransition();
  return (
    <button
      type="button"
      disabled={borrando}
      onClick={() => {
        if (confirm("¿Borrar esta foto?")) iniciar(() => borrarFoto(id));
      }}
      className="min-h-9 text-[13px] text-warn disabled:opacity-50"
    >
      Borrar
    </button>
  );
}
