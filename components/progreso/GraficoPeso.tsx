import { fmtKg } from "@/lib/formato";
import { diasEntre, type PuntoTendencia } from "@/lib/peso";
import type { Meta } from "@/lib/datos/progreso";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const W = 640;
const H = 240;
const M = { izq: 34, der: 14, arr: 22, aba: 28 };

/**
 * Pesajes (puntos) y tendencia (línea) de las últimas semanas. Con meta, se
 * extiende hasta la fecha meta con la línea punteada del ritmo necesario.
 * Una sola serie: sin leyenda en caja; la explican las etiquetas de abajo.
 */
export function GraficoPeso({ puntos, meta, hoy }: { puntos: PuntoTendencia[]; meta: Meta | null; hoy: string }) {
  if (puntos.length === 0) {
    return <p className="py-8 text-center text-[15px] text-ink2">Registrá tu peso para ver la tendencia.</p>;
  }
  const desde = puntos[0].fecha;
  const hasta = meta && meta.fechaMeta > hoy ? meta.fechaMeta : hoy;
  const totalDias = Math.max(7, diasEntre(desde, hasta));
  const kgs = puntos.flatMap((p) => [p.kg, p.tendencia]).concat(meta ? [meta.pesoMetaKg] : []);
  const paso = Math.max(...kgs) - Math.min(...kgs) > 6 ? 2 : 1;
  const yMin = Math.floor((Math.min(...kgs) - 0.3) / paso) * paso;
  const yMax = Math.ceil((Math.max(...kgs) + 0.3) / paso) * paso;

  const x = (fecha: string) => M.izq + (diasEntre(desde, fecha) / totalDias) * (W - M.izq - M.der);
  const y = (kg: number) => M.arr + ((yMax - kg) / (yMax - yMin)) * (H - M.arr - M.aba);

  const marcasY: number[] = [];
  for (let v = yMin; v <= yMax + 1e-9; v += paso) marcasY.push(v);

  const marcasX: { fecha: string; texto: string }[] = [];
  const d = new Date(`${desde}T12:00:00Z`);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  for (; d.toISOString().slice(0, 10) <= hasta; d.setUTCMonth(d.getUTCMonth() + 1)) {
    marcasX.push({ fecha: d.toISOString().slice(0, 10), texto: MESES[d.getUTCMonth()] });
  }

  const ultimo = puntos[puntos.length - 1];
  const tendencia = puntos.map((p) => `${x(p.fecha).toFixed(1)},${y(p.tendencia).toFixed(1)}`).join(" ");
  const resumen = `Peso de ${desde} a ${ultimo.fecha}: tendencia de ${fmtKg(puntos[0].tendencia)} a ${fmtKg(ultimo.tendencia)} kg${meta ? `; meta ${fmtKg(meta.pesoMetaKg)} kg` : ""}`;

  return (
    <figure className="m-0 flex flex-col gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={resumen} className="block h-auto w-full">
        {marcasY.map((v) => (
          <g key={v}>
            <line x1={M.izq} x2={W - M.der} y1={y(v)} y2={y(v)} stroke="var(--grid)" strokeWidth={1} />
            <text x={M.izq - 8} y={y(v) + 4} textAnchor="end" fontSize={12} fill="var(--ink2)">
              {v}
            </text>
          </g>
        ))}
        {marcasX.map((m) => (
          <text key={m.fecha} x={x(m.fecha)} y={H - 8} fontSize={12} fill="var(--ink2)">
            {m.texto}
          </text>
        ))}
        {hasta !== hoy && (
          <>
            <line x1={x(hoy)} x2={x(hoy)} y1={M.arr - 6} y2={H - M.aba} stroke="var(--ink2)" strokeWidth={1} strokeDasharray="2 4" />
            <text x={x(hoy) + 5} y={M.arr} fontSize={12} fill="var(--ink2)">
              hoy
            </text>
          </>
        )}
        {puntos.map((p) => (
          <circle key={p.fecha} cx={x(p.fecha)} cy={y(p.kg)} r={3.5} fill="var(--track)" stroke="var(--ink2)" strokeOpacity={0.35}>
            <title>{`${p.fecha}: ${fmtKg(p.kg)} kg`}</title>
          </circle>
        ))}
        <polyline points={tendencia} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {meta && meta.fechaMeta > hoy && (
          <>
            <line
              x1={x(ultimo.fecha)}
              y1={y(ultimo.tendencia)}
              x2={x(meta.fechaMeta)}
              y2={y(meta.pesoMetaKg)}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="6 6"
              strokeLinecap="round"
            />
            <circle cx={x(meta.fechaMeta)} cy={y(meta.pesoMetaKg)} r={5.5} fill="var(--card)" stroke="var(--accent)" strokeWidth={2.5} />
            <text x={x(meta.fechaMeta) - 10} y={y(meta.pesoMetaKg) - 10} textAnchor="end" fontSize={12} fontWeight={600} fill="var(--ink)">
              Meta {fmtKg(meta.pesoMetaKg)} kg
            </text>
          </>
        )}
        <circle cx={x(ultimo.fecha)} cy={y(ultimo.tendencia)} r={5} fill="var(--accent)" stroke="var(--card)" strokeWidth={2} />
      </svg>
      <figcaption className="flex flex-wrap gap-4 text-[13px] text-ink2">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-full bg-track ring-1 ring-ink2/40" />
          Pesaje
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-[3px] w-3.5 rounded bg-accent" />
          Tendencia
        </span>
        {meta && meta.fechaMeta > hoy && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="w-3.5 border-t-2 border-dashed border-accent" />
            Ritmo necesario
          </span>
        )}
      </figcaption>
    </figure>
  );
}
