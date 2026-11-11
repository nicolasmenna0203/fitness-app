import { describe, expect, it } from "vitest";
import { motivoLiviana, seriesDeHoy, siguientePlantilla, sugerir, type ConfigEjercicio } from "./progresion";

const pila: ConfigEjercicio = { tipoCarga: "pila", repsMin: 8, repsMax: 12, incrementoKg: 5, cargaMaxKg: 45 };
const mancuerna: ConfigEjercicio = { tipoCarga: "mancuerna", repsMin: 8, repsMax: 12, incrementoKg: 2, cargaMaxKg: null };
const corporal: ConfigEjercicio = { tipoCarga: "corporal", repsMin: 4, repsMax: 8, incrementoKg: null, cargaMaxKg: null };
const tiempo: ConfigEjercicio = { tipoCarga: "tiempo", repsMin: 30, repsMax: 60, incrementoKg: null, cargaMaxKg: null };

const sets = (kg: number | null, ...reps: number[]) => reps.map((r, i) => ({ numero: i + 1, kg, reps: r }));

describe("progresión doble", () => {
  it("primera vez: sin peso sugerido y al piso del rango", () => {
    const s = sugerir(mancuerna, [], 3);
    expect(s).toMatchObject({ kg: null, repsPorSerie: [8, 8, 8], motivo: "primera" });
    expect(s.mensaje).toMatch(/elegí un peso/);
  });

  it("si no completó el rango, mantiene el peso y apunta a una repetición más por serie", () => {
    const s = sugerir(mancuerna, sets(14, 12, 10, 9), 3);
    expect(s).toMatchObject({ kg: 14, repsPorSerie: [12, 11, 10], motivo: "mantener", mensaje: null });
  });

  it("si completó el tope en todas, sube un salto y vuelve al piso", () => {
    const s = sugerir(mancuerna, sets(14, 12, 12, 12), 3);
    expect(s).toMatchObject({ kg: 16, repsPorSerie: [8, 8, 8], motivo: "subir" });
    expect(s.mensaje).toBe("Subí a 16 kg: la última vez completaste 3 × 12 con 14 kg.");
  });

  it("no pasa el tope de la pila: sube hasta el tope", () => {
    expect(sugerir(pila, sets(42.5, 12, 12, 12), 3)).toMatchObject({ kg: 45, motivo: "subir" });
  });

  it("en el tope de la pila sugiere una variante, no más peso", () => {
    const s = sugerir(pila, sets(45, 12, 12, 12), 3);
    expect(s).toMatchObject({ kg: 45, repsPorSerie: [12, 12, 12], motivo: "tope" });
    expect(s.mensaje).toMatch(/tope del equipo/);
  });

  it("la versión liviana de la vez pasada también cuenta si llegó al tope", () => {
    expect(sugerir(mancuerna, sets(14, 12, 12), 3)).toMatchObject({ kg: 16, motivo: "subir" });
  });

  it("hoy con más series que la vez pasada: repite el objetivo de la última serie", () => {
    expect(sugerir(mancuerna, sets(14, 10, 9), 3).repsPorSerie).toEqual([11, 10, 10]);
  });

  it("peso corporal progresa por repeticiones y al tope sugiere lastre", () => {
    expect(sugerir(corporal, sets(null, 6, 5, 4), 3)).toMatchObject({ kg: null, repsPorSerie: [7, 6, 5], motivo: "mantener" });
    expect(sugerir(corporal, sets(null, 8, 8, 8), 3).mensaje).toMatch(/lastre/);
  });

  it("por tiempo suma 5 s sin pasar el máximo", () => {
    expect(sugerir(tiempo, sets(null, 45, 58, 30), 3).repsPorSerie).toEqual([50, 60, 35]);
    expect(sugerir(tiempo, sets(null, 60, 60, 60), 3).motivo).toBe("tope");
  });
});

describe("rotación y versión liviana", () => {
  const plantillas = [
    { id: 7, orden: 2 },
    { id: 3, orden: 1 },
  ];

  it("sin historial arranca por la primera", () => {
    expect(siguientePlantilla(plantillas, null)?.id).toBe(3);
  });

  it("alterna en orden y vuelve al principio", () => {
    expect(siguientePlantilla(plantillas, 3)?.id).toBe(7);
    expect(siguientePlantilla(plantillas, 7)?.id).toBe(3);
  });

  it("si la última plantilla ya no está activa, vuelve a la primera", () => {
    expect(siguientePlantilla(plantillas, 99)?.id).toBe(3);
    expect(siguientePlantilla([], null)).toBeNull();
  });

  it("la liviana saca una serie, con mínimo una", () => {
    expect(seriesDeHoy(3, true)).toBe(2);
    expect(seriesDeHoy(1, true)).toBe(1);
    expect(seriesDeHoy(3, false)).toBe(3);
  });

  it("sugiere liviana tras un deporte, no tras una caminata", () => {
    expect(motivoLiviana([{ tipo: "SOCCER", nombre: "Fútbol", minutos: 75 }], "buena")).toBe("Ayer: fútbol (75 min).");
    expect(motivoLiviana([{ tipo: "WALKING", nombre: "Caminar", minutos: 90 }], "buena")).toBeNull();
    expect(motivoLiviana([{ tipo: "SOCCER", nombre: null, minutos: 20 }], null)).toBeNull();
  });

  it("o si la recuperación está baja", () => {
    expect(motivoLiviana([], "baja")).toMatch(/recuperación/);
    expect(motivoLiviana([], "media")).toBeNull();
  });
});
