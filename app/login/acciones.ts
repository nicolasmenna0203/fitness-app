"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verificarClave } from "@/lib/clave";
import { crearToken, SESION_COOKIE, SESION_MAX_AGE } from "@/lib/sesion";

export type EstadoLogin = { error: string | null };

// Demora fija ante un intento fallido: sin base de datos no hay contador de
// intentos entre instancias, así que se frena la fuerza bruta por tiempo (ADR 0008).
const DEMORA_FALLO_MS = 800;

export async function iniciarSesion(_: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const clave = formData.get("clave");
  const hash = process.env.APP_PASSWORD_HASH;
  const secreto = process.env.SESSION_SECRET;

  if (!hash || !secreto) {
    return { error: "La app no tiene la contraseña configurada en el servidor." };
  }

  if (typeof clave !== "string" || !verificarClave(clave, hash)) {
    await new Promise((r) => setTimeout(r, DEMORA_FALLO_MS));
    return { error: "Contraseña incorrecta." };
  }

  (await cookies()).set(SESION_COOKIE, crearToken(secreto), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESION_MAX_AGE,
  });
  redirect("/");
}

export async function cerrarSesion(): Promise<void> {
  (await cookies()).delete(SESION_COOKIE);
  redirect("/login");
}
