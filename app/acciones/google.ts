"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { conexionGoogle } from "@/db/schema";
import { descifrar } from "@/lib/cifrado";
import { revocar } from "@/lib/google/api";
import { ajustarMetaSiCorresponde } from "@/lib/datos/comer";
import { sincronizarGoogle, sincronizarSiHaceFalta } from "@/lib/google/sync";

/**
 * Al abrir la app: trae datos nuevos de Google y, si toca, hace el ajuste
 * semanal de calorías (ADR 0005). Devuelve si cambió algo, para refrescar.
 */
export async function sincronizarAlAbrir(): Promise<{ cambio: boolean }> {
  const sync = await sincronizarSiHaceFalta().catch(() => null);
  const ajuste = await ajustarMetaSiCorresponde().catch(() => null);
  return { cambio: sync?.estado === "ok" || ajuste === "creada" || ajuste === "ajustada" };
}

export async function sincronizarAhora(): Promise<void> {
  await sincronizarGoogle(7);
  refresh();
}

export async function desconectarGoogle(): Promise<void> {
  const [c] = await db().select().from(conexionGoogle).where(eq(conexionGoogle.id, 1));
  if (c) {
    await revocar(descifrar(c.refreshTokenCifrado)).catch(() => {});
    await db().delete(conexionGoogle).where(eq(conexionGoogle.id, 1));
  }
  refresh();
}
