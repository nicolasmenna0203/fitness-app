import { describe, expect, it } from "vitest";
import { derivar, leerDePalabras, leerDeTexto, leerFecha, numeroDeCampo, similitud, type Palabra } from "./lector";

// Reporte sintético con el diseño de Huawei Health: tarjetas en dos columnas,
// valor arriba y nombre abajo. Valores inventados.
function palabrasDe(texto: string, x: number, y: number, h: number): Palabra[] {
  let cursor = x;
  return texto.split(" ").map((t) => {
    const w = t.length * h * 0.5;
    const p = { texto: t, x0: cursor, y0: y, x1: cursor + w, y1: y + h };
    cursor += w + h * 0.4;
    return p;
  });
}
function tarjeta(x: number, y: number, valor: string, etiqueta: string): Palabra[] {
  return [...palabrasDe(valor, x, y, 26), ...palabrasDe(etiqueta, x, y + 34, 18), ...palabrasDe("Estándar", x, y + 58, 16)];
}
function reporte(ruido = (s: string) => s): Palabra[] {
  const r = (pal: Palabra[]) => pal.map((p) => ({ ...p, texto: ruido(p.texto) }));
  return [
    ...palabrasDe("Ana 12/05/2026 08:40", 60, 20, 16),
    ...palabrasDe("71,4", 300, 80, 90), // peso principal, sin etiqueta
    ...palabrasDe("kg", 470, 80, 30),
    ...r(tarjeta(40, 260, "21,5", "IMC")),
    ...r(tarjeta(560, 260, "17,2%", "Porcentaje de grasa corporal")),
    ...r(tarjeta(560, 420, "45,1 kg", "Masa de agua corporal")),
    ...r(tarjeta(560, 520, "12,3 kg", "Grasa corporal")),
    ...r(tarjeta(40, 700, "56,2 kg", "Masa muscular")),
    ...r(tarjeta(560, 700, "78,7 %", "Porcentaje de músculo")),
    ...r(tarjeta(40, 840, "61,0%", "Agua corporal")),
    ...r(tarjeta(560, 840, "31,4kg", "Masa muscular esquelética")),
    ...r(tarjeta(40, 980, "6,0", "Calificación de grasa visceral")),
    ...r(tarjeta(560, 980, "1702 Kcal", "Índice metabólico basal")),
    ...r(tarjeta(40, 1120, "59,1 kg", "Peso corporal sin grasa")),
    ...r(tarjeta(560, 1120, "64 lpm", "Frecuencia cardíaca")),
  ];
}

describe("lector: piezas", () => {
  it("similitud tolera errores chicos de OCR", () => {
    expect(similitud("masa muscular", "masa muscular")).toBe(1);
    expect(similitud("maso muscolar", "masa muscular")).toBeGreaterThan(0.8);
    expect(similitud("imc", "edad corporal")).toBeLessThan(0.3);
  });

  it("números con la unidad pegada o mal leída", () => {
    const kg = { min: 10, max: 150, decimales: 1 };
    expect(numeroDeCampo("47,8kg", kg)).toBe(47.8);
    expect(numeroDeCampo("41,610", kg)).toBe(41.6); // "41,6kg" con "kg" leído como "10"
    expect(numeroDeCampo("581", { min: 15, max: 200, decimales: 1 })).toBe(58); // "58kg"
    expect(numeroDeCampo("1702 kcal", { min: 800, max: 4000, decimales: 0 })).toBe(1702);
    expect(numeroDeCampo("0,86", { min: 0.5, max: 1.5, decimales: 2 })).toBe(0.86);
    expect(numeroDeCampo("Estándar", kg)).toBeNull();
  });

  it("fecha del reporte", () => {
    expect(leerFecha("Ana 12/05/2026 08:40")).toBe("2026-05-12");
    expect(leerFecha("sin fecha")).toBeNull();
  });

  it("controles cruzados", () => {
    expect(derivar({ sinGrasaKg: 59.1, grasaKg: 12.3 }).peso).toBe(71.4);
    expect(derivar({ peso: 17.4, sinGrasaKg: 59.1, grasaKg: 12.3 }).peso).toBe(71.4); // OCR leyó mal el peso
    expect(derivar({ peso: 71.4, grasaKg: 12.3 }).grasaPct).toBe(17.2);
  });
});

describe("lector: reporte con posiciones", () => {
  it("lee cada valor de la tarjeta correcta, sin cruzar columnas", () => {
    const { fecha, valores } = leerDePalabras(reporte());
    expect(fecha).toBe("2026-05-12");
    expect(valores).toMatchObject({
      peso: 71.4,
      imc: 21.5,
      grasaPct: 17.2,
      aguaKg: 45.1,
      grasaKg: 12.3,
      masaMuscularKg: 56.2,
      musculoPct: 78.7,
      aguaPct: 61,
      musculoEsqueleticoKg: 31.4,
      grasaVisceral: 6,
      basalKcal: 1702,
      sinGrasaKg: 59.1,
      fcLpm: 64,
    });
  });

  it("aguanta errores típicos de OCR en nombres y unidades", () => {
    const ruido = (s: string) =>
      s.replace("muscular", "muscolar").replace("Porcentaje", "Porcentaie").replace("kg", "k9").replace("Índice", "Indice");
    const { valores } = leerDePalabras(reporte(ruido));
    expect(valores.masaMuscularKg).toBe(56.2);
    expect(valores.musculoEsqueleticoKg).toBe(31.4);
    expect(valores.grasaPct).toBe(17.2);
    expect(valores.basalKcal).toBe(1702);
  });
});

describe("lector: texto plano", () => {
  it("valor en la misma línea, antes o después del nombre", () => {
    const texto = ["Reporte 12/05/2026", "Peso: 71,4 kg", "Masa muscular 56,2 kg", "17,2 %", "Porcentaje de grasa corporal", "Índice metabólico basal 1702 kcal", "Masa muscular esquelética: 31,4 kg"].join("\n");
    const { fecha, valores } = leerDeTexto(texto);
    expect(fecha).toBe("2026-05-12");
    expect(valores).toMatchObject({ peso: 71.4, masaMuscularKg: 56.2, grasaPct: 17.2, basalKcal: 1702, musculoEsqueleticoKg: 31.4 });
  });

  it("CSV de una exportación", () => {
    const { valores } = leerDeTexto("Peso,71.4\nGrasa corporal,12.3\nPeso corporal sin grasa,59.1");
    expect(valores).toMatchObject({ peso: 71.4, grasaKg: 12.3, sinGrasaKg: 59.1 });
  });
});

describe("lector: falsos amigos", () => {
  it("no toma el 'Peso estándar' de las sugerencias como peso", () => {
    const pal = [...palabrasDe("Peso estándar:", 40, 1500, 18), ...palabrasDe("74,9kg", 300, 1500, 18)];
    expect(leerDePalabras(pal).valores.peso).toBeUndefined();
    expect(leerDeTexto("Peso estándar: 74,9 kg\nControl del peso: 3,5 kg").valores.peso).toBeUndefined();
  });
});
