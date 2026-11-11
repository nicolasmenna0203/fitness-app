import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { desconectarGoogle, sincronizarAhora } from "@/app/acciones/google";
import { IconAlerta, IconCheck } from "@/components/icons";
import { Etiqueta, Tarjeta } from "@/components/ui";
import { db } from "@/db";
import { conexionGoogle } from "@/db/schema";

function haceCuanto(d: Date): string {
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} días`;
}

/** Estado de la conexión con Google Health (pulsera Fitbit). */
export async function TarjetaGoogle() {
  await connection(); // estado de la base y "hace X min": siempre al momento del pedido
  const [c] = await db()
    .select({ ultimaSync: conexionGoogle.ultimaSync, ultimoError: conexionGoogle.ultimoError, conectadoEn: conexionGoogle.conectadoEn })
    .from(conexionGoogle)
    .where(eq(conexionGoogle.id, 1));

  return (
    <Tarjeta etiqueta="Google Health" className="flex flex-col gap-3">
      <Etiqueta>Pulsera · Google Health</Etiqueta>
      {!c ? (
        <>
          <p className="text-[15px] text-ink2">
            Conectá tu cuenta de Google para traer sueño, frecuencia cardíaca, pasos y ejercicios de la pulsera. Solo lectura.
          </p>
          {/* <a> y no <Link>: es una redirección a Google, no una página de la app. */}
          <a
            href="/api/google/conectar"
            className="flex h-[50px] items-center justify-center rounded-[14px] bg-accent text-[17px] font-semibold text-on-accent"
          >
            Conectar con Google
          </a>
        </>
      ) : (
        <>
          <p className="flex items-center gap-1.5 text-[15px]">
            {c.ultimoError ? (
              <IconAlerta size={16} style={{ color: "var(--warn)" }} />
            ) : (
              <IconCheck size={16} style={{ color: "var(--good)" }} />
            )}
            Conectado · {c.ultimaSync ? `sincronizado ${haceCuanto(c.ultimaSync)}` : "sin sincronizar todavía"}
          </p>
          {c.ultimoError && <p className="rounded-xl bg-warnbg px-3 py-2 text-sm">{c.ultimoError}</p>}
          <div className="flex flex-wrap gap-2">
            <form action={sincronizarAhora}>
              <button type="submit" className="h-11 rounded-xl bg-fill px-4 text-[15px] font-semibold text-link">
                Sincronizar ahora
              </button>
            </form>
            {c.ultimoError?.includes("volver a conectar") && (
              <a href="/api/google/conectar" className="flex h-11 items-center rounded-xl bg-accent px-4 text-[15px] font-semibold text-on-accent">
                Volver a conectar
              </a>
            )}
            <form action={desconectarGoogle}>
              <button type="submit" className="h-11 px-2 text-[15px] text-warn">
                Desconectar
              </button>
            </form>
          </div>
        </>
      )}
    </Tarjeta>
  );
}
