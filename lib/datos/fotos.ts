import "server-only";
import { asc, desc } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { fotos, type Pose } from "@/db/schema";

export type FotoMeta = { id: number; fecha: string; pose: Pose; ancho: number; alto: number };

const columnas = { id: fotos.id, fecha: fotos.fecha, pose: fotos.pose, ancho: fotos.ancho, alto: fotos.alto };

/** Todas las fotos, sin la imagen (ADR 0011), de la más vieja a la más nueva. */
export async function listarFotos(): Promise<FotoMeta[]> {
  await connection();
  return db().select(columnas).from(fotos).orderBy(asc(fotos.fecha), asc(fotos.id));
}

/** Fecha de la última foto, o null. Sin `connection()`: para la revisión semanal. */
export async function fechaUltimaFoto(): Promise<string | null> {
  const [f] = await db().select({ fecha: fotos.fecha }).from(fotos).orderBy(desc(fotos.fecha)).limit(1);
  return f?.fecha ?? null;
}

/** La primera y la última foto de cada pose, para comparar. */
export function paraComparar(todas: FotoMeta[]): { pose: Pose; primera: FotoMeta; ultima: FotoMeta }[] {
  const porPose = new Map<Pose, FotoMeta[]>();
  for (const f of todas) porPose.set(f.pose, [...(porPose.get(f.pose) ?? []), f]);
  return [...porPose.entries()]
    .filter(([, l]) => l.length >= 2)
    .map(([pose, l]) => ({ pose, primera: l[0], ultima: l.at(-1)! }));
}
