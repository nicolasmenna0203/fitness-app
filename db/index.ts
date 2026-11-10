import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let instancia: NeonHttpDatabase<typeof schema> | null = null;

/**
 * Cliente de la base por HTTP (driver serverless de Neon): sin conexiones
 * persistentes, apto para funciones de Vercel. Se crea al primer uso, así el
 * build no necesita DATABASE_URL.
 */
export function db(): NeonHttpDatabase<typeof schema> {
  if (!instancia) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Falta DATABASE_URL");
    instancia = drizzle(neon(url), { schema, casing: "snake_case" });
  }
  return instancia;
}

export { schema };
