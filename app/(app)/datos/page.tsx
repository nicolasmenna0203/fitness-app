import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cerrarSesion } from "@/app/login/acciones";
import { FrecuentesEditables } from "@/components/datos/FrecuentesEditables";
import { TarjetaGoogle } from "@/components/datos/TarjetaGoogle";
import { Encabezado, Etiqueta, Tarjeta } from "@/components/ui";
import { esDemo } from "@/lib/demo";
import { frecuentesActivas } from "@/lib/datos/comer";
import { catalogoConUso } from "@/lib/datos/entrenos";
import { EQUIPAMIENTO } from "@/lib/entrenos/catalogo";
import { fmtCarga } from "@/lib/entrenos/progresion";

export const metadata: Metadata = { title: "Datos" };

function Equipamiento() {
  return (
    <Tarjeta etiqueta="Equipamiento" className="flex flex-col gap-1">
      <Etiqueta className="pb-1">Equipamiento</Etiqueta>
      <ul>
        {EQUIPAMIENTO.map((e) => (
          <li key={e.nombre} className="flex flex-col gap-0.5 border-t-[0.5px] border-sep py-2.5 first:border-t-0">
            <span className="text-[15px] font-semibold">{e.nombre}</span>
            <span className="text-[15px] text-ink2">{e.detalle}</span>
            <span className="text-[13px] text-ink2">Para: {e.uso}</span>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}

const unidad = (t: string) => (t === "mancuerna" ? " c/u" : "");

async function PesosGuia() {
  const ejs = await catalogoConUso();
  return (
    <Tarjeta etiqueta="Pesos de referencia" className="flex flex-col gap-1">
      <Etiqueta>Pesos de referencia</Etiqueta>
      <p className="pb-1 text-[13px] text-ink2">
        Una guía para arrancar, no una regla. Después manda lo que hiciste: la app sugiere subir cuando completás el rango.
      </p>
      <table className="w-full text-[15px] tabular-nums">
        <thead>
          <tr className="text-left text-xs tracking-[.03em] text-ink2 uppercase">
            <th scope="col" className="pb-1.5 font-semibold">Ejercicio</th>
            <th scope="col" className="pb-1.5 text-right font-semibold">Guía</th>
            <th scope="col" className="pb-1.5 text-right font-semibold">Último</th>
          </tr>
        </thead>
        <tbody>
          {ejs.map((e) => {
            const sinCarga = e.tipoCarga === "corporal" || e.tipoCarga === "tiempo";
            return (
              <tr key={e.id} className="border-t-[0.5px] border-sep align-top">
                <td className="py-2 pr-2">
                  {e.nombre}
                  <span className="block text-[13px] text-ink2">
                    {e.equipo} · {e.repsMin}–{e.repsMax}
                    {e.tipoCarga === "tiempo" ? " s" : " reps"}
                  </span>
                </td>
                <td className="py-2 text-right whitespace-nowrap text-ink2">
                  {sinCarga ? (e.tipoCarga === "tiempo" ? "—" : "corporal") : e.kgGuia !== null ? `~${fmtCarga(e.kgGuia)} kg${unidad(e.tipoCarga)}` : "a elegir"}
                </td>
                <td className="py-2 text-right whitespace-nowrap">{!sinCarga && e.ultimoKg !== null ? `${fmtCarga(e.ultimoKg)} kg${unidad(e.tipoCarga)}` : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Tarjeta>
  );
}

async function Frecuentes() {
  const frecs = await frecuentesActivas();
  return (
    <Tarjeta etiqueta="Comidas frecuentes" className="flex flex-col gap-1">
      <Etiqueta className="pb-1">Comidas frecuentes</Etiqueta>
      <FrecuentesEditables frecuentes={frecs} />
    </Tarjeta>
  );
}

const Cargando = ({ alto }: { alto: string }) => <Tarjeta className={`animate-pulse ${alto}`}>{null}</Tarjeta>;

export default function DatosPage() {
  return (
    <>
      <Encabezado titulo="Datos" />
      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        <div className="flex flex-col gap-3 md:gap-4">
          <Suspense fallback={<Cargando alto="h-36" />}>
            <TarjetaGoogle />
          </Suspense>
          <Tarjeta etiqueta="Meta" className="flex flex-col gap-2">
            <Etiqueta>Meta y balanza</Etiqueta>
            <p className="text-[15px] text-ink2">La meta de peso, la proteína por kilo y los reportes de la balanza se cargan en Progreso.</p>
            <Link href="/progreso" className="flex h-11 items-center justify-center rounded-xl bg-fill text-[15px] font-semibold text-link">
              Ir a Progreso
            </Link>
          </Tarjeta>
          <Suspense fallback={<Cargando alto="h-40" />}>
            <Frecuentes />
          </Suspense>
          <Equipamiento />
        </div>
        <div className="flex flex-col gap-3 md:gap-4">
          <Suspense fallback={<Cargando alto="h-96" />}>
            <PesosGuia />
          </Suspense>
          {!esDemo && (
            <Tarjeta>
              <form action={cerrarSesion}>
                <button type="submit" className="min-h-11 text-[17px] text-warn">
                  Cerrar sesión
                </button>
              </form>
            </Tarjeta>
          )}
        </div>
      </div>
    </>
  );
}
