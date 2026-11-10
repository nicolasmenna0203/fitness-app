import type { Metadata } from "next";
import { EnConstruccion } from "@/components/EnConstruccion";

export const metadata: Metadata = { title: "Entrenar" };

export default function EntrenarPage() {
  return (
    <EnConstruccion
      titulo="Entrenar"
      contenido={[
        "Entreno sugerido según la rotación y los últimos días",
        "Registro de series con el valor sugerido precargado",
        "Temporizador de descanso",
        "Partidos y cardio",
      ]}
    />
  );
}
