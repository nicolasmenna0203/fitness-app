import Link from "next/link";
import { Etiqueta, Tarjeta } from "@/components/ui";
import { fmtDelta, fmtDuracion, fmtEntero } from "@/lib/formato";
import type { RevisionSemanal as Revision } from "@/lib/semana";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
function rango(desde: string, hasta: string): string {
  const d = Number(desde.slice(8)), h = Number(hasta.slice(8));
  const md = MESES[Number(desde.slice(5, 7)) - 1], mh = MESES[Number(hasta.slice(5, 7)) - 1];
  return md === mh ? `${d} al ${h} de ${mh}` : `${d} de ${md} al ${h} de ${mh}`;
}

function Dato({ nombre, valor, detalle }: { nombre: string; valor: string; detalle?: string | null }) {
  return (
    <div>
      <dt className="text-[13px] text-ink2">{nombre}</dt>
      <dd className="text-[20px] font-semibold tabular-nums">{valor}</dd>
      {detalle && <dd className="text-[13px] text-ink2">{detalle}</dd>}
    </div>
  );
}

/** Revisión de los últimos 7 días: peso, entrenos, comidas, sueño y el ajuste de calorías. */
export function RevisionSemanal({ r }: { r: Revision }) {
  const { comidas: c } = r;
  const deportes = r.deportes.map((d) => `${d.nombre} ${d.minutos} min`).join(" · ");
  return (
    <Tarjeta etiqueta="Tu semana" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <Etiqueta>Tu semana</Etiqueta>
        <p className="text-[13px] text-ink2">{rango(r.desde, r.hasta)}</p>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
        <Dato nombre="Peso (tendencia)" valor={r.cambioPesoKg !== null ? `${fmtDelta(r.cambioPesoKg)} kg` : "—"} detalle={r.cambioPesoKg === null ? "Faltan pesajes" : null} />
        <Dato nombre="Entrenos" valor={`${r.entrenos.hechos} de ${r.entrenos.meta}`} detalle={deportes || null} />
        <Dato
          nombre="Comida, promedio"
          valor={c.kcalPromedio !== null ? `${fmtEntero(c.kcalPromedio)} kcal` : "—"}
          detalle={c.dias > 0 ? `${c.proteinaPromedio} g de proteína · ${c.dias} de 7 días registrados` : "Sin comidas registradas"}
        />
        <Dato nombre="Sueño, promedio" valor={r.suenoPromedioMin !== null ? fmtDuracion(r.suenoPromedioMin) : "—"} />
      </dl>

      {c.diasProteinaOk !== null && c.dias > 0 && (
        <p className="text-[15px]">
          Llegaste a la proteína {c.diasProteinaOk} de {c.dias} {c.dias === 1 ? "día" : "días"} registrados.
        </p>
      )}

      {r.ajuste && (
        <p className="rounded-[14px] bg-hl p-3 text-sm leading-[19px]">
          <span className="font-semibold">
            Meta nueva: {fmtEntero(r.ajuste.kcal)} kcal
            {r.ajuste.delta ? ` (${r.ajuste.delta > 0 ? "+" : "−"}${Math.abs(r.ajuste.delta)})` : ""}.
          </span>{" "}
          {r.ajuste.motivo}
        </p>
      )}

      {r.fotoSugerida && (
        <Link href="/progreso/fotos" className="flex min-h-11 items-center justify-between rounded-[14px] bg-fill px-3 text-[15px]">
          <span>Ya toca una foto de progreso</span>
          <span className="text-link">Sacar ›</span>
        </Link>
      )}
    </Tarjeta>
  );
}
