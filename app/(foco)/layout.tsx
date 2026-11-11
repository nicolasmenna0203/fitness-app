/**
 * Pantallas de foco (el entreno en curso): sin barra de pestañas ni lateral,
 * para que en el gimnasio se vea solo lo que importa.
 */
export default function FocoLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto min-h-dvh max-w-xl px-4 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),24px)]">
      {children}
    </main>
  );
}
