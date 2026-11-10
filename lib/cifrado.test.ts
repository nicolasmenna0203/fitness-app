import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { cifrar, descifrar } from "./cifrado";

const CLAVE = randomBytes(32).toString("base64url");

describe("cifrado", () => {
  it("ida y vuelta", () => {
    const token = "1//0refresh-token-de-prueba";
    expect(descifrar(cifrar(token, CLAVE), CLAVE)).toBe(token);
  });

  it("no deja el texto en claro y usa IV aleatorio", () => {
    const a = cifrar("secreto", CLAVE);
    expect(a).not.toContain("secreto");
    expect(a).not.toBe(cifrar("secreto", CLAVE));
  });

  it("detecta alteraciones y claves equivocadas", () => {
    const paquete = cifrar("secreto", CLAVE);
    const [v, iv, tag, datos] = paquete.split(".");
    const alterado = [v, iv, tag, Buffer.from("otra cosa").toString("base64url")].join(".");
    expect(() => descifrar(alterado, CLAVE)).toThrow();
    expect(() => descifrar(paquete, randomBytes(32).toString("base64url"))).toThrow();
    expect(() => descifrar(`${v}.${iv}.${datos}`, CLAVE)).toThrow();
  });

  it("exige una clave de 32 bytes", () => {
    expect(() => cifrar("x", randomBytes(16).toString("base64url"))).toThrow(/32 bytes/);
    expect(() => cifrar("x", "")).toThrow();
  });
});
