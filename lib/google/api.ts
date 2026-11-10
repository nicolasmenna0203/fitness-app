import "server-only";
import type { Punto } from "./transformar";

/**
 * Cliente mínimo de la Google Health API v4 y de OAuth de Google (ADR 0002).
 * La app está publicada sin verificar como uso personal: el refresh token no
 * vence a los 7 días, pero Google puede revocarlo (invalid_grant).
 */
const API = "https://health.googleapis.com/v4/users/me";
const TOKEN = "https://oauth2.googleapis.com/token";

/** Cookie con el `state` del OAuth, entre /api/google/conectar y el callback. */
export const COOKIE_STATE = "google_state";

export const PERMISOS = [
  "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
  "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
  "https://www.googleapis.com/auth/googlehealth.sleep.readonly",
];

/** Error de Google. `reconectar` = el usuario tiene que volver a autorizar. */
export class ErrorGoogle extends Error {
  constructor(
    mensaje: string,
    readonly reconectar = false,
  ) {
    super(mensaje);
  }
}

function credenciales() {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secreto = process.env.GOOGLE_CLIENT_SECRET;
  if (!id || !secreto) throw new ErrorGoogle("Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET");
  return { id, secreto };
}

export function urlAutorizacion(redirectUri: string, state: string): string {
  return (
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: credenciales().id,
      redirect_uri: redirectUri,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      scope: PERMISOS.join(" "),
      state,
    })
  );
}

async function postToken(campos: Record<string, string>) {
  const r = await fetch(TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(campos),
    cache: "no-store",
  });
  const json = (await r.json()) as Record<string, string>;
  if (!r.ok) throw new ErrorGoogle(`${json.error}: ${json.error_description ?? ""}`.trim(), json.error === "invalid_grant");
  return json;
}

export async function canjearCodigo(code: string, redirectUri: string) {
  const { id, secreto } = credenciales();
  const t = await postToken({ code, client_id: id, client_secret: secreto, redirect_uri: redirectUri, grant_type: "authorization_code" });
  if (!t.refresh_token) throw new ErrorGoogle("Google no devolvió refresh_token");
  return { refreshToken: t.refresh_token, permisos: t.scope ?? "" };
}

export async function accessToken(refreshToken: string): Promise<string> {
  const { id, secreto } = credenciales();
  const t = await postToken({ client_id: id, client_secret: secreto, refresh_token: refreshToken, grant_type: "refresh_token" });
  return t.access_token;
}

export async function revocar(refreshToken: string): Promise<void> {
  await fetch("https://oauth2.googleapis.com/revoke?" + new URLSearchParams({ token: refreshToken }), { method: "POST", cache: "no-store" }).catch(() => {});
}

/**
 * Lista todos los puntos de un tipo con un filtro AIP-160, recorriendo páginas.
 * El tamaño de página por defecto varía por tipo (heart-rate trae 50), así que se pide explícito.
 */
export async function listar(token: string, tipo: string, filtro: string, pageSize = 10000): Promise<Punto[]> {
  const puntos: Punto[] = [];
  let pageToken: string | undefined;
  for (let pagina = 0; pagina < 50; pagina++) {
    const params = new URLSearchParams({ filter: filtro, pageSize: String(pageSize) });
    if (pageToken) params.set("pageToken", pageToken);
    const r = await fetch(`${API}/dataTypes/${tipo}/dataPoints?${params}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const json = (await r.json()) as { dataPoints?: Punto[]; nextPageToken?: string; error?: { status?: string; message?: string } };
    if (!r.ok) {
      const noVinculada = JSON.stringify(json).includes("ACCOUNT_NOT_LINKED");
      throw new ErrorGoogle(noVinculada ? "La cuenta no está vinculada a Google Health" : `${tipo}: ${json.error?.status ?? r.status} ${json.error?.message ?? ""}`.trim());
    }
    puntos.push(...(json.dataPoints ?? []));
    pageToken = json.nextPageToken || undefined;
    if (!pageToken) return puntos;
  }
  throw new ErrorGoogle(`${tipo}: demasiadas páginas`);
}
