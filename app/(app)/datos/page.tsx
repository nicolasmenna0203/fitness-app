import type { Metadata } from "next";
import { EnConstruccion } from "@/components/EnConstruccion";
import { Tarjeta } from "@/components/ui";
import { cerrarSesion } from "@/app/login/acciones";

export const metadata: Metadata = { title: "Datos" };

export default function DatosPage() {
  return (
    <div className="flex flex-col gap-3">
      <EnConstruccion
        titulo="Datos"
        contenido={[
          "Conexión con Google Health (pulsera Fitbit)",
          "Carga de reportes de la balanza por captura",
          "Equipamiento y cargas disponibles",
          "Meta y preferencias",
        ]}
      />
      <Tarjeta className="max-w-xl">
        <form action={cerrarSesion}>
          <button type="submit" className="min-h-11 text-[17px] text-warn">
            Cerrar sesión
          </button>
        </form>
      </Tarjeta>
    </div>
  );
}
