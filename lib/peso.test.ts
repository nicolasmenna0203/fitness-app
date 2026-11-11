import { describe, expect, it } from "vitest";
import { avance, conTendencia, fechaEstimada, ritmoObjetivo, ritmoSemanal, type Pesaje } from "./peso";
import { sumarDias } from "./fecha";

// Serie sintética: sube 0,3 kg por semana desde 60 kg con ruido de ±0,4 kg.
const serie = (dias: number, inicio = "2026-01-01"): Pesaje[] =>
  Array.from({ length: dias }, (_, i) => ({
    fecha: sumarDias(inicio, i),
    kg: 60 + (0.3 / 7) * i + 0.4 * Math.sin(i * 1.9),
  }));

describe("tendencia", () => {
  it("el primer valor es el primer pesaje", () => {
    expect(conTendencia([{ fecha: "2026-01-01", kg: 60 }])[0].tendencia).toBe(60);
  });

  it("suaviza el ruido: varía mucho menos que los pesajes", () => {
    const t = conTendencia(serie(40)).slice(20);
    const rango = (xs: number[]) => Math.max(...xs) - Math.min(...xs);
    expect(rango(t.map((p) => p.tendencia))).toBeLessThan(rango(t.map((p) => p.kg)));
  });

  it("un hueco de días pesa más que un día seguido", () => {
    const seguido = conTendencia([{ fecha: "2026-01-01", kg: 60 }, { fecha: "2026-01-02", kg: 61 }])[1].tendencia;
    const conHueco = conTendencia([{ fecha: "2026-01-01", kg: 60 }, { fecha: "2026-01-08", kg: 61 }])[1].tendencia;
    expect(seguido).toBeCloseTo(60.1, 5);
    expect(conHueco).toBeGreaterThan(seguido);
  });

  it("ordena por fecha aunque lleguen desordenados", () => {
    const t = conTendencia([{ fecha: "2026-01-03", kg: 62 }, { fecha: "2026-01-01", kg: 60 }]);
    expect(t.map((p) => p.fecha)).toEqual(["2026-01-01", "2026-01-03"]);
  });
});

describe("ritmo", () => {
  it("sin dos semanas de datos no estima", () => {
    expect(ritmoSemanal(conTendencia(serie(10)))).toBeNull();
  });

  it("recupera el ritmo real aproximado", () => {
    expect(ritmoSemanal(conTendencia(serie(60)))!).toBeCloseTo(0.3, 1);
  });

  it("ritmo objetivo: lo que falta por semana, con tope de 0,5 % del peso", () => {
    expect(ritmoObjetivo(66, 70, "2026-01-01", sumarDias("2026-01-01", 140))).toBeCloseTo(0.2, 5);
    expect(ritmoObjetivo(66, 70, "2026-01-01", "2026-01-15")).toBeCloseTo(0.33, 5);
  });

  it("fecha estimada al ritmo actual", () => {
    expect(fechaEstimada(66, 70, 0.5, "2026-01-01")).toBe("2026-02-26");
    expect(fechaEstimada(66, 70, -0.2, "2026-01-01")).toBeNull();
    expect(fechaEstimada(66, 70, null, "2026-01-01")).toBeNull();
  });

  it("avance entre el inicio y la meta", () => {
    expect(avance(66, 67, 70)).toBe(0.25);
    expect(avance(66, 65, 70)).toBe(0);
    expect(avance(66, 71, 70)).toBe(1);
  });
});
