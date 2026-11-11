import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { LectorReporte } from "@/components/progreso/LectorReporte";
import { Encabezado } from "@/components/ui";
import { fechaLocal } from "@/lib/fecha";

export const metadata: Metadata = { title: "Reporte de balanza" };

async function Lector() {
  await connection(); // la fecha de hoy, en la zona del usuario
  return <LectorReporte hoy={fechaLocal()} />;
}

export default function BalanzaPage() {
  return (
    <>
      <Encabezado titulo="Reporte de balanza" />
      <Suspense>
        <Lector />
      </Suspense>
    </>
  );
}
