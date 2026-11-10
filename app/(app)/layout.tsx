import { BarraLateral, BarraPestanas } from "@/components/nav/Navegacion";

// Estructura común de las secciones: barra lateral en escritorio, pestañas en el celular.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh">
      <BarraLateral />
      <main className="min-w-0 flex-1 px-4 pt-[max(env(safe-area-inset-top),24px)] pb-28 md:px-10 md:pt-8 md:pb-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <BarraPestanas />
    </div>
  );
}
