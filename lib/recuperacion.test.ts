import { describe, expect, it } from "vitest";
import { estadoRecuperacion } from "./recuperacion";

describe("recuperación", () => {
  it("sin datos no inventa un estado", () => {
    expect(estadoRecuperacion(null, null, null)).toBeNull();
    expect(estadoRecuperacion(null, 60, null)).toBeNull();
  });

  it("buen sueño y FC en su promedio → buena", () => {
    expect(estadoRecuperacion(450, 60, 60)).toBe("buena");
  });

  it("poco sueño y FC alta → baja", () => {
    expect(estadoRecuperacion(330, 66, 61)).toBe("baja");
  });

  it("señales mixtas → media", () => {
    expect(estadoRecuperacion(450, 66, 61)).toBe("media");
    expect(estadoRecuperacion(385, 62, 60)).toBe("media");
  });

  it("funciona con una sola señal", () => {
    expect(estadoRecuperacion(480, null, null)).toBe("buena");
    expect(estadoRecuperacion(null, 59, 60)).toBe("buena");
  });
});
