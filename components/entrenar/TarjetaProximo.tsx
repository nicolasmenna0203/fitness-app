"use client";

import Link from "next/link";
import { useState } from "react";
import { empezarEntreno } from "@/app/acciones/entrenos";
import { IconPlay } from "@/components/icons";
import { Etiqueta, Tarjeta } from "@/components/ui";
import { fmtCarga, seriesDeHoy } from "@/lib/entrenos/progresion";
import type { EjercicioPlan, ProximoPlan } from "@/types/entrenos";

export function textoCarga(e: EjercicioPlan): string {
  if (e.tipoCarga === "corporal") return "peso corporal";
  if (e.tipoCarga === "tiempo") return "—";
  if (e.sugerencia.kg === null) return "a elegir";
  const aprox = e.sugerencia.motivo === "primera" ? "~" : "";
  return `${aprox}${fmtCarga(e.sugerencia.kg)} kg${e.tipoCarga === "mancuerna" ? " c/u" : ""}`;
}

export function textoSeries(e: EjercicioPlan, liviana: boolean): string {
  return `${seriesDeHoy(e.series, liviana)} × ${e.repsMin}–${e.repsMax}${e.tipoCarga === "tiempo" ? " s" : ""}`;
}

function estimar(plan: EjercicioPlan[], liviana: boolean): number {
  const seg = plan.reduce((s, e) => s + seriesDeHoy(e.series, liviana) * (e.descansoSeg + 40), 0);
  return Math.max(5, Math.round(seg / 60 / 5) * 5);
}

/**
 * Próximo entreno de la rotación (ADR 0004). Si hay motivo, la versión liviana
 * viene sugerida, pero es un interruptor: nunca un bloqueo.
 * `compacto`: en Hoy, la lista de ejercicios se ve solo en escritorio.
 */
export function TarjetaProximo({ plan, compacto = false }: { plan: ProximoPlan; compacto?: boolean }) {
  const [liviana, setLiviana] = useState(plan.motivoLiviana !== null);
  const equipos = [...new Set(plan.ejercicios.map((e) => e.equipo.split(" ")[0].replace(/s$/, "")))].slice(0, 3).join(", ");

  if (plan.enCurso) {
    return (
      <Tarjeta etiqueta="Entreno en curso" className="flex flex-col gap-3">
        <Etiqueta>Entreno en curso</Etiqueta>
        <h2 className="text-[22px] leading-7 font-semibold tracking-tight">{plan.enCurso.nombre}</h2>
        <Link
          href={`/entrenar/${plan.enCurso.id}`}
          className="flex h-[50px] items-center justify-center gap-2 rounded-[14px] bg-accent text-[17px] font-semibold text-on-accent active:opacity-80"
        >
          <IconPlay size={18} />
          Continuar
        </Link>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta etiqueta="Próximo entreno" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <Etiqueta>Próximo entreno</Etiqueta>
        <p className="text-[13px] whitespace-nowrap text-ink2">
          {plan.hechos7Dias} de {plan.metaSemana} en 7 días
        </p>
      </div>
      <div>
        <h2 className="text-[22px] leading-7 font-semibold tracking-tight">{plan.plantilla.nombre}</h2>
        <p className="text-[15px] text-ink2">
          {plan.ejercicios.length} ejercicios · ~{estimar(plan.ejercicios, liviana)} min · {equipos}
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-[14px] bg-fill p-3">
        <p className="flex-1 text-sm leading-[19px]">
          {plan.motivoLiviana ?? "Sin motivos para aflojar hoy."}{" "}
          <span className="text-ink2">La versión liviana hace una serie menos por ejercicio.</span>
        </p>
        <label className="flex cursor-pointer flex-col items-center gap-1 text-[11px] text-ink2">
          <button
            type="button"
            role="switch"
            aria-checked={liviana}
            aria-label="Versión liviana"
            onClick={() => setLiviana(!liviana)}
            className={`flex h-[31px] w-[51px] rounded-full p-0.5 transition-colors ${liviana ? "bg-accent" : "bg-track"}`}
          >
            <span className={`size-[27px] rounded-full bg-white shadow-[0_2px_4px_rgb(0_0_0/.2)] transition-transform ${liviana ? "translate-x-5" : ""}`} />
          </button>
          Liviana
        </label>
      </div>

      <table className={`w-full text-[15px] tabular-nums ${compacto ? "hidden md:table" : ""}`}>
        <thead>
          <tr className="text-left text-xs tracking-[.03em] text-ink2 uppercase">
            <th scope="col" className="pb-1.5 font-semibold">Ejercicio</th>
            <th scope="col" className="pb-1.5 font-semibold">Series</th>
            <th scope="col" className="pb-1.5 text-right font-semibold">Carga</th>
          </tr>
        </thead>
        <tbody>
          {plan.ejercicios.map((e) => (
            <tr key={e.orden} className="border-t-[0.5px] border-sep align-top">
              <td className="py-2.5 pr-2">
                {e.nombre}
                {e.sugerencia.motivo === "subir" && (
                  <span className="ml-1.5 rounded-md bg-fill px-1.5 py-0.5 text-[11px] font-semibold text-ink">sube</span>
                )}
                <span className="block text-[13px] text-ink2">{e.equipo}{e.nota ? ` · ${e.nota}` : ""}</span>
              </td>
              <td className="py-2.5 whitespace-nowrap text-ink2">{textoSeries(e, liviana)}</td>
              <td className="py-2.5 text-right whitespace-nowrap">{textoCarga(e)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <form action={empezarEntreno}>
        <input type="hidden" name="plantillaId" value={plan.plantilla.id} />
        <input type="hidden" name="liviana" value={liviana ? "1" : "0"} />
        <button
          type="submit"
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-accent text-[17px] font-semibold text-on-accent active:opacity-80"
        >
          <IconPlay size={18} />
          Empezar
        </button>
      </form>
    </Tarjeta>
  );
}
