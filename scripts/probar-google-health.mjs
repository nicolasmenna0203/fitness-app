/**
 * Prueba de la Google Health API para una sola cuenta (ADR 0002).
 *
 * Responde tres preguntas antes de diseñar la integración:
 *   1. ¿Una app sin verificar, en "In production", puede pedir los permisos
 *      restringidos de la API? (excepción de uso personal de Google)
 *   2. ¿Qué datos de la pulsera llegan y con qué formato?
 *   3. ¿La sesión (refresh token) sigue viva después de 7 días?
 *
 * Uso:
 *   node scripts/probar-google-health.mjs login   inicia sesión y prueba los datos
 *   node scripts/probar-google-health.mjs datos   reusa la sesión guardada
 *
 * Necesita `privado/client_secret.json` (el JSON del cliente OAuth descargado
 * de Google Cloud). Guarda la sesión y las respuestas crudas en `privado/`,
 * que no se versiona. Guía de configuración: docs/guias/google-health-api.md
 *
 * Sin dependencias: Node 18+ (fetch nativo).
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PRIVADO = join(RAIZ, 'privado');
const CLIENTE = join(PRIVADO, 'client_secret.json');
const SESION = join(PRIVADO, 'google-health-sesion.json');
const MUESTRAS = join(PRIVADO, 'muestras-google-health');

const PUERTO = 8765;
const REDIRECT = `http://localhost:${PUERTO}/callback`;
const API = 'https://health.googleapis.com/v4/users/me';
const SCOPES = [
  'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly',
  'https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly',
  'https://www.googleapis.com/auth/googlehealth.sleep.readonly',
];

// ---------------------------------------------------------------- utilidades

function leerCliente() {
  if (!existsSync(CLIENTE)) {
    salir(`Falta ${relativo(CLIENTE)}: descargá el JSON del cliente OAuth (paso 5 de la guía).`);
  }
  const json = JSON.parse(readFileSync(CLIENTE, 'utf8'));
  const c = json.web ?? json.installed;
  if (!c?.client_id || !c?.client_secret) salir('El client_secret.json no tiene client_id/client_secret.');
  return { id: c.client_id, secreto: c.client_secret };
}

function relativo(p) {
  return p.replace(RAIZ, '.').replaceAll('\\', '/');
}

function salir(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

/** Fecha civil local (YYYY-MM-DD) de hace `dias` días. */
function fechaLocal(dias = 0) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function abrirNavegador(url) {
  // rundll32 evita los problemas de `start` de cmd con los "&" de la URL.
  const [cmd, args] = process.platform === 'win32'
    ? ['rundll32', ['url.dll,FileProtocolHandler', url]]
    : [process.platform === 'darwin' ? 'open' : 'xdg-open', [url]];
  spawn(cmd, args, { detached: true, stdio: 'ignore' }).on('error', () => {}).unref();
}

async function postToken(campos) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(campos),
  });
  const json = await r.json();
  if (!r.ok) throw new Error(`${json.error}: ${json.error_description ?? ''}`);
  return json;
}

// --------------------------------------------------------------------- login

