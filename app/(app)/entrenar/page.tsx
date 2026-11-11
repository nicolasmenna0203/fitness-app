import type { Metadata } from "next";
import { Suspense } from "react";
import { TarjetaProximo } from "@/components/entrenar/TarjetaProximo";
import { Encabezado, Etiqueta, Tarjeta } from "@/components/ui";
import { historial, proximoPlan } from "@/lib/datos/entrenos";
import { fechaLarga } from "@/lib/fecha";

export const metadata: Metadata = { title: "Entrenar" };

async function Proximo() {
  const plan = await proximoPlan();
  if (!plan) {
    return (
      <Tarjeta>
        <p className="text-[15px] text-ink2">No hay entrenos cargados en la rotación.</p>
      </Tarjeta>
    );
  }
  return <TarjetaProximo plan={plan} />;
}

async function Historial() {
  const items = await historial(14);
  return (
    <Tarjeta etiqueta="Últimos 14 días" className="flex flex-col gap-1">
      <Etiqueta className="pb-1">Últimos 14 días</Etiqueta>
      {items.length === 0 ? (
        <p className="py-2 text-[15px] text-ink2">Todavía no hay entrenos ni actividades.</p>
      ) : (
        <ul>
          {items.map((i) => (
            <li key={i.clave} className="flex items-baseline justify-between gap-3 border-t-[0.5px] border-sep py-2.5 first:border-t-0">
              <span className="min-w-0">
                <span className="block text-[13px] text-ink2">{fechaLarga(i.fecha)}</span>
                <span className="flex items-center gap-1.5 text-[15px]">
                  <span aria-hidden className={`size-2 shrink-0 rounded-full ${i.esEntreno ? "bg-move" : "bg-track"}`} />
                  {i.titulo}
                </span>
              </span>
              <span className="shrink-0 text-[13px] text-ink2 tabular-nums">{i.detalle}</span>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}

function Cargando({ alto }: { alto: string }) {
  return <Tarjeta className={`animate-pulse ${alto}`}>{null}</Tarjeta>;
}

export default function EntrenarPage() {
  return (
    <>
      <Encabezado titulo="Entrenar" />
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:gap-4">
        <Suspense fallback={<Cargando alto="h-96" />}>
          <Proximo />
        </Suspense>
        <Suspense fallback={<Cargando alto="h-64" />}>
          <Historial />
        </Suspense>
      </div>
    </>
  );
}
