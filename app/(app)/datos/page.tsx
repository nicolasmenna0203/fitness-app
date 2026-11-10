import type { Metadata } from "next";
import { Suspense } from "react";
import { cerrarSesion } from "@/app/login/acciones";
import { TarjetaGoogle } from "@/components/datos/TarjetaGoogle";
import { Encabezado, Etiqueta, Tarjeta } from "@/components/ui";

export const metadata: Metadata = { title: "Datos" };

export default function DatosPage() {
  return (
    <>
      <Encabezado titulo="Datos" />
      <div className="flex flex-col gap-3">
        <Suspense
          fallback={
            <Tarjeta className="max-w-xl animate-pulse">
              <Etiqueta>Pulsera · Google Health</Etiqueta>
              <p className="mt-3 h-5 w-48 rounded bg-fill" />
            </Tarjeta>
          }
        >
          <TarjetaGoogle />
        </Suspense>

        <Tarjeta className="flex max-w-xl flex-col gap-2">
          <Etiqueta>Próximamente</Etiqueta>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-[15px] text-ink2">
            <li>Carga de reportes de la balanza por captura</li>
            <li>Equipamiento y cargas disponibles</li>
            <li>Meta y preferencias</li>
          </ul>
        </Tarjeta>

        <Tarjeta className="max-w-xl">
          <form action={cerrarSesion}>
            <button type="submit" className="min-h-11 text-[17px] text-warn">
              Cerrar sesión
            </button>
          </form>
        </Tarjeta>
      </div>
    </>
  );
}
