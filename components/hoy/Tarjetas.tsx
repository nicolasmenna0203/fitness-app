import { IconAlerta, IconCheck, IconLuna, IconPulso } from "@/components/icons";
import { Etiqueta, Tarjeta } from "@/components/ui";
import { fmtDelta, fmtDuracion, fmtKg } from "@/lib/formato";
import type { EstadoRecuperacion } from "@/lib/recuperacion";
import type { Recuperacion, ResumenHoyDemo } from "@/types/hoy";

const ESTADO: Record<EstadoRecuperacion, { texto: string; color: string; Icono: typeof IconAlerta }> = {
  buena: { texto: "Recuperación buena", color: "var(--good)", Icono: IconCheck },
  media: { texto: "Recuperación media", color: "var(--warn)", Icono: IconAlerta },
  baja: { texto: "Recuperación baja", color: "var(--warn)", Icono: IconAlerta },
};

export function Sueno({ r }: { r: Recuperacion }) {
  const e = r.estado ? ESTADO[r.estado] : null;
  return (
    <Tarjeta etiqueta="Sueño" className="flex flex-1 flex-col gap-1 py-3.5">
      <Etiqueta className="flex items-center gap-1.5">
        <IconLuna size={14} style={{ color: "var(--sleep)" }} />
        Sueño
      </Etiqueta>
      <p className="text-[22px] font-semibold tabular-nums">{r.suenoMin !== null ? fmtDuracion(r.suenoMin) : "—"}</p>
      <p className="flex items-center gap-1 text-[13px] text-ink2">
        {e ? (
          <>
            <e.Icono size={13} style={{ color: e.color }} />
            {e.texto}
          </>
        ) : (
          "Sin datos de anoche"
        )}
      </p>
    </Tarjeta>
  );
}

export function FcReposo({ r }: { r: Recuperacion }) {
  const d = r.fcReposoVsPromedio;
  return (
    <Tarjeta etiqueta="Frecuencia cardíaca en reposo" className="flex flex-1 flex-col gap-1 py-3.5">
      <Etiqueta className="flex items-center gap-1.5">
        <IconPulso size={14} />
        FC reposo
      </Etiqueta>
      <p className="text-[22px] font-semibold tabular-nums">{r.fcReposo !== null ? `${r.fcReposo} lpm` : "—"}</p>
      <p className="text-[13px] text-ink2">
        {r.fcReposo === null
          ? "Sin datos de hoy"
          : d === null
            ? "Promedio en cálculo"
            : d === 0
              ? "En tu promedio"
              : `${fmtDelta(d, 0)} ${d > 0 ? "sobre" : "bajo"} tu promedio`}
      </p>
    </Tarjeta>
  );
}

/** Mientras cargan los datos de la pulsera. */
export function RecuperacionCargando() {
  return (
    <>
      {["Sueño", "FC reposo"].map((t) => (
        <Tarjeta key={t} className="flex flex-1 animate-pulse flex-col gap-1 py-3.5">
          <Etiqueta>{t}</Etiqueta>
          <p className="h-7 w-24 rounded bg-fill" />
          <p className="h-4 w-32 rounded bg-fill" />
        </Tarjeta>
      ))}
    </>
  );
}

export function MetaPeso({ peso }: { peso: ResumenHoyDemo["peso"] }) {
  const avance = Math.max(0, Math.min(1, (peso.tendencia - peso.inicio) / (peso.meta - peso.inicio)));
  const enRitmo = peso.ritmoSemanal >= peso.ritmoObjetivo * 0.8;
  return (
    <Tarjeta etiqueta="Meta de peso" className="flex flex-col gap-2.5 py-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[22px] font-semibold tabular-nums">
          {fmtKg(peso.tendencia)} kg <span className="text-[15px] font-normal text-ink2">tendencia</span>
        </p>
        <p className="text-[15px] text-ink2">
          Meta {peso.meta} kg · {peso.mesMeta}
        </p>
      </div>
      <div
        role="progressbar"
        aria-label="Avance hacia la meta de peso"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(avance * 100)}
        className="h-2 overflow-hidden rounded bg-track"
      >
        <div className="h-full rounded bg-accent" style={{ width: `${Math.max(avance * 100, 3)}%` }} />
      </div>
      <p className="flex items-center gap-1 text-[13px] text-ink2">
        {enRitmo ? (
          <IconCheck size={13} style={{ color: "var(--good)" }} />
        ) : (
          <IconAlerta size={13} style={{ color: "var(--warn)" }} />
        )}
        {fmtDelta(peso.ritmoSemanal)} kg por semana · {enRitmo ? "en ritmo" : "por debajo del ritmo"}
      </p>
    </Tarjeta>
  );
}
