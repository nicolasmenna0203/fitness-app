/**
 * Hash de la contraseña con scrypt. En las variables de entorno se guarda el
 * hash, nunca la contraseña: si se filtran, no revelan la clave.
 * Formato: `scrypt$<sal base64url>$<hash base64url>`.
 * Decisión: docs/decisiones/0008-login-de-un-solo-usuario.md
 */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const LARGO = 32;
// Parámetros por defecto de Node (N=16384, r=8, p=1): ~50 ms por intento.
const OPCIONES = { N: 16384, r: 8, p: 1 };

export function hashClave(clave: string): string {
  const sal = randomBytes(16);
  const hash = scryptSync(clave, sal, LARGO, OPCIONES);
  return `scrypt$${sal.toString("base64url")}$${hash.toString("base64url")}`;
}

/** Compara en tiempo constante. Un hash mal formado nunca da acceso. */
export function verificarClave(clave: string, guardado: string | undefined): boolean {
  if (!guardado) return false;
  const [algoritmo, salB64, hashB64] = guardado.split("$");
  if (algoritmo !== "scrypt" || !salB64 || !hashB64) return false;
  const esperado = Buffer.from(hashB64, "base64url");
  if (esperado.length !== LARGO) return false;
  const calculado = scryptSync(clave, Buffer.from(salB64, "base64url"), LARGO, OPCIONES);
  return timingSafeEqual(calculado, esperado);
}
