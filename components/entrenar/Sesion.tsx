"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { descartarEntreno, deshacerSerie, registrarSerie, terminarEntreno } from "@/app/acciones/entrenos";
import { IconCheck } from "@/components/icons";
import { conCarga, fmtCarga, seriesDeHoy } from "@/lib/entrenos/progresion";
import type { EjercicioPlan, SesionEntreno } from "@/types/entrenos";

type Hecha = { kg: number | null; reps: number };
type Editor = { kg: number | null; reps: number };
const clave = (ejercicioId: number, numero: number) => `${ejercicioId}:${numero}`;

function reloj(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${p(m)}:${p(s % 60)}` : `${m}:${p(s % 60)}`;
}

/** Campo numérico con − y +: se puede tocar o escribir. */
function Paso({
  etiqueta,
  valor,
  unidad,
  paso,
  min,
  max,
  onCambio,
}: {
  etiqueta: string;
  valor: number | null;
  unidad: string;
  paso: number;
  min: number;
  max: number;
  onCambio: (v: number | null) => void;
}) {
  const [texto, setTexto] = useState(valor === null ? "" : fmtCarga(valor));
  const fijar = (v: number) => {
    const ajustado = Math.min(max, Math.max(min, Math.round(v * 100) / 100));
    setTexto(fmtCarga(ajustado));
    onCambio(ajustado);
  };
  const id = `paso-${etiqueta}`;
  return (
    <div className="flex flex-1 items-center justify-between rounded-[14px] bg-fill p-2">
      <button
        type="button"
        aria-label={`Menos ${etiqueta}`}
        onClick={() => fijar((valor ?? paso) - paso)}
        className="size-11 shrink-0 rounded-full bg-card text-[22px] active:opacity-70"
      >
        −
      </button>
      <div className="flex min-w-0 flex-col items-center">
        <label htmlFor={id} className="sr-only">
          {etiqueta}
        </label>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={texto}
          placeholder="—"
          onChange={(e) => {
            const t = e.target.value.replace(/[^\d.,]/g, "");
            setTexto(t);
            const n = Number(t.replace(",", "."));
            onCambio(t === "" ? null : Number.isFinite(n) ? Math.min(max, n) : valor);
          }}
          className="w-20 bg-transparent text-center text-[28px] font-bold tabular-nums outline-none placeholder:text-ink2"
        />
        <span className="text-xs text-ink2">{unidad}</span>
      </div>
      <button
        type="button"
        aria-label={`Más ${etiqueta}`}
        onClick={() => fijar((valor ?? 0) + paso)}
        className="size-11 shrink-0 rounded-full bg-card text-[22px] active:opacity-70"
      >
        +
      </button>
    </div>
  );
}

/** Pantalla del entreno en curso: una serie = un toque, con la sugerencia precargada. */
export function Sesion({ datos }: { datos: SesionEntreno }) {
  const ejs = datos.ejercicios;
  const total = (e: EjercicioPlan) => seriesDeHoy(e.series, datos.liviana);

  const [hechas, setHechas] = useState<Map<string, Hecha>>(
    () => new Map(datos.hechas.map((h) => [clave(h.ejercicioId, h.numero), { kg: h.kg, reps: h.reps }])),
  );
  const hechasDe = (e: EjercicioPlan, mapa = hechas) => {
    let c = 0;
    for (let n = 1; n <= total(e); n++) if (mapa.has(clave(e.ejercicioId, n))) c++;
    return c;
  };
  const proximoNumero = (e: EjercicioPlan, mapa = hechas) => {
    for (let n = 1; n <= total(e); n++) if (!mapa.has(clave(e.ejercicioId, n))) return n;
    return null;
  };
  const [actual, setActual] = useState(() => {
    const i = ejs.findIndex((e) => hechasDe(e) < total(e));
    return i === -1 ? ejs.length - 1 : i;
  });

  const ej = ejs[actual];
  const numero = proximoNumero(ej);
  const conPeso = conCarga(ej.tipoCarga);
  const unidadReps = ej.tipoCarga === "tiempo" ? "segundos" : "reps";

  const precarga = (e: EjercicioPlan, n: number): Editor => {
    const previa = hechas.get(clave(e.ejercicioId, n - 1));
    const objetivos = e.sugerencia.repsPorSerie;
    return { kg: previa?.kg ?? e.sugerencia.kg, reps: objetivos[Math.min(n - 1, objetivos.length - 1)] ?? e.repsMin };
  };

  // El editor se recalcula cuando cambia la serie a cargar (patrón de React para
  // derivar estado de un cambio de props/estado, sin efecto).
  const llave = `${ej.ejercicioId}:${numero}`;
  const [editor, setEditor] = useState<Editor>(() => (numero ? precarga(ej, numero) : { kg: null, reps: ej.repsMin }));
  const [llaveEditor, setLlaveEditor] = useState(llave);
  if (llaveEditor !== llave) {
    setLlaveEditor(llave);
    if (numero) setEditor(precarga(ej, numero));
  }

  const [ahora, setAhora] = useState<number | null>(null);
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Pantalla siempre encendida mientras se entrena (si el navegador lo permite).
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock
      ?.request("screen")
      .then((l) => (lock = l))
      .catch(() => {});
    return () => {
      lock?.release().catch(() => {});
    };
  }, []);

  const [descanso, setDescanso] = useState<{ hasta: number; total: number } | null>(null);
  const restante = descanso && ahora !== null ? (descanso.hasta - ahora) / 1000 : null;

  const [ultima, setUltima] = useState<{ ejercicioId: number; numero: number; indice: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, iniciar] = useTransition();

  function confirmar() {
    if (!numero) return;
    if (conPeso && editor.kg === null) {
      setError("Elegí el peso antes de confirmar.");
      return;
    }
    const k = clave(ej.ejercicioId, numero);
    const valor: Hecha = { kg: conPeso ? editor.kg : null, reps: editor.reps };
    const nuevo = new Map(hechas).set(k, valor);
    setHechas(nuevo);
    setError(null);
    setUltima({ ejercicioId: ej.ejercicioId, numero, indice: actual });

    let quedan = true;
    if (proximoNumero(ej, nuevo) === null) {
      const despues = ejs.findIndex((e, i) => i > actual && hechasDe(e, nuevo) < total(e));
      const cualquiera = ejs.findIndex((e) => hechasDe(e, nuevo) < total(e));
      const siguiente = despues !== -1 ? despues : cualquiera;
      if (siguiente === -1) quedan = false;
      else setActual(siguiente);
    }
    setDescanso(quedan ? { hasta: Date.now() + ej.descansoSeg * 1000, total: ej.descansoSeg } : null);

    iniciar(async () => {
      const r = await registrarSerie(datos.id, ej.ejercicioId, numero, valor.kg, valor.reps);
      if (!r.ok) {
        setHechas((m) => {
          const c = new Map(m);
          c.delete(k);
          return c;
        });
        setError(`No se guardó la serie: ${r.error}`);
      }
    });
  }

  function deshacer() {
    const u = ultima;
    if (!u) return;
    setUltima(null);
    setHechas((m) => {
      const c = new Map(m);
      c.delete(clave(u.ejercicioId, u.numero));
      return c;
    });
    setActual(u.indice);
    setDescanso(null);
    iniciar(async () => {
      const r = await deshacerSerie(datos.id, u.ejercicioId, u.numero);
      if (!r.ok) setError(r.error);
    });
  }

  const completos = ejs.filter((e) => hechasDe(e) >= total(e)).length;
  const terminado = completos === ejs.length;
  const transcurrido = ahora !== null ? reloj((ahora - Date.parse(datos.inicio)) / 1000) : "—";
  const mostrarMensaje = ej.sugerencia.mensaje && ej.sugerencia.motivo !== "mantener";

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3">
        <div className="grid min-h-11 grid-cols-[80px_1fr_80px] items-center">
          <Link href="/entrenar" className="py-2.5 text-[17px] text-link">
            Salir
          </Link>
          <div className="text-center">
            <p className="text-[17px] font-semibold">{datos.nombre}</p>
            {datos.liviana && <p className="text-[13px] text-ink2">Versión liviana</p>}
          </div>
          <p className="text-right text-[17px] font-semibold tabular-nums" aria-label="Tiempo de entreno">
            {transcurrido}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <div role="img" aria-label={`${completos} de ${ejs.length} ejercicios completos`} className="flex gap-1">
            {ejs.map((e, i) => (
              <span
                key={e.orden}
                className={`h-1 flex-1 rounded-full ${hechasDe(e) >= total(e) ? "bg-ink2" : i === actual ? "bg-accent" : "bg-track"}`}
              />
            ))}
          </div>
          <p className="text-[13px] text-ink2">
            Ejercicio {actual + 1} de {ejs.length}
          </p>
        </div>
      </header>

      <section aria-label={ej.nombre} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] leading-[34px] font-bold tracking-tight">{ej.nombre}</h1>
          <div className="flex flex-wrap gap-1.5">
            {[ej.equipo, `${total(ej)} × ${ej.repsMin}–${ej.repsMax}${ej.tipoCarga === "tiempo" ? " s" : ""}`, ej.nota]
              .filter(Boolean)
              .map((c) => (
                <span key={c} className="rounded-xl bg-card px-2.5 py-1 text-[13px] text-ink2">
                  {c}
                </span>
              ))}
          </div>
        </div>

        {mostrarMensaje && <p className="rounded-[14px] bg-hl p-3 text-sm leading-[19px]">{ej.sugerencia.mensaje}</p>}

        <div className="rounded-[20px] bg-card px-4 pt-2 pb-4">
          <div className="grid grid-cols-[48px_1fr_1fr_32px] py-2 text-xs font-semibold tracking-[.03em] text-ink2 uppercase">
            <span>Serie</span>
            <span>{conPeso ? "Kg" : ""}</span>
            <span>{ej.tipoCarga === "tiempo" ? "Seg" : "Reps"}</span>
            <span />
          </div>
          {Array.from({ length: total(ej) }, (_, i) => i + 1).map((n) => {
            const h = hechas.get(clave(ej.ejercicioId, n));
            if (n === numero && !h) return null;
            const objetivo = ej.sugerencia.repsPorSerie[Math.min(n - 1, ej.sugerencia.repsPorSerie.length - 1)];
            return (
              <div
                key={n}
                className={`grid h-11 grid-cols-[48px_1fr_1fr_32px] items-center border-t-[0.5px] border-sep text-[17px] tabular-nums ${h ? "" : "text-ink2"}`}
              >
                <span className="text-ink2">{n}</span>
                <span>{conPeso ? (h ? (h.kg !== null ? fmtCarga(h.kg) : "—") : ej.sugerencia.kg !== null ? fmtCarga(ej.sugerencia.kg) : "—") : ""}</span>
                <span>{h ? h.reps : objetivo}</span>
                {h ? (
                  <span role="img" aria-label="Hecha" className="flex size-6 items-center justify-center rounded-full bg-good text-white">
                    <IconCheck size={14} />
                  </span>
                ) : (
                  <span />
                )}
              </div>
            );
          })}

          {numero ? (
            <div key={llave} className="flex flex-col gap-3 border-t-[0.5px] border-sep pt-3">
              <p className="text-[13px] text-ink2">
                Serie {numero} de {total(ej)}
              </p>
              <div className="flex gap-3">
                {conPeso && (
                  <Paso
                    etiqueta="kg"
                    valor={editor.kg}
                    unidad={ej.tipoCarga === "mancuerna" ? "kg c/u" : "kg"}
                    paso={ej.tipoCarga === "pila" ? (ej.incrementoKg ?? 5) : 1}
                    min={0}
                    max={ej.cargaMaxKg ?? 200}
                    onCambio={(kg) => setEditor((e) => ({ ...e, kg }))}
                  />
                )}
                <Paso
                  etiqueta={unidadReps}
                  valor={editor.reps}
                  unidad={unidadReps}
                  paso={ej.tipoCarga === "tiempo" ? 5 : 1}
                  min={0}
                  max={ej.tipoCarga === "tiempo" ? 600 : 100}
                  onCambio={(reps) => setEditor((e) => ({ ...e, reps: reps ?? 0 }))}
                />
              </div>
              <button
                type="button"
                onClick={confirmar}
                disabled={conPeso && editor.kg === null}
                className="h-[50px] rounded-[14px] bg-accent text-[17px] font-semibold text-on-accent active:opacity-80 disabled:opacity-50"
              >
                Confirmar serie
              </button>
            </div>
          ) : (
            <p className="flex items-center gap-1.5 border-t-[0.5px] border-sep pt-3 text-[15px]">
              <IconCheck size={16} style={{ color: "var(--good)" }} />
              Ejercicio completo
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 rounded-xl bg-warnbg px-3 py-2 text-sm">
              {error}
            </p>
          )}
        </div>

        {descanso && restante !== null && (
          <section aria-label="Descanso" className="flex items-center gap-3.5 rounded-[20px] bg-card px-4 py-3.5" aria-live="polite">
            <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden className="shrink-0">
              <g transform="rotate(-90 22 22)" fill="none" strokeWidth={5} strokeLinecap="round">
                <circle cx="22" cy="22" r="18" stroke="var(--track)" />
                <circle cx="22" cy="22" r="18" stroke="var(--accent)" strokeDasharray={`${113.1 * Math.max(0, restante / descanso.total)} 113.1`} />
              </g>
            </svg>
            <div className="flex-1">
              <p className="text-[22px] font-semibold tabular-nums">{restante > 0 ? reloj(restante) : "¡Dale!"}</p>
              <p className="text-[13px] text-ink2">{restante > 0 ? "Descanso" : "Ya podés hacer la próxima serie"}</p>
            </div>
            {restante > 0 && (
              <button
                type="button"
                onClick={() => setDescanso((d) => (d ? { ...d, hasta: d.hasta + 15000, total: d.total + 15 } : d))}
                className="h-9 rounded-full bg-fill px-3 text-[15px]"
              >
                +15 s
              </button>
            )}
            <button type="button" onClick={() => setDescanso(null)} className="h-9 rounded-full bg-fill px-3 text-[15px]">
              {restante > 0 ? "Saltar" : "Cerrar"}
            </button>
          </section>
        )}
        {ultima && (
          <button type="button" onClick={deshacer} disabled={guardando} className="self-start text-[15px] text-link">
            Deshacer última serie
          </button>
        )}
      </section>

      <nav aria-label="Ejercicios" className="rounded-[20px] bg-card px-4 py-1">
        {ejs.map((e, i) => {
          const c = hechasDe(e);
          const listo = c >= total(e);
          return (
            <button
              key={e.orden}
              type="button"
              onClick={() => setActual(i)}
              aria-current={i === actual ? "step" : undefined}
              className={`flex min-h-11 w-full items-center gap-3 border-t-[0.5px] border-sep py-2 text-left first:border-t-0 ${i === actual ? "font-semibold" : ""}`}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs ${listo ? "bg-good text-white" : i === actual ? "bg-accent text-on-accent" : "bg-fill text-ink2"}`}
              >
                {listo ? <IconCheck size={14} /> : i + 1}
              </span>
              <span className="flex-1 text-[15px]">{e.nombre}</span>
              <span className="text-[13px] text-ink2 tabular-nums">
                {c}/{total(e)}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-2 pt-2">
        <form action={terminarEntreno.bind(null, datos.id)} className="w-full">
          <button
            type="submit"
            className={`h-[50px] w-full rounded-[14px] text-[17px] font-semibold ${terminado ? "bg-accent text-on-accent" : "bg-card text-link"}`}
          >
            {terminado ? "Terminar entreno" : "Terminar ahora"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            if (confirm("¿Descartar este entreno? No se guarda ninguna serie.")) iniciar(() => descartarEntreno(datos.id));
          }}
          className="min-h-11 text-[15px] text-warn"
        >
          Descartar entreno
        </button>
      </div>
    </div>
  );
}
