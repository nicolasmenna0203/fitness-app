import type { Metadata } from "next";
import { EnConstruccion } from "@/components/EnConstruccion";

export const metadata: Metadata = { title: "Datos" };

export default function DatosPage() {
  return (
    <EnConstruccion
      titulo="Datos"
      contenido={[
        "Conexión con Google Health (pulsera Fitbit)",
        "Carga de reportes de la balanza por captura",
        "Equipamiento y cargas disponibles",
        "Meta y preferencias",
      ]}
    />
  );
}
