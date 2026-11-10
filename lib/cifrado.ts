/**
 * Cifrado simétrico para secretos guardados en la base (el refresh token de
 * Google). AES-256-GCM con la clave TOKEN_KEY (32 bytes en base64url).
 * Formato: `v1.<iv>.<tag>.<texto cifrado>`, todo en base64url.
 *
 * Si se filtra la base sin la variable de entorno, el token no sirve.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function clave(claveB64 = process.env.TOKEN_KEY): Buffer {
  if (!claveB64) throw new Error("Falta TOKEN_KEY");
  const k = Buffer.from(claveB64, "base64url");
  if (k.length !== 32) throw new Error("TOKEN_KEY tiene que tener 32 bytes en base64url");
  return k;
}

export function cifrar(texto: string, claveB64?: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", clave(claveB64), iv);
  const cifrado = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return ["v1", iv, c.getAuthTag(), cifrado].map((p) => (typeof p === "string" ? p : p.toString("base64url"))).join(".");
}

/** Tira si el texto fue alterado o la clave no corresponde (GCM lo detecta). */
export function descifrar(paquete: string, claveB64?: string): string {
  const [version, iv, tag, cifrado] = paquete.split(".");
  if (version !== "v1" || !iv || !tag || cifrado === undefined) throw new Error("Formato cifrado desconocido");
  const d = createDecipheriv("aes-256-gcm", clave(claveB64), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(cifrado, "base64url")), d.final()]).toString("utf8");
}
