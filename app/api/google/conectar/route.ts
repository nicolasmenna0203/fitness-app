import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_STATE, urlAutorizacion } from "@/lib/google/api";

/** Inicia la autorización con Google. El `state` va en una cookie para verificarlo en el callback. */
export function GET(req: NextRequest) {
  const state = randomBytes(24).toString("base64url");
  const redirectUri = new URL("/api/google/callback", req.nextUrl.origin).toString();
  const res = NextResponse.redirect(urlAutorizacion(redirectUri, state));
  res.cookies.set(COOKIE_STATE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/google",
    maxAge: 600,
  });
  return res;
}
