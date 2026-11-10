import { describe, expect, it } from "vitest";
import { hashClave, verificarClave } from "./clave";

describe("clave", () => {
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
    for (const malo of [undefined, "", "scrypt", "scrypt$$", "bcrypt$a$b", "scrypt$abc$corto", hash.replace("scrypt", "md5")]) {
      expect(verificarClave("una frase larga de prueba", malo)).toBe(false);
    }
  });

  it("es compatible con el formato que genera scripts/crear-clave.mjs", async () => {
    const { randomBytes, scryptSync } = await import("node:crypto");
    const sal = randomBytes(16);
    const h = scryptSync("desde el script", sal, 32, { N: 16384, r: 8, p: 1 });
    const generado = `scrypt$${sal.toString("base64url")}$${h.toString("base64url")}`;
    expect(verificarClave("desde el script", generado)).toBe(true);
  });
});
