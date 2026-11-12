import { BarraLateral, BarraPestanas } from "@/components/nav/Navegacion";
import { esDemo } from "@/lib/demo";

// Estructura común de las secciones: barra lateral en escritorio, pestañas en el celular.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh">
      <BarraLateral />
      <main className="min-w-0 flex-1 px-4 pt-[max(env(safe-area-inset-top),24px)] pb-28 md:px-10 md:pt-8 md:pb-10">
        <div className="mx-auto max-w-6xl">
          {esDemo && (
            <p className="mb-4 rounded-[14px] bg-hl px-4 py-2.5 text-[13px] leading-[18px]">
              <span className="font-semibold">Demo con datos inventados.</span> Podés registrar series y comidas: todo vuelve a cero cada día.
            </p>
          )}
          {children}
        </div>
      </main>
      <BarraPestanas />
    </div>
  );
}
