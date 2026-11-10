"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { conexionGoogle } from "@/db/schema";
import { descifrar } from "@/lib/cifrado";
import { revocar } from "@/lib/google/api";
import { sincronizarGoogle, sincronizarSiHaceFalta, type ResultadoSync } from "@/lib/google/sync";

/** Al abrir la app. Devuelve si trajo datos nuevos, para refrescar la pantalla. */
export async function sincronizarAlAbrir(): Promise<ResultadoSync> {
  return sincronizarSiHaceFalta();
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
