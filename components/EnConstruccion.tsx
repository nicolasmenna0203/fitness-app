import Link from "next/link";
import { Encabezado, Tarjeta } from "@/components/ui";

/** Sección todavía sin implementar: muestra qué va a tener, según docs/producto/secciones.md. */
export function EnConstruccion({ titulo, contenido }: { titulo: string; contenido: string[] }) {
  return (
    <>
      <Encabezado titulo={titulo} />
      <Tarjeta className="flex max-w-xl flex-col gap-3">
        <p className="text-[17px] font-semibold">En construcción</p>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-[15px] text-ink2">
          {contenido.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <Link href="/" className="text-[15px] font-semibold text-link">
          Volver a Hoy
        </Link>
      </Tarjeta>
    </>
  );
}
