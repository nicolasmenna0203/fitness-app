import { describe, expect, it } from "vitest";
import {
  aActividad,
  aSueno,
  buscarNumero,
  fechaCivil,
  leerFcReposo,
  leerVfc,
  porDia,
  segundos,
  sumarPorDia,
} from "./transformar";

// Fixtures sintéticos con el formato real de la API (valores inventados).
const minuto = (clave: string, campo: string, inicioUtc: string, valor: number | string) => ({
  dataSource: { recordingMethod: "PASSIVELY_MEASURED", platform: "FITBIT" },
  [clave]: {
    interval: {
      startTime: inicioUtc,
      startUtcOffset: "-10800s",
      endTime: inicioUtc,
      endUtcOffset: "-10800s",
      civilStartTime: { date: { year: 2026, month: 3, day: Number(inicioUtc.slice(8, 10)) - (inicioUtc.slice(11, 13) < "03" ? 1 : 0) } },
    },
    [campo]: valor,
  },
});

describe("fechas de intervalos", () => {
  it("usa la fecha civil cuando viene", () => {
    expect(fechaCivil({ civilStartTime: { date: { year: 2026, month: 3, day: 4 } }, startTime: "2026-03-05T01:00:00Z" }, "inicio")).toBe("2026-03-04");
  });

  it("si no hay fecha civil, aplica el offset: 01:00 UTC con -3 h es el día anterior", () => {
    expect(fechaCivil({ startTime: "2026-03-05T01:00:00Z", startUtcOffset: "-10800s" }, "inicio")).toBe("2026-03-04");
    expect(fechaCivil({ endTime: "2026-03-05T10:00:00Z", endUtcOffset: "-10800s" }, "fin")).toBe("2026-03-05");
  });

  it("duraciones de Google", () => {
    expect(segundos("1680s")).toBe(1680);
    expect(segundos("12.5s")).toBe(12.5);
    expect(segundos("1680")).toBeNull();
  });
});

describe("sumas por día", () => {
  it("suma pasos minuto a minuto por día civil", () => {
    const puntos = [
      minuto("steps", "count", "2026-03-04T15:00:00Z", "40"),
      minuto("steps", "count", "2026-03-04T15:01:00Z", "60"),
      minuto("steps", "count", "2026-03-05T01:30:00Z", "10"), // 22:30 del 4 en hora local
      minuto("steps", "count", "2026-03-05T12:00:00Z", "5"),
    ];
    const r = sumarPorDia(puntos, "steps", "count");
    expect(r.get("2026-03-04")).toBe(110);
    expect(r.get("2026-03-05")).toBe(5);
  });

  it("ignora puntos sin valor numérico", () => {
    expect(sumarPorDia([minuto("activeEnergyBurned", "kcal", "2026-03-04T15:00:00Z", "x")], "activeEnergyBurned", "kcal").size).toBe(0);
  });
});

describe("tipos diarios", () => {
  it("FC en reposo", () => {
    const p = { dailyRestingHeartRate: { date: { year: 2026, month: 3, day: 4 }, beatsPerMinute: "61" } };
    const r = porDia([p], "dailyRestingHeartRate", leerFcReposo);
    expect(r.get("2026-03-04")?.valor).toBe(61);
    expect(r.get("2026-03-04")?.crudo).toBe(p);
  });

  it("variabilidad: encuentra el valor en milisegundos aunque el campo cambie de nombre", () => {
    const p = { dailyHeartRateVariability: { date: { year: 2026, month: 3, day: 4 }, averageHeartRateVariabilityMilliseconds: 42.5 } };
    expect(porDia([p], "dailyHeartRateVariability", leerVfc).get("2026-03-04")?.valor).toBe(42.5);
  });

  it("búsqueda en profundidad no confunde la fecha con el valor", () => {
    expect(buscarNumero({ date: { year: 2026 }, resumen: { rmssdMillis: "37" } }, /milli|rmssd/i)).toBe(37);
  });
});

describe("sueño", () => {
  const base = {
    name: "users/x/dataTypes/sleep/dataPoints/1",
    sleep: { interval: { startTime: "2026-03-05T02:30:00Z", startUtcOffset: "-10800s", endTime: "2026-03-05T09:45:00Z", endUtcOffset: "-10800s" } },
  };

  it("sin resumen usa la duración del intervalo y fecha de fin local", () => {
    const s = aSueno(base)!;
    expect(s.fecha).toBe("2026-03-05");
    expect(s.minutosDormido).toBe(435);
    expect(s.id).toBe(base.name);
  });

  it("prefiere el resumen de minutos dormido si viene", () => {
    const conResumen = { ...base, sleep: { ...base.sleep, summary: { minutesAsleep: "402" } } };
    expect(aSueno(conResumen)!.minutosDormido).toBe(402);
  });

  it("descarta puntos incompletos", () => {
    expect(aSueno({ sleep: { interval: {} } })).toBeNull();
  });
});

describe("ejercicios", () => {
  it("mapea el resumen de métricas", () => {
    const p = {
      name: "users/x/dataTypes/exercise/dataPoints/9",
      exercise: {
        interval: { startTime: "2026-03-04T20:00:00Z", startUtcOffset: "-10800s", endTime: "2026-03-04T21:15:00Z", endUtcOffset: "-10800s" },
        exerciseType: "SOCCER",
        displayName: "Fútbol",
        metricsSummary: { caloriesKcal: 612.4, distanceMillimeters: 6100000, steps: "7800", averageHeartRateBeatsPerMinute: "142" },
      },
    };
    expect(aActividad(p)).toMatchObject({
      externoId: p.name,
      tipo: "SOCCER",
      nombre: "Fútbol",
      fecha: "2026-03-04",
      kcal: 612,
      fcMedia: 142,
      pasos: 7800,
      distanciaM: 6100,
    });
  });
});
