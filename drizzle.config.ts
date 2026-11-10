import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Mismas variables que la app (.env.local). Las migraciones van por la conexión
// directa: el pooler de Neon no es apto para DDL.
loadEnvConfig(process.cwd());

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL_UNPOOLED en .env.local (vercel env pull)");

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migraciones",
  dbCredentials: { url },
  casing: "snake_case",
  strict: true,
});
