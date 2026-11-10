"use client";

import Link from "next/link";
import { useState } from "react";
import { IconPlay } from "@/components/icons";
import { Etiqueta, Tarjeta } from "@/components/ui";
import type { ProximoEntreno as Datos } from "@/types/hoy";

/**
 * Próximo entreno de la rotación (ADR 0004). Si hay motivo, la versión liviana
 * viene sugerida, pero es un interruptor: nunca un bloqueo.
 */
export function ProximoEntreno({ datos, hechos, meta }: { datos: Datos; hechos: number; meta: number }) {
  const [liviana, setLiviana] = useState(datos.sugerenciaLiviana !== null);
  const minutos = liviana ? Math.round(datos.minutos * 0.8) : datos.minutos;
  const equipos = [...new Set(datos.ejercicios.map((e) => e.equipo))].slice(0, 3).join(", ");

  return (
    <Tarjeta etiqueta="Próximo entreno" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <Etiqueta>Próximo entreno</Etiqueta>
        <p className="text-[13px] whitespace-nowrap text-ink2">
          {hechos} de {meta} en 7 días
        </p>
      </div>
      <div>
        <h2 className="text-[22px] leading-7 font-semibold tracking-tight">{datos.nombre}</h2>
        <p className="text-[15px] text-ink2">
          {datos.ejercicios.length} ejercicios · ~{minutos} min · {equipos}
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-[14px] bg-fill p-3">
        <p className="flex-1 text-sm leading-[19px]">
          {datos.sugerenciaLiviana ?? "Hoy podés ir con todo."}{" "}
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
            <span
              className={`size-[27px] rounded-full bg-white shadow-[0_2px_4px_rgb(0_0_0/.2)] transition-transform ${
                liviana ? "translate-x-5" : ""
              }`}
            />
          </button>
          Liviana
        </label>
      </div>

      <table className="hidden w-full text-[15px] tabular-nums md:table">
        <thead>
          <tr className="text-left text-xs tracking-[.03em] text-ink2 uppercase">
            <th scope="col" className="pb-1.5 font-semibold">Ejercicio</th>
            <th scope="col" className="pb-1.5 font-semibold">Series</th>
            <th scope="col" className="pb-1.5 text-right font-semibold">Carga</th>
          </tr>
        </thead>
        <tbody>
          {datos.ejercicios.map((e) => (
            <tr key={e.nombre} className="border-t-[0.5px] border-sep">
              <td className="py-2.5">
                {e.nombre} <span className="text-[13px] text-ink2">· {e.equipo}</span>
              </td>
              <td className="py-2.5 text-ink2">
                {liviana ? e.series - 1 : e.series} × {e.reps}
              </td>
              <td className="py-2.5 text-right">{e.carga}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Link
        href="/entrenar"
        className="flex h-[50px] items-center justify-center gap-2 rounded-[14px] bg-accent text-[17px] font-semibold text-on-accent active:opacity-80"
      >
        <IconPlay size={18} />
        Empezar
      </Link>
    </Tarjeta>
  );
}
