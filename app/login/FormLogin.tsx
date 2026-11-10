"use client";

import { useActionState } from "react";
import { iniciarSesion, type EstadoLogin } from "./acciones";

const INICIAL: EstadoLogin = { error: null };

export function FormLogin() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, INICIAL);

  return (
    <form action={accion} className="flex w-full flex-col gap-3">
      {/* Campo de usuario oculto: ayuda a que el llavero de iCloud guarde la contraseña. */}
      <input type="text" name="usuario" autoComplete="username" defaultValue="fitness" hidden readOnly />
      <label htmlFor="clave" className="sr-only">
        Contraseña
      </label>
      <input
        id="clave"
        name="clave"
        type="password"
        autoComplete="current-password"
        required
        placeholder="Contraseña"
        aria-invalid={estado.error ? true : undefined}
        aria-describedby={estado.error ? "error-login" : undefined}
        className="h-[50px] rounded-[14px] bg-card px-4 text-[17px] outline-none placeholder:text-ink2 focus:ring-2 focus:ring-accent"
      />
      <button
        type="submit"
        disabled={enviando}
        className="h-[50px] rounded-[14px] bg-accent text-[17px] font-semibold text-on-accent disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
      <p id="error-login" aria-live="polite" className="min-h-5 text-center text-[15px] text-warn">
        {estado.error}
      </p>
    </form>
  );
}
