import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { TarjetaProximo } from "@/components/entrenar/TarjetaProximo";
import { Anillos } from "@/components/hoy/Anillos";
import { SincronizarAlAbrir } from "@/components/hoy/SincronizarAlAbrir";
import { FcReposo, MetaPeso, RecuperacionCargando, Sueno } from "@/components/hoy/Tarjetas";
import { Encabezado, Etiqueta, Tarjeta } from "@/components/ui";
import { proximoPlan } from "@/lib/datos/entrenos";
import { recuperacionDeHoy } from "@/lib/datos/recuperacion";
import { resumenHoyDemo } from "@/lib/demo/hoy";
import { fechaLarga, fechaLocal } from "@/lib/fecha";

export const metadata: Metadata = { title: "Hoy" };

async function FechaDeHoy() {
  await connection();
  return fechaLarga(fechaLocal());
}

/** Sueño y FC en reposo reales, de la pulsera. */
async function Recuperacion() {
  const r = await recuperacionDeHoy();
  return (
    <>
      <Sueno r={r} />
      <FcReposo r={r} />
    </>
  );
}

async function Proximo() {
  const plan = await proximoPlan();
  return plan ? <TarjetaProximo plan={plan} compacto /> : null;
}

/** Entrenos reales; calorías y proteína siguen sintéticas hasta construir Comer. */
async function Metas() {
  const plan = await proximoPlan();
  const demo = resumenHoyDemo();
  return (
    <Anillos
      vertical
      anillos={[
        { nombre: "Calorías", valor: demo.kcal.consumidas, meta: demo.kcal.meta, unidad: "kcal", color: "var(--kcal)" },
        { nombre: "Proteína", valor: demo.proteina.consumida, meta: demo.proteina.meta, unidad: "g", color: "var(--prot)" },
        { nombre: "Entrenos", valor: plan?.hechos7Dias ?? 0, meta: plan?.metaSemana ?? 3, unidad: "en 7 días", color: "var(--move)" },
      ]}
    />
  );
}

export default function HoyPage() {
  const demo = resumenHoyDemo();

  return (
    <>
      <SincronizarAlAbrir />
      <Encabezado
        fecha={
          <Suspense fallback={<span className="invisible">Hoy</span>}>
            <FechaDeHoy />
          </Suspense>
        }
        titulo="Hoy"
      />
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="md:row-span-2 xl:row-span-1">
          <Suspense fallback={<Tarjeta className="h-80 animate-pulse">{null}</Tarjeta>}>
            <Proximo />
          </Suspense>
        </div>

        <Tarjeta etiqueta="Metas del día" className="flex flex-col gap-4">
          <Etiqueta className="hidden md:block">Metas del día</Etiqueta>
          <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-fill" />}>
            <Metas />
          </Suspense>
        </Tarjeta>

        <div className="flex gap-3 md:gap-4 xl:flex-col">
          <Suspense fallback={<RecuperacionCargando />}>
            <Recuperacion />
          </Suspense>
        </div>

        <div className="md:col-span-2 xl:col-span-3">
          <MetaPeso peso={demo.peso} />
        </div>
      </div>
    </>
  );
}
