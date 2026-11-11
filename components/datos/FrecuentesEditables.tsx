"use client";

import { useActionState } from "react";
import { editarFrecuente, ocultarFrecuente, type Resultado } from "@/app/acciones/comer";
import { fmtEntero } from "@/lib/formato";
import type { Frecuente } from "@/lib/datos/comer";

const campo = "h-11 min-w-0 rounded-xl bg-fill px-3 text-[17px] tabular-nums outline-none focus:ring-2 focus:ring-accent";

function Fila({ f }: { f: Frecuente }) {
  const [estado, accion, enviando] = useActionState<Resultado | null, FormData>(editarFrecuente.bind(null, f.id), null);
  return (
    <li className="border-t-[0.5px] border-sep first:border-t-0">
      <details>
        <summary className="flex min-h-12 cursor-pointer items-center gap-3">
          <span className="flex-1 text-[15px]">{f.nombre}</span>
          <span className="text-[13px] text-ink2 tabular-nums">
            {fmtEntero(f.kcal)} kcal · {Math.round(f.proteinaG)} g
          </span>
        </summary>
        <form action={accion} className="flex flex-col gap-2 pb-3">
          <label className="flex flex-col gap-1 text-[13px] text-ink2">
            Nombre
            <input name="nombre" defaultValue={f.nombre} maxLength={60} className={campo} />
          </label>
          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-1 text-[13px] text-ink2">
              Calorías
              <input name="kcal" inputMode="numeric" defaultValue={f.kcal} className={campo} />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-[13px] text-ink2">
              Proteína (g)
              <input name="proteina" inputMode="decimal" defaultValue={String(f.proteinaG).replace(".", ",")} className={campo} />
            </label>
          </div>
          {estado && (
            <p role={estado.ok ? "status" : "alert"} className={`text-[13px] ${estado.ok ? "text-ink2" : "text-warn"}`}>
              {estado.ok ? "Guardado." : estado.error}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button type="submit" disabled={enviando} className="h-11 flex-1 rounded-xl bg-fill text-[15px] font-semibold text-link disabled:opacity-60">
              Guardar
            </button>
            <button type="submit" formAction={ocultarFrecuente.bind(null, f.id)} className="h-11 px-3 text-[15px] text-warn">
              Quitar
            </button>
          </div>
        </form>
      </details>
    </li>
  );
}

/** Comidas frecuentes: corregir valores o sacarlas de la grilla de Comer. */
export function FrecuentesEditables({ frecuentes }: { frecuentes: Frecuente[] }) {
  if (frecuentes.length === 0) {
    return <p className="text-[15px] text-ink2">Todavía no guardaste comidas frecuentes. Se crean desde Comer, al cargar una comida.</p>;
  }
  return <ul>{frecuentes.map((f) => <Fila key={f.id} f={f} />)}</ul>;
}
