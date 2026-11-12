import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { fotos } from "@/db/schema";

/**
 * Sirve una foto de progreso (ADR 0011). Está detrás del login como toda la
 * app (proxy.ts). Una foto nunca cambia: se cachea en el navegador, en privado.
 */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/fotos/[id]">) {
  const { id } = await ctx.params;
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) return new Response("No encontrada", { status: 404 });
  const [f] = await db().select({ mime: fotos.mime, datos: fotos.datos }).from(fotos).where(eq(fotos.id, n));
  if (!f) return new Response("No encontrada", { status: 404 });
  return new Response(Buffer.from(f.datos, "base64"), {
    headers: { "Content-Type": f.mime, "Cache-Control": "private, max-age=31536000, immutable" },
  });
}
