import { NextResponse, type NextRequest } from "next/server";
import { esDemo } from "@/lib/demo";
import { SESION_COOKIE, verificarToken } from "@/lib/sesion";

/**
 * Toda la app requiere sesión (ADR 0008), salvo el login y lo que el iPhone
 * necesita para instalarla (manifiesto e íconos), que se excluyen en el matcher.
 * Sin SESSION_SECRET configurado no entra nadie: falla cerrado.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Demo pública (DEMO=1): sin login ni conexión con Google; todo lo demás, abierto.
  if (esDemo) {
    if (pathname === "/login") return NextResponse.redirect(new URL("/", req.url));
    if (pathname.startsWith("/api/google/")) return new NextResponse("No disponible en la demo", { status: 404 });
    return NextResponse.next();
  }
  if (pathname === "/login") return NextResponse.next();
  // El cron de Vercel no tiene cookie: la ruta se autentica sola con CRON_SECRET.
  if (pathname.startsWith("/api/cron/")) return NextResponse.next();

  if (verificarToken(req.cookies.get(SESION_COOKIE)?.value, process.env.SESSION_SECRET)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|manifest.webmanifest).*)"],
};
