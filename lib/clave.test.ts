import { describe, expect, it } from "vitest";
import { hashClave, verificarClave } from "./clave";

// scrypt es lento a propósito: con la máquina cargada puede pasar los 5 s por defecto.
describe("clave", { timeout: 30_000 }, () => {
  const hash = hashClave("una frase larga de prueba");

  it("verifica la contraseña correcta", () => {
    expect(verificarClave("una frase larga de prueba", hash)).toBe(true);
  });

  it("rechaza una contraseña distinta", () => {
    expect(verificarClave("una frase larga de prueba ", hash)).toBe(false);
    expect(verificarClave("", hash)).toBe(false);
  });

  it("usa sal aleatoria: el mismo texto da hashes distintos", () => {
    expect(hashClave("igual")).not.toBe(hashClave("igual"));
  });

  it("nunca da acceso con un hash ausente o mal formado", () => {
    for (const malo of [undefined, "", "scrypt", "scrypt..", "bcrypt.a.b", "scrypt.abc.corto", hash.replace("scrypt", "md5"), hash + ".x"]) {
      expect(verificarClave("una frase larga de prueba", malo)).toBe(false);
    }
  });

  it("es compatible con el formato que genera scripts/crear-clave.mjs", async () => {
    const { randomBytes, scryptSync } = await import("node:crypto");
    const sal = randomBytes(16);
    const h = scryptSync("desde el script", sal, 32, { N: 16384, r: 8, p: 1 });
    const generado = `scrypt.${sal.toString("base64url")}.${h.toString("base64url")}`;
    expect(verificarClave("desde el script", generado)).toBe(true);
  });

  it("sobrevive a la carga de .env de Next, que expande $NOMBRE", async () => {
    const { mkdtempSync, writeFileSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const { loadEnvConfig } = await import("@next/env");
    const dir = mkdtempSync(join(tmpdir(), "clave-env-"));
    // `.env` y no `.env.local`: con NODE_ENV=test, Next no lee `.env.local`.
    writeFileSync(join(dir, ".env"), `HASH_DE_PRUEBA=${hash}\n`);
    const { combinedEnv } = loadEnvConfig(dir, false, { info() {}, error() {} }, true);
    expect(combinedEnv.HASH_DE_PRUEBA).toBe(hash);
    expect(verificarClave("una frase larga de prueba", combinedEnv.HASH_DE_PRUEBA)).toBe(true);
  });
});
