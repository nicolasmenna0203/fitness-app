"use client";

import { useState, useTransition } from "react";
import { registrarActividad, type ResultadoActividad } from "@/app/acciones/actividades";
import { Etiqueta, Tarjeta } from "@/components/ui";
import { DEPORTES_MANUALES, DURACIONES_MIN, type TipoManual } from "@/lib/actividades";

const chip = "h-11 rounded-full px-4 text-[15px] font-semibold active:opacity-70 disabled:opacity-50";

/**
 * Carga a mano de un partido o cardio que la pulsera no registró: deporte y
 * duración, dos toques. Si la pulsera lo registró igual, no se cuenta dos veces.
 */
export function PartidoOCardio() {
  const [tipo, setTipo] = useState<TipoManual | null>(null);
  const [ayer, setAyer] = useState(false);
  const [resultado, setResultado] = useState<ResultadoActividad | null>(null);
  const [guardando, iniciar] = useTransition();

  function guardar(minutos: number) {
    if (!tipo) return;
    iniciar(async () => {
      const r = await registrarActividad(tipo, minutos, ayer);
      setResultado(r);
      if (r.ok) {
        setTipo(null);
        setAyer(false);
      }
    });
  }

  return (
    <Tarjeta etiqueta="Partido o cardio" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <Etiqueta>Partido o cardio</Etiqueta>
        <button
          type="button"
          role="switch"
          aria-checked={ayer}
          onClick={() => setAyer(!ayer)}
          className={`h-8 rounded-full px-3 text-[13px] font-semibold ${ayer ? "bg-accent text-on-accent" : "bg-fill text-ink2"}`}
        >
          Fue ayer
        </button>
      </div>
      <p className="text-[13px] text-ink2">Solo si la pulsera no lo registró: lo que detecta llega solo al sincronizar.</p>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Deporte">
        {DEPORTES_MANUALES.map((d) => (
          <button
            key={d.tipo}
            type="button"
            aria-pressed={tipo === d.tipo}
            onClick={() => {
              setTipo(tipo === d.tipo ? null : d.tipo);
              setResultado(null);
            }}
            className={`${chip} ${tipo === d.tipo ? "bg-accent text-on-accent" : "bg-fill text-ink"}`}
          >
            {d.nombre}
          </button>
        ))}
      </div>

      {tipo && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[13px] text-ink2">¿Cuánto duró?</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Duración">
            {DURACIONES_MIN.map((m) => (
              <button key={m} type="button" disabled={guardando} onClick={() => guardar(m)} className={`${chip} bg-fill text-link`}>
                {m} min
              </button>
            ))}
          </div>
        </div>
      )}

      {resultado && (
        <p role={resultado.ok ? "status" : "alert"} className={`text-[15px] ${resultado.ok ? "" : "text-warn"}`}>
          {resultado.ok ? `Registrado: ${resultado.texto}` : resultado.error}
        </p>
      )}
    </Tarjeta>
  );
}
