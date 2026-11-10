import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { sincronizarGoogle } from "@/lib/google/sync";

/**
 * Respaldo diario de la sincronización (vercel.json → crons). Vercel manda
 * `Authorization: Bearer $CRON_SECRET`; sin eso no hace nada. El proxy la deja
 * pasar sin sesión porque el cron no tiene cookie.
 */
export async function GET(req: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  const recibido = req.headers.get("authorization") ?? "";
  const esperado = `Bearer ${secreto}`;
  const ok = !!secreto && recibido.length === esperado.length && timingSafeEqual(Buffer.from(recibido), Buffer.from(esperado));
  if (!ok) return new Response("No autorizado", { status: 401 });

  const r = await sincronizarGoogle(3);
  return Response.json(r, { status: r.estado === "error" ? 500 : 200 });
}
