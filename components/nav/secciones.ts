import type { ComponentType } from "react";
import { IconComer, IconDatos, IconEntrenar, IconHoy, IconProgreso } from "@/components/icons";

export type Seccion = {
  href: "/" | "/entrenar" | "/comer" | "/progreso" | "/datos";
  nombre: string;
  Icono: ComponentType<{ size?: number; className?: string }>;
};

// Las cinco secciones de docs/producto/secciones.md, en el orden de la barra.
export const SECCIONES: Seccion[] = [
  { href: "/", nombre: "Hoy", Icono: IconHoy },
  { href: "/entrenar", nombre: "Entrenar", Icono: IconEntrenar },
  { href: "/comer", nombre: "Comer", Icono: IconComer },
  { href: "/progreso", nombre: "Progreso", Icono: IconProgreso },
  { href: "/datos", nombre: "Datos", Icono: IconDatos },
];

export function esActiva(href: Seccion["href"], pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}