async function login() {
  const cliente = leerCliente();
  const state = randomBytes(16).toString('hex');
  const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: cliente.id,
    redirect_uri: REDIRECT,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES.join(' '),
    state,
  });

  const code = await new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const u = new URL(req.url, REDIRECT);
      if (u.pathname !== '/callback') return res.writeHead(404).end();
      const error = u.searchParams.get('error');
      const ok = !error && u.searchParams.get('state') === state;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h2 style="font-family:system-ui">${ok ? '✓ Listo, volvé a la terminal.' : '✗ Algo falló: ' + (error ?? 'state inválido')}</h2>`);
      server.close();
      if (error) reject(new Error(`Google devolvió: ${error}`));
      else if (!ok) reject(new Error('El parámetro state no coincide'));
      else resolve(u.searchParams.get('code'));
    });
    server.listen(PUERTO, () => {
      console.log('\nAbriendo el navegador para iniciar sesión con Google…');
      console.log('Si no se abre, copiá esta URL:\n\n' + url + '\n');
      console.log('Si aparece "Google no verificó esta app": Configuración avanzada → Ir a … (no seguro).');
      abrirNavegador(url);
    });
    server.on('error', reject);
  });

  const tokens = await postToken({
    code,
    client_id: cliente.id,
    client_secret: cliente.secreto,
    redirect_uri: REDIRECT,
    grant_type: 'authorization_code',
  });
  if (!tokens.refresh_token) salir('Google no devolvió refresh_token (¿faltó prompt=consent?).');

  mkdirSync(PRIVADO, { recursive: true });
  writeFileSync(SESION, JSON.stringify({
    refresh_token: tokens.refresh_token,
    scope: tokens.scope,
    refresh_token_expires_in: tokens.refresh_token_expires_in ?? null,
    obtenido: new Date().toISOString(),
  }, null, 2));

  console.log('\n✓ Sesión guardada en ' + relativo(SESION));
  console.log('  Permisos otorgados: ' + tokens.scope.split(' ').map((s) => s.split('googlehealth.')[1] ?? s).join(', '));
  informarVencimiento(tokens.refresh_token_expires_in);
  await probarDatos(tokens.access_token);
}

function informarVencimiento(segundos) {
  // Google informa refresh_token_expires_in cuando el acceso es por tiempo. No
  // está documentado que lo haga siempre en modo Testing: que no venga es una
  // pista, no una prueba. La prueba es correr `datos` pasados los 7 días.
  if (segundos) {
    console.log(`  ⚠ La sesión vence en ${(segundos / 86400).toFixed(1)} días (¿la app sigue en "Testing"?).`);
  } else {
    console.log('  · Google no informó vencimiento. Se confirma corriendo `datos` dentro de 8 días.');
  }
}

// --------------------------------------------------------------------- datos

async function datos() {
  if (!existsSync(SESION)) salir('No hay sesión guardada: corré primero `login`.');
  const cliente = leerCliente();
  const sesion = JSON.parse(readFileSync(SESION, 'utf8'));
  const dias = (Date.now() - new Date(sesion.obtenido)) / 86400000;
  console.log(`\nSesión obtenida hace ${dias.toFixed(1)} días.`);

  let tokens;
  try {
    tokens = await postToken({
      client_id: cliente.id,
      client_secret: cliente.secreto,
      refresh_token: sesion.refresh_token,
      grant_type: 'refresh_token',
    });
  } catch (e) {
    salir(`La sesión ya no sirve (${e.message}). ${dias >= 7 ? 'Venció a los ~7 días: la app sigue tratándose como "Testing".' : ''} Corré \`login\` de nuevo.`);
  }
  console.log(`✓ La sesión sigue viva${dias >= 7 ? ' después de 7+ días: no hay vencimiento semanal.' : '.'}`);
  await probarDatos(tokens.access_token);
}

/** Cada prueba: tipo de dato, filtro y cómo resumir lo que llegó. */
function pruebas() {
  const hace7 = fechaLocal(7);
  const hoy = fechaLocal(0);
  const ayer = fechaLocal(1);
  return [
    { nombre: 'Sueño (7 días)', tipo: 'sleep', filtro: `sleep.interval.civil_end_time >= "${hace7}T00:00:00"`, pageSize: 25 },
    { nombre: 'Pasos (ayer y hoy)', tipo: 'steps', filtro: `steps.interval.civil_start_time >= "${ayer}T00:00:00"`,
      resumen: (pts) => `${pts.reduce((s, p) => s + Number(p.steps?.count ?? 0), 0)} pasos` },
    { nombre: 'FC en reposo diaria (7 días)', tipo: 'daily-resting-heart-rate', filtro: `daily_resting_heart_rate.date >= "${hace7}"` },
    { nombre: 'Variabilidad de FC diaria (7 días)', tipo: 'daily-heart-rate-variability', filtro: `daily_heart_rate_variability.date >= "${hace7}"` },
    { nombre: 'Frecuencia cardíaca (hoy)', tipo: 'heart-rate', filtro: `heart_rate.sample_time.civil_time >= "${hoy}T00:00:00"` },
    { nombre: 'Ejercicios (7 días)', tipo: 'exercise', filtro: `exercise.interval.civil_start_time >= "${hace7}T00:00:00"`, pageSize: 25 },
    { nombre: 'Calorías activas (ayer y hoy)', tipo: 'active-energy-burned', filtro: `active_energy_burned.interval.civil_start_time >= "${ayer}T00:00:00"` },
    { nombre: 'Oxígeno en sangre diario (7 días)', tipo: 'daily-oxygen-saturation', filtro: `daily_oxygen_saturation.date >= "${hace7}"` },
    { nombre: 'Peso (30 días)', tipo: 'weight', filtro: `weight.sample_time.civil_time >= "${fechaLocal(30)}T00:00:00"` },
  ];
}

