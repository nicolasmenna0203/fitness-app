/**
 * Convierte respuestas de la Google Health API (v4) en filas de la base.
 * Funciones puras: sin red ni base, para poder testearlas con datos sintéticos.
 *
 * Formatos verificados con datos reales: pasos, calorías activas, FC en reposo
 * diaria y ejercicios. Sueño, variabilidad de FC y oxígeno todavía no tenían
 * datos al escribir esto: se leen con búsqueda defensiva de campos y se guarda
 * la respuesta cruda, para ajustar la lectura sin perder nada.
 */

type Obj = Record<string, unknown>;
export type Punto = Obj;

type FechaGoogle = { year: number; month: number; day: number };
type Intervalo = {
  startTime?: string;
  endTime?: string;
  startUtcOffset?: string;
  endUtcOffset?: string;
  civilStartTime?: { date?: FechaGoogle };
  civilEndTime?: { date?: FechaGoogle };
};

const esObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

/** "74" o 74 → 74; cualquier otra cosa → null. */
export function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

/** "1680s" → 1680; null si no es una duración de Google. */
export function segundos(v: unknown): number | null {
  if (typeof v !== "string") return null;
  const m = v.match(/^(-?\d+(?:\.\d+)?)s$/);
  return m ? Number(m[1]) : null;
}

export function fechaDe(f: unknown): string | null {
  if (!esObj(f)) return null;
  const { year, month, day } = f as FechaGoogle;
  if (!year || !month || !day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Día civil del inicio o del fin de un intervalo (usa la fecha civil si viene, si no aplica el offset). */
export function fechaCivil(intervalo: unknown, extremo: "inicio" | "fin"): string | null {
  if (!esObj(intervalo)) return null;
  const i = intervalo as Intervalo;
  const civil = fechaDe(extremo === "inicio" ? i.civilStartTime?.date : i.civilEndTime?.date);
  if (civil) return civil;
  const instante = extremo === "inicio" ? i.startTime : i.endTime;
  if (!instante) return null;
  const offset = segundos(extremo === "inicio" ? i.startUtcOffset : i.endUtcOffset) ?? 0;
  const t = Date.parse(instante);
  return Number.isNaN(t) ? null : new Date(t + offset * 1000).toISOString().slice(0, 10);
}

/** Datos del punto según su tipo: `{ steps: {...} }` → `{...}`. */
export function cuerpo(p: Punto, clave: string): Obj | null {
  const v = p[clave];
  return esObj(v) ? v : null;
}

/**
 * Busca el primer número cuyo nombre de campo cumpla `patron`, recorriendo el
 * objeto en profundidad. Para tipos cuyo formato exacto todavía no se vio.
 */
export function buscarNumero(obj: unknown, patron: RegExp, profundidad = 4): number | null {
  if (!esObj(obj) || profundidad < 0) return null;
  for (const [k, v] of Object.entries(obj)) {
    if (patron.test(k)) {
      const n = num(v);
      if (n !== null) return n;
    }
  }
  for (const v of Object.values(obj)) {
    const n = buscarNumero(v, patron, profundidad - 1);
    if (n !== null) return n;
  }
  return null;
}

/** Suma por día civil un campo de puntos minuto a minuto (pasos, calorías activas). */
export function sumarPorDia(puntos: Punto[], clave: string, campo: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const p of puntos) {
    const c = cuerpo(p, clave);
    const fecha = fechaCivil(c?.interval, "inicio");
    const v = num(c?.[campo]);
    if (fecha && v !== null) out.set(fecha, (out.get(fecha) ?? 0) + v);
  }
  return out;
}

/** Tipos diarios (`dailyRestingHeartRate`, etc.): un valor y el punto crudo por día. */
export function porDia(puntos: Punto[], clave: string, leer: (c: Obj) => number | null): Map<string, { valor: number | null; crudo: Punto }> {
  const out = new Map<string, { valor: number | null; crudo: Punto }>();
  for (const p of puntos) {
    const c = cuerpo(p, clave);
    const fecha = fechaDe(c?.date);
    if (c && fecha) out.set(fecha, { valor: leer(c), crudo: p });
  }
  return out;
}

export const leerFcReposo = (c: Obj) => num(c.beatsPerMinute);
export const leerVfc = (c: Obj) => buscarNumero(c, /milli|rmssd/i);
export const leerSpo2 = (c: Obj) => buscarNumero(c, /percent|average|value/i);

export type FilaSueno = { id: string; fecha: string; inicio: Date; fin: Date; minutosDormido: number | null; crudo: Punto };

/** Sesión de sueño. Minutos dormido: el resumen si viene; si no, la duración del intervalo. */
export function aSueno(p: Punto): FilaSueno | null {
  const c = cuerpo(p, "sleep");
  const i = c?.interval as Intervalo | undefined;
  const fecha = fechaCivil(i, "fin");
  if (!c || !i?.startTime || !i.endTime || !fecha) return null;
  const inicio = new Date(i.startTime);
  const fin = new Date(i.endTime);
  const resumenMin = buscarNumero(c, /minutes?asleep|asleepminutes/i);
  const resumenSeg = (() => {
    for (const [k, v] of Object.entries(c)) if (/asleep|sleepduration|totalsleep/i.test(k) && segundos(v) !== null) return segundos(v);
    return null;
  })();
  const minutos = resumenMin ?? (resumenSeg !== null ? resumenSeg / 60 : (fin.getTime() - inicio.getTime()) / 60000);
  return {
    id: typeof p.name === "string" ? p.name : `${i.startTime}/${i.endTime}`,
    fecha,
    inicio,
    fin,
    minutosDormido: Math.round(minutos),
    crudo: p,
  };
}

export type FilaActividad = {
  externoId: string;
  tipo: string;
  nombre: string | null;
  fecha: string;
  inicio: Date;
  fin: Date;
  kcal: number | null;
  fcMedia: number | null;
  pasos: number | null;
  distanciaM: number | null;
  crudo: Punto;
};

export function aActividad(p: Punto): FilaActividad | null {
  const c = cuerpo(p, "exercise");
  const i = c?.interval as Intervalo | undefined;
  const fecha = fechaCivil(i, "inicio");
  if (!c || !i?.startTime || !i.endTime || !fecha) return null;
  const m = esObj(c.metricsSummary) ? c.metricsSummary : {};
  const mm = num(m.distanceMillimeters);
  return {
    externoId: typeof p.name === "string" ? p.name : `${i.startTime}/${c.exerciseType ?? "?"}`,
    tipo: typeof c.exerciseType === "string" ? c.exerciseType : "OTHER",
    nombre: typeof c.displayName === "string" ? c.displayName : null,
    fecha,
    inicio: new Date(i.startTime),
    fin: new Date(i.endTime),
    kcal: num(m.caloriesKcal) !== null ? Math.round(num(m.caloriesKcal)!) : null,
    fcMedia: num(m.averageHeartRateBeatsPerMinute),
    pasos: num(m.steps),
    distanciaM: mm !== null ? Math.round(mm / 1000) : null,
    crudo: p,
  };
}
