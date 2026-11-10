import type { Metadata } from "next";
import { Suspense } from "react";
import { Anillos } from "@/components/hoy/Anillos";
import { ProximoEntreno } from "@/components/hoy/ProximoEntreno";
import { SincronizarAlAbrir } from "@/components/hoy/SincronizarAlAbrir";
import { FcReposo, MetaPeso, RecuperacionCargando, Sueno } from "@/components/hoy/Tarjetas";
import { Encabezado, Etiqueta, Tarjeta } from "@/components/ui";
import { recuperacionDeHoy } from "@/lib/datos/recuperacion";
import { resumenHoyDemo } from "@/lib/demo/hoy";

export const metadata: Metadata = { title: "Hoy" };

/** Sueño y FC en reposo reales, de la pulsera. Se leen en cada visita. */
async function Recuperacion() {
  const r = await recuperacionDeHoy();
  return (
    <>
      <Sueno r={r} />
      <FcReposo r={r} />
    </>
  );
}

export default function HoyPage() {
  // Entreno, comidas y peso siguen con datos sintéticos hasta tener esas secciones.
  const hoy = resumenHoyDemo();

  return (
    <>
      <SincronizarAlAbrir />
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
          <Suspense fallback={<RecuperacionCargando />}>
            <Recuperacion />
          </Suspense>
        </div>

        <div className="md:col-span-2 xl:col-span-3">
          <MetaPeso peso={hoy.peso} />
        </div>
      </div>
    </>
  );
}
