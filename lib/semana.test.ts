import { describe, expect, it } from "vitest";
import { conTendencia } from "./peso";
import { resumirSemana, type EntradaSemana } from "./semana";

const base: EntradaSemana = {
  hoy: "2026-11-16",
  tendencia: [],
  entrenos: 2,
  metaEntrenos: 3,
  deportes: [],
  comidas: [],
  metaProteinaG: 100,
  suenoMin: [],
  ajuste: null,
  ultimaFoto: null,
};

describe("revisión semanal", () => {
  it("toma los 7 días completos anteriores a hoy", () => {
    const r = resumirSemana(base);
    expect(r).toMatchObject({ desde: "2026-11-09", hasta: "2026-11-15" });
  });

  it("cambio de peso por la tendencia, solo con al menos 2 pesajes en la semana", () => {
    const tendencia = conTendencia([
      { fecha: "2026-11-07", kg: 60 },
      { fecha: "2026-11-08", kg: 60 },
      { fecha: "2026-11-10", kg: 61 },
      { fecha: "2026-11-14", kg: 61 },
    ]);
    expect(resumirSemana({ ...base, tendencia }).cambioPesoKg).toBeGreaterThan(0);
    expect(resumirSemana({ ...base, tendencia: tendencia.slice(0, 3) }).cambioPesoKg).toBeNull();
  });

  it("promedia solo los días con comidas y cuenta los que cumplen la proteína", () => {
    const comidas = [
      { fecha: "2026-11-08", kcal: 9999, proteinaG: 0 }, // fuera de la semana
      { fecha: "2026-11-09", kcal: 2400, proteinaG: 95 },
      { fecha: "2026-11-10", kcal: 2600, proteinaG: 80 },
    ];
    expect(resumirSemana({ ...base, comidas }).comidas).toEqual({ dias: 2, kcalPromedio: 2500, proteinaPromedio: 88, diasProteinaOk: 1 });
  });

  it("muestra el ajuste solo si es de hoy o de ayer", () => {
    const ajuste = { desde: "2026-11-15", kcal: 2650, previa: 2550, motivo: "x" };
    expect(resumirSemana({ ...base, ajuste }).ajuste).toEqual({ kcal: 2650, delta: 100, motivo: "x" });
    expect(resumirSemana({ ...base, ajuste: { ...ajuste, desde: "2026-11-13" } }).ajuste).toBeNull();
  });

  it("sugiere una foto cada 3 semanas", () => {
    expect(resumirSemana(base).fotoSugerida).toBe(true);
    expect(resumirSemana({ ...base, ultimaFoto: "2026-11-01" }).fotoSugerida).toBe(false);
    expect(resumirSemana({ ...base, ultimaFoto: "2026-10-26" }).fotoSugerida).toBe(true);
  });
});
