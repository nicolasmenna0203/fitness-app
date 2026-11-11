"use client";

import { useActionState, useState } from "react";
import { guardarMeta, registrarPesaje, type Resultado } from "@/app/acciones/progreso";

const campo = "h-11 rounded-xl bg-fill px-3 text-[17px] tabular-nums outline-none focus:ring-2 focus:ring-accent";

/** Peso de hoy: un número y un toque. Viene precargado con el último. */
export function FormPesaje({ ultimoKg }: { ultimoKg: number | null }) {
  const [estado, accion, enviando] = useActionState<Resultado | null, FormData>(registrarPesaje, null);
  return (
    <form action={accion} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label htmlFor="kg-hoy" className="sr-only">
          Peso de hoy en kg
        </label>
        <input
          id="kg-hoy"
          name="kg"
          inputMode="decimal"
          required
          defaultValue={ultimoKg !== null ? String(ultimoKg).replace(".", ",") : ""}
          placeholder="kg"
          className={`${campo} w-28`}
        />
        <span className="text-[15px] text-ink2">kg</span>
        <button type="submit" disabled={enviando} className="ml-auto h-11 rounded-xl bg-accent px-5 text-[17px] font-semibold text-on-accent disabled:opacity-60">
          {enviando ? "Guardando…" : "Registrar"}
        </button>
      </div>
      <p aria-live="polite" className={`text-[13px] ${estado && !estado.ok ? "text-warn" : "text-ink2"}`}>
        {estado ? (estado.ok ? "Peso de hoy guardado." : estado.error) : "Pesate a la mañana, en ayunas: así los días se comparan mejor."}
      </p>
    </form>
  );
}

export function FormMeta({
  meta,
  sinPesajes,
}: {
  meta: { pesoMetaKg: number; fechaMeta: string; proteinaGPorKg: number } | null;
  sinPesajes: boolean;
}) {
  const [abierto, setAbierto] = useState(meta === null);
  const [estado, accion, enviando] = useActionState<Resultado | null, FormData>(async (previo, datos) => {
    const r = await guardarMeta(previo, datos);
    if (r.ok) setAbierto(false);
    return r;
  }, null);

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="self-start text-[15px] text-link">
        Cambiar meta
      </button>
    );
  }
  return (
    <form action={accion} className="flex flex-col gap-2.5">
      {sinPesajes && (
        <label className="flex items-center justify-between gap-3 text-[15px]">
          Peso actual
          <input name="pesoActual" inputMode="decimal" required placeholder="kg" className={`${campo} w-28 text-right`} />
        </label>
      )}
      <label className="flex items-center justify-between gap-3 text-[15px]">
        Peso meta
        <input
          name="pesoMeta"
          inputMode="decimal"
          required
          defaultValue={meta ? String(meta.pesoMetaKg).replace(".", ",") : ""}
          placeholder="kg"
          className={`${campo} w-28 text-right`}
        />
      </label>
      <label className="flex items-center justify-between gap-3 text-[15px]">
        Fecha meta
        <input name="fechaMeta" type="date" required defaultValue={meta?.fechaMeta ?? ""} className={`${campo} text-right`} />
      </label>
      <label className="flex items-center justify-between gap-3 text-[15px]">
        Proteína (g por kg)
        <input
          name="proteina"
          inputMode="decimal"
          defaultValue={String(meta?.proteinaGPorKg ?? 1.8).replace(".", ",")}
          className={`${campo} w-28 text-right`}
        />
      </label>
      {estado && !estado.ok && (
        <p role="alert" className="text-[13px] text-warn">
          {estado.error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={enviando} className="h-11 flex-1 rounded-xl bg-accent text-[17px] font-semibold text-on-accent disabled:opacity-60">
          {enviando ? "Guardando…" : "Guardar meta"}
        </button>
        {meta && (
          <button type="button" onClick={() => setAbierto(false)} className="h-11 px-3 text-[15px] text-link">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
