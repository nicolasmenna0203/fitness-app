import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// En Apple se usa la fuente del sistema (SF Pro); Inter es el respaldo en el resto.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Fitness", template: "%s · Fitness" },
  description: "Entrenos, nutrición y progreso corporal para un gimnasio en casa.",
  applicationName: "Fitness",
  appleWebApp: { capable: true, title: "Fitness", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
