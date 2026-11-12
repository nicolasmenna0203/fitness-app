"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { fotos, POSES, type Pose } from "@/db/schema";
import { esDemo } from "@/lib/demo";
import { fechaLocal } from "@/lib/fecha";

export type ResultadoFoto = { ok: true } | { ok: false; error: string };

const MAX_BYTES = 900_000;
const TIPOS = new Set(["image/jpeg", "image/webp"]);

/** Guarda una foto ya comprimida en el dispositivo (ADR 0011). */
export async function subirFoto(formData: FormData): Promise<ResultadoFoto> {
  if (esDemo) return { ok: false, error: "En la demo no se suben fotos." };
  const archivo = formData.get("foto");
  const pose = formData.get("pose");
  const ancho = Number(formData.get("ancho"));
  const alto = Number(formData.get("alto"));
  if (!(archivo instanceof Blob) || !TIPOS.has(archivo.type)) return { ok: false, error: "El archivo no es una imagen." };
  if (archivo.size > MAX_BYTES) return { ok: false, error: "La foto es demasiado grande." };
  if (typeof pose !== "string" || !POSES.includes(pose as Pose)) return { ok: false, error: "Pose inválida." };
  if (![ancho, alto].every((n) => Number.isInteger(n) && n > 0 && n <= 4000)) return { ok: false, error: "Medidas inválidas." };

  const datos = Buffer.from(await archivo.arrayBuffer()).toString("base64");
  await db().insert(fotos).values({ fecha: fechaLocal(), pose: pose as Pose, mime: archivo.type, ancho, alto, datos });
  refresh();
  return { ok: true };
}

export async function borrarFoto(id: number): Promise<void> {
  await db().delete(fotos).where(eq(fotos.id, id));
  refresh();
}
