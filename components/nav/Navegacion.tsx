"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { esActiva, SECCIONES } from "./secciones";

/** Barra lateral en pantallas anchas (patrón de macOS/iPadOS). */
export function BarraLateral() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Secciones"
      className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 bg-side px-3 py-6 md:flex"
    >
      <div className="flex items-center gap-2.5 px-2.5 pb-4">
        <span className="flex size-[30px] items-center justify-center rounded-lg bg-accent text-on-accent">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
            <circle cx="12" cy="12" r="7.5" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </span>
        <span className="text-[17px] font-bold tracking-tight">Fitness</span>
      </div>
      {SECCIONES.map(({ href, nombre, Icono }) => {
        const activa = esActiva(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={activa ? "page" : undefined}
            className={`flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-[15px] ${
              activa ? "bg-sel font-semibold" : "hover:bg-sel/60"
            }`}
          >
            <Icono size={20} className={activa ? "text-accent" : "text-ink2"} />
            {nombre}
          </Link>
        );
      })}
    </nav>
  );
}

/** Barra de pestañas abajo en el celular (patrón de iOS). */
export function BarraPestanas() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-10 flex border-t-[0.5px] border-sep bg-bar px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),8px)] backdrop-blur-xl md:hidden"
    >
      {SECCIONES.map(({ href, nombre, Icono }) => {
        const activa = esActiva(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={activa ? "page" : undefined}
            className={`flex min-h-11 flex-1 flex-col items-center gap-0.5 text-[10px] ${
              activa ? "font-semibold text-ink" : "font-medium text-ink2"
            }`}
          >
            <Icono size={26} className={activa ? "text-accent" : undefined} />
            {nombre}
          </Link>
        );
      })}
    </nav>
  );
}
