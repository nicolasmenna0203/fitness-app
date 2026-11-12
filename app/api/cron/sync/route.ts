import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { ajustarMetaSiCorresponde } from "@/lib/datos/comer";
import { esDemo } from "@/lib/demo";
import { regenerarDemo } from "@/lib/demo/semilla";
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

  // En la demo, el cron diario regenera los datos sintéticos en vez de sincronizar.
  if (esDemo) return Response.json({ demo: await regenerarDemo() });

  const r = await sincronizarGoogle(3);
  const ajuste = await ajustarMetaSiCorresponde().catch((e) => `error: ${e instanceof Error ? e.message : e}`);
  return Response.json({ ...r, ajusteCalorias: ajuste }, { status: r.estado === "error" ? 500 : 200 });
}
