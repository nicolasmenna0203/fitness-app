import type { Metadata } from "next";
import { EnConstruccion } from "@/components/EnConstruccion";

export const metadata: Metadata = { title: "Comer" };

export default function ComerPage() {
  return (
    <EnConstruccion
      titulo="Comer"
      contenido={[
        "Metas de calorías y proteína que se ajustan cada semana",
        "Comidas frecuentes en un toque",
        "Carga libre para lo que no está guardado",
      ]}
    />
  );
}
