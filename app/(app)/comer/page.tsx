import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CargaLibre, Frecuentes, RegistroDelDia } from "@/components/comer/Comer";
import { SincronizarAlAbrir } from "@/components/hoy/SincronizarAlAbrir";
import { IconAlerta } from "@/components/icons";
import { Encabezado, Etiqueta, Marca, Tarjeta } from "@/components/ui";
import { resumenComer } from "@/lib/datos/comer";
import { fechaLarga } from "@/lib/fecha";
import { fmtEntero } from "@/lib/formato";

export const metadata: Metadata = { title: "Comer" };

function Barra({ valor, meta, color, etiqueta }: { valor: number; meta: number; color: string; etiqueta: string }) {
  const pct = meta > 0 ? Math.min(100, (valor / meta) * 100) : 0;
  return (
    <div role="progressbar" aria-label={etiqueta} aria-valuemin={0} aria-valuemax={meta} aria-valuenow={valor} className="h-2 overflow-hidden rounded bg-track">
      <div className="h-full rounded transition-[width]" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

async function Contenido() {
  const c = await resumenComer();
  const faltanKcal = c.meta ? Math.max(0, c.meta.kcal - c.consumido.kcal) : 0;
  const faltanProt = c.meta ? Math.max(0, c.meta.proteinaG - c.consumido.proteinaG) : 0;

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-4">
      <div className="flex flex-col gap-3 md:gap-4">
        <Etiqueta className="-mb-1 px-1">{fechaLarga(c.fecha)}</Etiqueta>
        <Tarjeta etiqueta="Resumen del día" className="flex flex-col gap-4">
          {c.meta ? (
            <>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between">
                  <p className="flex items-center gap-1.5 text-[15px]">
                    <Marca color="var(--kcal)" />
                    Calorías
                  </p>
                  <p className="text-[17px] font-semibold tabular-nums">
                    {fmtEntero(c.consumido.kcal)} <span className="font-normal text-ink2">/ {fmtEntero(c.meta.kcal)} kcal</span>
                  </p>
                </div>
                <Barra valor={c.consumido.kcal} meta={c.meta.kcal} color="var(--kcal)" etiqueta="Calorías del día" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between">
                  <p className="flex items-center gap-1.5 text-[15px]">
                    <Marca color="var(--prot)" />
                    Proteína
                  </p>
                  <p className="text-[17px] font-semibold tabular-nums">
                    {c.consumido.proteinaG} <span className="font-normal text-ink2">/ {c.meta.proteinaG} g</span>
                  </p>
                </div>
                <Barra valor={c.consumido.proteinaG} meta={c.meta.proteinaG} color="var(--prot)" etiqueta="Proteína del día" />
              </div>
              <div className="flex flex-col gap-1 text-[13px] leading-[18px] text-ink2">
                <p className="font-semibold text-ink">
                  {faltanKcal === 0 && faltanProt === 0 ? "Metas del día cumplidas." : `Faltan ${fmtEntero(faltanKcal)} kcal y ${faltanProt} g de proteína.`}
                </p>
                {c.meta.extraDeporte > 0 && <p>Incluye +{fmtEntero(c.meta.extraDeporte)} kcal por el deporte de hoy.</p>}
                <p>{c.meta.motivo}</p>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="flex items-start gap-2 text-[15px]">
                <IconAlerta size={18} style={{ color: "var(--warn)" }} className="mt-0.5 shrink-0" />
                Para calcular tus metas hace falta tu peso y tu meta de peso.
              </p>
              <Link href="/progreso" className="flex h-11 items-center justify-center rounded-xl bg-fill text-[15px] font-semibold text-link">
                Ir a Progreso
              </Link>
            </div>
          )}
        </Tarjeta>
        <section aria-label="Registro de hoy" className="flex flex-col gap-2">
          <h2 className="px-1 text-[20px] font-semibold">Hoy</h2>
          <RegistroDelDia registros={c.registros} />
        </section>
      </div>

      <section aria-label="Comidas frecuentes" className="flex flex-col gap-2">
        <h2 className="px-1 text-[20px] font-semibold">Frecuentes</h2>
        <Frecuentes frecuentes={c.frecuentes} />
        <CargaLibre />
      </section>
    </div>
  );
}

export default function ComerPage() {
  return (
    <>
      <SincronizarAlAbrir />
      <Encabezado titulo="Comer" />
      <Suspense fallback={<Tarjeta className="h-64 animate-pulse">{null}</Tarjeta>}>
        <Contenido />
      </Suspense>
    </>
  );
}
