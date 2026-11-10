import type { Metadata } from "next";
import { EnConstruccion } from "@/components/EnConstruccion";

export const metadata: Metadata = { title: "Progreso" };

export default function ProgresoPage() {
  return (
    <EnConstruccion
      titulo="Progreso"
      contenido={[
        "Peso diario con su tendencia y el ritmo semanal",
        "Evolución de la composición corporal",
        "Fotos de progreso",
        "Marcas personales por ejercicio",
      ]}
    />
  );
}
