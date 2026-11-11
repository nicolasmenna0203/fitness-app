import { describe, expect, it } from "vitest";
import { ajusteSemanal, excedenteDiario, extraPorDeporte, gastoInicial, metaInicial, metaProteina } from "./calorias";

describe("meta inicial", () => {
  it("excedente para el ritmo objetivo", () => {
    expect(excedenteDiario(0.3)).toBeCloseTo(330, 0);
    expect(excedenteDiario(-0.5)).toBeCloseTo(-550, 0);
  });

  it("gasto con basal medido y calorías activas de la pulsera", () => {
    expect(gastoInicial({ basalKcal: 1700, pesoKg: 70, kcalActivasPromedio: 460 })).toBeCloseTo(2400, 0);
  });

  it("sin basal ni pulsera usa estimaciones", () => {
    expect(gastoInicial({ basalKcal: null, pesoKg: 70, kcalActivasPromedio: null })).toBeCloseTo((1540 + 462) / 0.9, 0);
  });

  it("meta = gasto + excedente, redondeada a 10", () => {
    expect(metaInicial({ basalKcal: 1700, pesoKg: 70, kcalActivasPromedio: 460, ritmoObjetivo: 0.3 })).toEqual({ kcal: 2730, gasto: 2400 });
  });

  it("proteína por kg", () => {
    expect(metaProteina(70.4, 1.8)).toBe(127);
  });
});

describe("ajuste semanal", () => {
  const semana = (consumo: number, dias: number, cambio: number | null) => ({ consumoPorDia: Array(dias).fill(consumo), cambioTendenciaKg: cambio, dias: 7 });

  it("si subió menos de lo previsto, sube la meta (con tope)", () => {
    // Comió 2700 y la tendencia no se movió: el gasto real es 2700; quiere 2700 + 330.
    const a = ajusteSemanal(semana(2700, 7, 0), 2700, 0.3);
    expect(a.kcal).toBe(2850); // 3030 deseado, tope +150
    expect(a.motivo).toMatch(/menos de lo previsto: \+150/);
  });

  it("si subió lo previsto, la deja igual", () => {
    const a = ajusteSemanal(semana(2700, 6, 0.3), 2700, 0.3);
    expect(a.kcal).toBe(2700);
    expect(a.motivo).toMatch(/sigue igual/);
  });

  it("si subió de más, la baja", () => {
    // Gasto real 2700 − 0,45 × 7700 / 7 = 2205; deseado 2535; el tope lo deja en −150.
    const a = ajusteSemanal(semana(2700, 7, 0.45), 2700, 0.3);
    expect(a.kcal).toBe(2550);
    expect(a.motivo).toMatch(/más de lo previsto: -150/);
  });

  it("no ajusta con pocos días registrados o sin pesajes", () => {
    expect(ajusteSemanal(semana(2700, 4, 0.2), 2700, 0.3).kcal).toBeNull();
    expect(ajusteSemanal(semana(2700, 7, null), 2700, 0.3).kcal).toBeNull();
  });
});

describe("días de deporte", () => {
  it("suma deportes largos, no caminatas ni sesiones cortas", () => {
    expect(
      extraPorDeporte([
        { tipo: "SOCCER", minutos: 75, kcal: 612 },
        { tipo: "WALKING", minutos: 60, kcal: 200 },
        { tipo: "RUNNING", minutos: 20, kcal: 220 },
      ]),
    ).toBe(610);
  });
});
