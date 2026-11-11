import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Sesion } from "@/components/entrenar/Sesion";
import { sesionEntreno } from "@/lib/datos/entrenos";

export const metadata: Metadata = { title: "Entreno en curso" };

async function Contenido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) notFound();
  const sesion = await sesionEntreno(n);
  if (!sesion) notFound();
  if (sesion.estado !== "en_curso") redirect("/entrenar");
  return <Sesion datos={sesion} />;
}

export default function EntrenoPage({ params }: PageProps<"/entrenar/[id]">) {
  return (
    <Suspense fallback={<p className="pt-10 text-center text-[15px] text-ink2">Cargando entreno…</p>}>
      <Contenido params={params} />
    </Suspense>
  );
}
