import { NextResponse, type NextRequest } from "next/server";
import { SESION_COOKIE, verificarToken } from "@/lib/sesion";

/**
 * Toda la app requiere sesión (ADR 0008), salvo el login y lo que el iPhone
 * necesita para instalarla (manifiesto e íconos), que se excluyen en el matcher.
 * Sin SESSION_SECRET configurado no entra nadie: falla cerrado.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/login") return NextResponse.next();

  if (verificarToken(req.cookies.get(SESION_COOKIE)?.value, process.env.SESSION_SECRET)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|manifest.webmanifest).*)"],
};
