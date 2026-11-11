import { fmtEntero } from "@/lib/formato";
import { Marca } from "@/components/ui";

type Anillo = { nombre: string; valor: number; meta: number | null; unidad: string; color: string };

const RADIOS = [56, 42, 28];

/** Tres anillos concéntricos (calorías, proteína, entrenos) con leyenda en texto. */
export function Anillos({ anillos, tamano = 124, vertical = false }: { anillos: Anillo[]; tamano?: number; vertical?: boolean }) {
  const resumen = anillos.map((a) => (a.meta ? `${a.nombre} ${Math.round((a.valor / a.meta) * 100)} %` : `${a.nombre} sin meta`)).join(", ");
  return (
    <div className={`flex items-center gap-5 ${vertical ? "md:flex-col md:items-stretch" : ""}`}>
      <svg width={tamano} height={tamano} viewBox="0 0 128 128" role="img" aria-label={resumen} className="shrink-0 self-center">
        <g transform="rotate(-90 64 64)" fill="none" strokeWidth={11} strokeLinecap="round">
          {anillos.map((a, i) => {
            const r = RADIOS[i];
            const c = 2 * Math.PI * r;
            const p = a.meta ? Math.min(1, a.valor / a.meta) : 0;
            return (
              <g key={a.nombre}>
                <circle cx={64} cy={64} r={r} stroke="var(--track)" />
                {p > 0 && <circle cx={64} cy={64} r={r} stroke={a.color} strokeDasharray={`${c * p} ${c}`} />}
              </g>
            );
          })}
        </g>
      </svg>
      <dl className="flex flex-1 flex-col gap-2.5">
        {anillos.map((a) => (
          <div key={a.nombre} className={vertical ? "md:flex md:justify-between" : ""}>
            <dt className="flex items-center gap-1.5 text-[13px] text-ink2">
              <Marca color={a.color} />
              {a.nombre}
            </dt>
            <dd className="text-[17px] font-semibold tabular-nums">
              {fmtEntero(a.valor)} <span className="font-normal text-ink2">/ {a.meta !== null ? fmtEntero(a.meta) : "—"} {a.unidad}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
