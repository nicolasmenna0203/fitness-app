"use client";

import { useActionState, useOptimistic, useTransition } from "react";
import { borrarRegistro, ocultarFrecuente, registrarFrecuente, registrarLibre, type Resultado } from "@/app/acciones/comer";
import { Tarjeta } from "@/components/ui";
import { fmtEntero } from "@/lib/formato";
import type { Frecuente, RegistroComida } from "@/lib/datos/comer";

const campo = "h-11 rounded-xl bg-fill px-3 text-[17px] tabular-nums outline-none focus:ring-2 focus:ring-accent";

/** Grilla de comidas frecuentes: un toque las registra. */
export function Frecuentes({ frecuentes }: { frecuentes: Frecuente[] }) {
  const [pendiente, iniciar] = useTransition();
  const [tocadas, marcar] = useOptimistic<number[], number>([], (estado, id) => [...estado, id]);

  if (frecuentes.length === 0) {
    return <p className="px-1 text-[15px] text-ink2">Cuando cargues una comida, marcá «Guardar como frecuente» para tenerla acá a un toque.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
      {frecuentes.map((f) => {
        const recien = tocadas.includes(f.id);
        return (
          <div key={f.id} className="group relative">
            <button
              type="button"
              disabled={pendiente && recien}
              onClick={() =>
                iniciar(async () => {
                  marcar(f.id);
                  await registrarFrecuente(f.id);
                })
              }
              aria-label={`Registrar ${f.nombre}`}
              className="flex min-h-16 w-full items-center gap-2 rounded-2xl bg-card p-3 text-left active:opacity-70"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] leading-[19px] font-semibold">{f.nombre}</span>
                <span className="text-[13px] text-ink2 tabular-nums">
                  {fmtEntero(f.kcal)} kcal · {Math.round(f.proteinaG)} g
                </span>
              </span>
              <span
                aria-hidden
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[17px] ${recien ? "bg-good text-white" : "bg-fill"}`}
              >
                {recien ? "✓" : "+"}
              </span>
            </button>
            <form action={ocultarFrecuente.bind(null, f.id)} className="absolute -top-1.5 -right-1.5 hidden group-hover:block">
              <button type="submit" aria-label={`Quitar ${f.nombre} de frecuentes`} className="size-6 rounded-full bg-sel text-xs text-ink2">
                ×
              </button>
            </form>
          </div>
        );
      })}
    </div>
  );
}

/** Carga libre de una comida que no está en frecuentes. */
export function CargaLibre() {
  const [estado, accion, enviando] = useActionState<Resultado | null, FormData>(registrarLibre, null);
  return (
    <details className="group rounded-[20px] bg-card">
      <summary className="flex min-h-12 cursor-pointer items-center px-4 text-[15px] font-semibold text-link">+ Otra comida</summary>
      <form action={accion} className="flex flex-col gap-2.5 px-4 pb-4">
        <label className="flex flex-col gap-1 text-[13px] text-ink2">
          Qué comiste
          <input name="nombre" placeholder="Por ejemplo: tostadas con queso" maxLength={60} className={campo} />
        </label>
        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1 text-[13px] text-ink2">
            Calorías
            <input name="kcal" inputMode="numeric" required placeholder="kcal" className={campo} />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-[13px] text-ink2">
            Proteína
            <input name="proteina" inputMode="decimal" placeholder="g" className={campo} />
          </label>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-[15px]">
          <input type="checkbox" name="guardar" defaultChecked className="size-5 accent-[var(--accent)]" />
          Guardar como frecuente
        </label>
        {estado && !estado.ok && (
          <p role="alert" className="text-[13px] text-warn">
            {estado.error}
          </p>
        )}
        <button type="submit" disabled={enviando} className="h-11 rounded-xl bg-accent text-[17px] font-semibold text-on-accent disabled:opacity-60">
          {enviando ? "Guardando…" : "Registrar"}
        </button>
      </form>
    </details>
  );
}

export function RegistroDelDia({ registros }: { registros: RegistroComida[] }) {
  if (registros.length === 0) return <p className="px-1 text-[15px] text-ink2">Todavía no registraste comidas hoy.</p>;
  return (
    <Tarjeta className="py-1">
      <ul>
        {registros.map((r) => (
          <li key={r.id} className="flex min-h-12 items-center gap-3 border-t-[0.5px] border-sep first:border-t-0">
            <span className="w-12 text-[13px] text-ink2 tabular-nums">{r.hora}</span>
            <span className="flex-1 text-[15px]">{r.nombre}</span>
            <span className="text-[13px] text-ink2 tabular-nums">
              {fmtEntero(r.kcal)} · {Math.round(r.proteinaG)} g
            </span>
            <form action={borrarRegistro.bind(null, r.id)}>
              <button type="submit" aria-label={`Borrar ${r.nombre}`} className="size-9 rounded-full text-ink2 active:bg-fill">
                ×
              </button>
            </form>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}

