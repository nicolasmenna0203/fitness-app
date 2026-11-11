import { describe, expect, it } from "vitest";
import { kcalEstimadas, nombreActividad, sinDuplicados } from "./actividades";

const act = (origen: "google" | "manual", fecha: string, tipo: string, minutos: number) => ({ origen, fecha, tipo, minutos });

describe("actividades", () => {
  it("estima las calorías activas restando el reposo", () => {
    // (7 − 1) × 70 kg × 1 h = 420
    expect(kcalEstimadas(7, 70, 60)).toBe(420);
    expect(kcalEstimadas(6, 65, 90)).toBe(490);
  });

  it("una carga manual se ignora si ese día la pulsera registró un deporte", () => {
    const acts = [act("google", "2026-11-08", "SOCCER", 70), act("manual", "2026-11-08", "SOCCER", 60), act("manual", "2026-11-09", "PADEL", 60)];
    expect(sinDuplicados(acts).map((a) => `${a.origen}:${a.fecha}`)).toEqual(["google:2026-11-08", "manual:2026-11-09"]);
  });

  it("una caminata de la pulsera no tapa el partido cargado a mano", () => {
    const acts = [act("google", "2026-11-08", "WALKING", 40), act("manual", "2026-11-08", "SOCCER", 60)];
    expect(sinDuplicados(acts)).toHaveLength(2);
  });

  it("nombres legibles", () => {
    expect(nombreActividad("SOCCER", null)).toBe("Fútbol");
    expect(nombreActividad("WALKING", "Caminar")).toBe("Caminar");
    expect(nombreActividad("HIGH_INTENSITY_INTERVAL_TRAINING", null)).toBe("High intensity interval training");
  });
});
