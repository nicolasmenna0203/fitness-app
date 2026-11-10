import { describe, expect, it } from "vitest";
import { crearToken, SESION_MAX_AGE, verificarToken } from "./sesion";

const SECRETO = "secreto-de-prueba";

describe("sesión", () => {
  it("acepta un token recién creado", () => {
    expect(verificarToken(crearToken(SECRETO), SECRETO)).toBe(true);
  });

  it("rechaza un token firmado con otro secreto", () => {
    expect(verificarToken(crearToken("otro"), SECRETO)).toBe(false);
  });

  it("rechaza un token vencido", () => {
    const ahora = Date.now();
    const token = crearToken(SECRETO, ahora);
    expect(verificarToken(token, SECRETO, ahora + (SESION_MAX_AGE - 1) * 1000)).toBe(true);
    expect(verificarToken(token, SECRETO, ahora + (SESION_MAX_AGE + 1) * 1000)).toBe(false);
  });

  it("rechaza un payload modificado con la firma original", () => {
    const [, firma] = crearToken(SECRETO).split(".");
    const otroPayload = Buffer.from(JSON.stringify({ exp: 9999999999 })).toString("base64url");
    expect(verificarToken(`${otroPayload}.${firma}`, SECRETO)).toBe(false);
  });

  it("falla cerrado sin secreto o con tokens rotos", () => {
    const token = crearToken(SECRETO);
    expect(verificarToken(token, undefined)).toBe(false);
    expect(verificarToken(token, "")).toBe(false);
    expect(verificarToken(undefined, SECRETO)).toBe(false);
    for (const roto of ["", ".", "abc", "abc.", ".abc", "%%%.%%%", SECRETO]) {
      expect(verificarToken(roto, SECRETO)).toBe(false);
    }
  });
});
