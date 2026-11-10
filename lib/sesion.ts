/**
 * Sesión de un solo usuario: cookie `<payload>.<firma>` con HMAC-SHA256.
 * Decisión y alternativas descartadas: docs/decisiones/0008-login-de-un-solo-usuario.md
 *
 * El secreto nunca viaja al cliente: filtrar la cookie compromete solo esa
 * sesión hasta que vence, y rotar SESSION_SECRET invalida todas.
 *
 * Usa node:crypto: en Next 16 el proxy corre en Node, no en Edge.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESION_COOKIE = "sesion";
/** 180 días: es una app instalada de un solo usuario; volver a entrar seguido no suma seguridad real. */
export const SESION_MAX_AGE = 60 * 60 * 24 * 180;

type Payload = { exp: number };

function firmar(datos: string, secreto: string): string {
  return createHmac("sha256", secreto).update(datos).digest("base64url");
}

/** Crea un token válido por SESION_MAX_AGE segundos desde `ahora` (ms). */
export function crearToken(secreto: string, ahora = Date.now()): string {
  const payload: Payload = { exp: Math.floor(ahora / 1000) + SESION_MAX_AGE };
  const datos = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${datos}.${firmar(datos, secreto)}`;
}

/** true si la firma es válida y el token no venció. Nunca tira: un token roto es inválido. */
export function verificarToken(token: string | undefined, secreto: string | undefined, ahora = Date.now()): boolean {
  if (!token || !secreto) return false;
  const i = token.lastIndexOf(".");
  if (i <= 0) return false;
  const datos = token.slice(0, i);
  const firma = Buffer.from(token.slice(i + 1), "base64url");
  const esperada = Buffer.from(firmar(datos, secreto), "base64url");
  if (firma.length !== esperada.length || !timingSafeEqual(firma, esperada)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(datos, "base64url").toString()) as Payload;
    return typeof exp === "number" && exp > Math.floor(ahora / 1000);
  } catch {
    return false;
  }
}
