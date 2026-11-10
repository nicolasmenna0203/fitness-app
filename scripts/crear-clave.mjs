/**
 * Configura la contraseña de la app (ADR 0008).
 *
 * Pide la contraseña sin mostrarla, y escribe en `.env.local` (no se versiona):
 *   APP_PASSWORD_HASH  hash scrypt de la contraseña
 *   SESSION_SECRET     secreto aleatorio para firmar la sesión
 * Después muestra los dos valores para cargarlos en Vercel. Ninguno es la
 * contraseña: se pueden pegar en el panel sin exponerla.
 *
 * Uso (en tu terminal, no hace falta nada instalado): node scripts/crear-clave.mjs
 *
 * Mismo formato que lib/clave.ts: scrypt$<sal>$<hash>, N=16384 r=8 p=1, 32 bytes.
 */
import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENV = join(RAIZ, ".env.local");
const MINIMO = 12;

function preguntarOculto(pregunta) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      // Muestra la pregunta, pero no lo que se escribe.
      if (s.includes(pregunta)) process.stdout.write(s);
    };
    rl.question(pregunta, (r) => {
      rl.close();
      process.stdout.write("\n");
      resolve(r);
    });
  });
}

function actualizarEnv(valores) {
  let texto = existsSync(ENV) ? readFileSync(ENV, "utf8") : "";
  for (const [clave, valor] of Object.entries(valores)) {
    const linea = `${clave}=${valor}`;
    const re = new RegExp(`^${clave}=.*$`, "m");
    texto = re.test(texto) ? texto.replace(re, linea) : texto + (texto && !texto.endsWith("\n") ? "\n" : "") + linea + "\n";
  }
  writeFileSync(ENV, texto);
}

if (!process.stdin.isTTY) {
  console.error("Corré este script en una terminal interactiva: pide la contraseña sin mostrarla.");
  process.exit(1);
}

const clave = await preguntarOculto("Nueva contraseña (mínimo 12 caracteres): ");
if (clave.length < MINIMO) {
  console.error(`✗ Muy corta: usá al menos ${MINIMO} caracteres. Una frase de varias palabras sirve.`);
  process.exit(1);
}
const repetida = await preguntarOculto("Repetila: ");
if (clave !== repetida) {
  console.error("✗ No coinciden.");
  process.exit(1);
}

const sal = randomBytes(16);
const hash = scryptSync(clave, sal, 32, { N: 16384, r: 8, p: 1 });
const valores = {
  APP_PASSWORD_HASH: `scrypt$${sal.toString("base64url")}$${hash.toString("base64url")}`,
  SESSION_SECRET: randomBytes(32).toString("base64url"),
};
actualizarEnv(valores);

console.log("\n✓ Guardado en .env.local. Cargá estas dos variables en Vercel");
console.log("  (Project → Settings → Environment Variables, entorno Production):\n");
for (const [k, v] of Object.entries(valores)) console.log(`  ${k}=${v}`);
console.log("\nDespués hacé Redeploy para que las tome.\n");
