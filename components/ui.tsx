import type { ReactNode } from "react";

export function Tarjeta({
  children,
  className = "",
  etiqueta,
}: {
  children: ReactNode;
  className?: string;
  /** Nombre accesible de la sección. */
  etiqueta?: string;
}) {
  return (
    <section aria-label={etiqueta} className={`rounded-[20px] bg-card p-4 md:p-5 ${className}`}>
      {children}
    </section>
  );
}

/** Etiqueta en mayúsculas de las tarjetas ("PRÓXIMO ENTRENO"). */
export function Etiqueta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[13px] font-semibold tracking-[.02em] text-ink2 uppercase ${className}`}>{children}</p>
  );
}

export function Encabezado({ fecha, titulo, accion }: { fecha?: string; titulo: string; accion?: ReactNode }) {
  return (
    <header className="mb-3 flex flex-wrap items-end justify-between gap-4 px-1 md:mb-5 md:px-0">
      <div>
        {fecha && <Etiqueta>{fecha}</Etiqueta>}
        <h1 className="text-[34px] leading-[41px] font-bold tracking-tight">{titulo}</h1>
      </div>
      {accion}
    </header>
  );
}

/** Marca de color + texto: la identidad nunca va solo en el color. */
export function Marca({ color }: { color: string }) {
  return <span aria-hidden className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: color }} />;
}
