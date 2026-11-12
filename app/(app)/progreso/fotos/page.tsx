import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BorrarFoto, SubirFoto } from "@/components/progreso/Fotos";
import { Miniatura } from "@/components/progreso/Miniatura";
import { Encabezado, Etiqueta, Tarjeta } from "@/components/ui";
import { esDemo } from "@/lib/demo";
import { listarFotos, paraComparar } from "@/lib/datos/fotos";
import { fechaLarga } from "@/lib/fecha";
import { NOMBRE_POSE } from "@/lib/poses";

export const metadata: Metadata = { title: "Fotos" };

async function Contenido() {
  const todas = await listarFotos();
  const pares = paraComparar(todas);
  const porFecha = new Map<string, typeof todas>();
  for (const f of [...todas].reverse()) porFecha.set(f.fecha, [...(porFecha.get(f.fecha) ?? []), f]);

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {pares.length > 0 && (
        <Tarjeta etiqueta="Antes y ahora" className="flex flex-col gap-4">
          <Etiqueta>Antes y ahora</Etiqueta>
          {pares.map((p) => (
            <div key={p.pose} className="flex flex-col gap-2">
              <p className="text-[15px] font-semibold">{NOMBRE_POSE[p.pose]}</p>
              <div className="grid grid-cols-2 gap-2 md:max-w-xl">
                <Miniatura foto={p.primera} />
                <Miniatura foto={p.ultima} />
              </div>
            </div>
          ))}
        </Tarjeta>
      )}
      {todas.length === 0 ? (
        <Tarjeta>
          <p className="text-[15px] text-ink2">Todavía no hay fotos. Con la misma luz y el mismo lugar cada vez, la comparación es más fiel.</p>
        </Tarjeta>
      ) : (
        [...porFecha.entries()].map(([fecha, lista]) => (
          <Tarjeta key={fecha} etiqueta={fechaLarga(fecha)} className="flex flex-col gap-2">
            <Etiqueta>{fechaLarga(fecha)}</Etiqueta>
            <div className="grid grid-cols-3 gap-2 md:max-w-2xl">
              {lista.map((f) => (
                <div key={f.id} className="flex flex-col">
                  <Miniatura foto={f} pie={false} />
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-ink2">{NOMBRE_POSE[f.pose]}</span>
                    <BorrarFoto id={f.id} />
                  </div>
                </div>
              ))}
            </div>
          </Tarjeta>
        ))
      )}
    </div>
  );
}

export default function FotosPage() {
  return (
    <>
      <Link href="/progreso" className="inline-block py-2 text-[17px] text-link">
        ‹ Progreso
      </Link>
      <Encabezado titulo="Fotos" />
      <div className="flex flex-col gap-3 md:gap-4">
        <Tarjeta etiqueta="Nueva foto" className="flex flex-col gap-2">
          <Etiqueta>Nueva foto</Etiqueta>
          <SubirFoto deshabilitado={esDemo} />
        </Tarjeta>
        <Suspense fallback={<Tarjeta className="h-64 animate-pulse">{null}</Tarjeta>}>
          <Contenido />
        </Suspense>
      </div>
    </>
  );
}