async function api(token, ruta, params) {
  const url = `${API}${ruta}${params ? '?' + new URLSearchParams(params) : ''}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
  const texto = await r.text();
  let json;
  try { json = JSON.parse(texto); } catch { json = { raw: texto }; }
  return { ok: r.ok, status: r.status, json };
}

async function listarTodo(token, tipo, filtro, pageSize) {
  const puntos = [];
  let pageToken;
  for (let i = 0; i < 20; i++) {
    const params = { filter: filtro, ...(pageSize && { pageSize }), ...(pageToken && { pageToken }) };
    const r = await api(token, `/dataTypes/${tipo}/dataPoints`, params);
    if (!r.ok) return r;
    puntos.push(...(r.json.dataPoints ?? []));
    pageToken = r.json.nextPageToken;
    if (!pageToken) break;
  }
  return { ok: true, status: 200, json: { dataPoints: puntos } };
}

function motivo(json) {
  const e = json.error;
  if (!e) return JSON.stringify(json).slice(0, 200);
  const razon = e.details?.find((d) => d.reason)?.reason;
  return `${e.status ?? e.code}${razon ? ' / ' + razon : ''}: ${e.message ?? ''}`.slice(0, 200);
}

async function probarDatos(token) {
  mkdirSync(MUESTRAS, { recursive: true });
  console.log('\n— Cuenta —');
  const id = await api(token, '/identity');
  if (!id.ok) {
    const noVinculada = JSON.stringify(id.json).includes('ACCOUNT_NOT_LINKED');
    salir(noVinculada
      ? 'La cuenta de Google no está vinculada a Google Health: abrí la app Google Health en el celular con esta cuenta y volvé a probar.'
      : `identity → HTTP ${id.status} ${motivo(id.json)}`);
  }
  console.log('✓ Cuenta vinculada a Google Health');

  console.log('\n— Datos —');
  const resultados = [];
  for (const p of pruebas()) {
    const r = await listarTodo(token, p.tipo, p.filtro, p.pageSize);
    if (!r.ok) {
      console.log(`✗ ${p.nombre.padEnd(36)} HTTP ${r.status} ${motivo(r.json)}`);
      resultados.push({ ...p, ok: false });
      continue;
    }
    const pts = r.json.dataPoints;
    writeFileSync(join(MUESTRAS, `${p.tipo}.json`), JSON.stringify(r.json, null, 2));
    const extra = p.resumen && pts.length ? ` → ${p.resumen(pts)}` : '';
    const dispositivo = pts[0]?.dataSource?.device?.displayName;
    console.log(`${pts.length ? '✓' : '·'} ${p.nombre.padEnd(36)} ${String(pts.length).padStart(5)} registros${extra}${dispositivo ? `  (${dispositivo})` : ''}`);
    resultados.push({ ...p, ok: true, n: pts.length });
  }

  const conDatos = resultados.filter((r) => r.n > 0).length;
  const errores = resultados.filter((r) => !r.ok).length;
  console.log(`\nResumen: ${conDatos} tipos con datos, ${resultados.length - conDatos - errores} vacíos, ${errores} con error.`);
  console.log(`Respuestas crudas en ${relativo(MUESTRAS)}/ (para estudiar el formato; no se versionan).`);
  console.log('\nPara verificar el vencimiento: dentro de 8 días corré `node scripts/probar-google-health.mjs datos`.\n');
}

// ---------------------------------------------------------------------- main

const comando = process.argv[2];
const acciones = { login, datos };
if (!acciones[comando]) {
  console.log('Uso: node scripts/probar-google-health.mjs <login|datos>');
  process.exit(1);
}
acciones[comando]().catch((e) => salir(e.message));
