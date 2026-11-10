import type { Metadata } from "next";
import { Anillos } from "@/components/hoy/Anillos";
import { ProximoEntreno } from "@/components/hoy/ProximoEntreno";
import { FcReposo, MetaPeso, Sueno } from "@/components/hoy/Tarjetas";
import { Encabezado, Etiqueta, Tarjeta } from "@/components/ui";
import { resumenHoyDemo } from "@/lib/demo/hoy";

export const metadata: Metadata = { title: "Hoy" };

export default function HoyPage() {
  // Hasta que exista la base de datos (ADR 0007), la pantalla usa datos sintéticos.
  const hoy = resumenHoyDemo();

  return (
    <>
      <Encabezado fecha={hoy.fecha} titulo="Hoy" />
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="md:row-span-2 xl:row-span-1">
          <ProximoEntreno datos={hoy.proximo} hechos={hoy.entrenos7Dias} meta={hoy.metaEntrenosSemana} />
        </div>

        <Tarjeta etiqueta="Metas del día" className="flex flex-col gap-4">
          <Etiqueta className="hidden md:block">Metas del día</Etiqueta>
          <Anillos
            vertical
            anillos={[
              { nombre: "Calorías", valor: hoy.kcal.consumidas, meta: hoy.kcal.meta, unidad: "kcal", color: "var(--kcal)" },
              { nombre: "Proteína", valor: hoy.proteina.consumida, meta: hoy.proteina.meta, unidad: "g", color: "var(--prot)" },
              { nombre: "Entrenos", valor: hoy.entrenos7Dias, meta: hoy.metaEntrenosSemana, unidad: "en 7 días", color: "var(--move)" },
            ]}
          />
        </Tarjeta>

        <div className="flex gap-3 md:gap-4 xl:flex-col">
          <Sueno r={hoy.recuperacion} />
          <FcReposo r={hoy.recuperacion} />
        </div>

        <div className="md:col-span-2 xl:col-span-3">
          <MetaPeso peso={hoy.peso} />
        </div>
      </div>
    </>
  );
}
