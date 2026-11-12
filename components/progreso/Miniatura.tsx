import type { FotoMeta } from "@/lib/datos/fotos";
import { fechaLarga } from "@/lib/fecha";
import { NOMBRE_POSE } from "@/lib/poses";

/** Foto de progreso servida detrás del login (ADR 0011). <img> y no next/image: el optimizador no tiene la cookie. */
export function Miniatura({ foto, pie = true }: { foto: FotoMeta; pie?: boolean }) {
  return (
    <figure className="flex min-w-0 flex-col gap-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/fotos/${foto.id}`}
        alt={`${NOMBRE_POSE[foto.pose]}, ${fechaLarga(foto.fecha)}`}
        width={foto.ancho}
        height={foto.alto}
        loading="lazy"
        className="aspect-[3/4] w-full rounded-xl bg-fill object-cover"
      />
      {pie && (
        <figcaption className="text-[13px] text-ink2">
          {NOMBRE_POSE[foto.pose]} · {fechaLarga(foto.fecha).split(" ").slice(1).join(" ")}
        </figcaption>
      )}
    </figure>
  );
}
