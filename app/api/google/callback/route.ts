import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { conexionGoogle } from "@/db/schema";
import { cifrar } from "@/lib/cifrado";
import { canjearCodigo, COOKIE_STATE } from "@/lib/google/api";
import { sincronizarGoogle } from "@/lib/google/sync";

/** Vuelta de Google: valida el state, guarda el refresh token cifrado y trae 14 días. */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const volver = (resultado: string) => {
    const res = NextResponse.redirect(new URL(`/datos?google=${resultado}`, url.origin));
    res.cookies.delete({ name: COOKIE_STATE, path: "/api/google" });
    return res;
  };

  const state = url.searchParams.get("state") ?? "";
  const esperado = req.cookies.get(COOKIE_STATE)?.value ?? "";
  const stateOk = state.length > 0 && state.length === esperado.length && timingSafeEqual(Buffer.from(state), Buffer.from(esperado));
  const code = url.searchParams.get("code");
  if (url.searchParams.get("error") || !stateOk || !code) return volver("cancelado");

  try {
    const { refreshToken, permisos } = await canjearCodigo(code, new URL("/api/google/callback", url.origin).toString());
    const fila = { id: 1, refreshTokenCifrado: cifrar(refreshToken), permisos, conectadoEn: new Date(), ultimaSync: null, ultimoError: null };
    await db().insert(conexionGoogle).values(fila).onConflictDoUpdate({ target: conexionGoogle.id, set: fila });
  } catch {
    return volver("error");
  }

  await sincronizarGoogle(14);
  return volver("conectado");
}
