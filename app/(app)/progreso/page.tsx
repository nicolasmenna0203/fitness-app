import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { IconAlerta, IconCheck } from "@/components/icons";
import { SubirFoto } from "@/components/progreso/Fotos";
import { FormMeta, FormPesaje } from "@/components/progreso/Formularios";
import { GraficoPeso } from "@/components/progreso/GraficoPeso";
import { Miniatura } from "@/components/progreso/Miniatura";
import { RevisionSemanal } from "@/components/semana/RevisionSemanal";
import { Encabezado, Etiqueta, Tarjeta } from "@/components/ui";
import { esDemo } from "@/lib/demo";
import { listarFotos } from "@/lib/datos/fotos";
import { revisionSemanal } from "@/lib/datos/semana";
import { marcasPersonales, resumenPeso, ultimosReportes } from "@/lib/datos/progreso";
import { fechaLarga } from "@/lib/fecha";
import { fmtDelta, fmtKg } from "@/lib/formato";

export const metadata: Metadata = { title: "Progreso" };

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const mesAnio = (f: string) => `${MESES[Number(f.slice(5, 7)) - 1]} ${f.slice(0, 4)}`;

async function Peso() {
  const r = await resumenPeso();
  const enRitmo = r.ritmo !== null && r.ritmoObjetivo !== null ? r.ritmo >= r.ritmoObjetivo * 0.8 : null;
  return (
    <Tarjeta etiqueta="Peso" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Etiqueta>Peso · tendencia</Etiqueta>
          <p className="text-[34px] leading-tight font-bold tracking-tight tabular-nums">
            {r.actual !== null ? fmtKg(r.actual) : "—"} <span className="text-[17px] font-medium text-ink2">kg</span>
          </p>
          <p className="text-[15px] text-ink2">
            {r.ritmo !== null ? `${fmtDelta(r.ritmo)} kg por semana` : "El ritmo aparece con 2 semanas de pesajes"}
          </p>
        </div>
        {r.ritmoObjetivo !== null && (
          <p className="flex items-center gap-1.5 text-[13px] text-ink2">
            {enRitmo === null ? null : enRitmo ? (
              <IconCheck size={14} style={{ color: "var(--good)" }} />
            ) : (
              <IconAlerta size={14} style={{ color: "var(--warn)" }} />
            )}
            Objetivo {fmtDelta(r.ritmoObjetivo)} kg/sem
          </p>
        )}
      </div>
      <GraficoPeso puntos={r.puntos} meta={r.meta} hoy={r.hoy} />
      <FormPesaje ultimoKg={r.ultimoPesaje?.kg ?? null} />
    </Tarjeta>
  );
}

async function MetaTarjeta() {
  const r = await resumenPeso();
  return (
    <Tarjeta etiqueta="Meta" className="flex flex-col gap-3">
      <Etiqueta>Meta</Etiqueta>
      {r.meta ? (
        <>
          <p className="text-[22px] font-semibold tabular-nums">
            {fmtKg(r.meta.pesoMetaKg)} kg <span className="text-[15px] font-normal text-ink2">para {mesAnio(r.meta.fechaMeta)}</span>
          </p>
          {r.avance !== null && (
            <div
              role="progressbar"
              aria-label="Avance hacia la meta"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(r.avance * 100)}
              className="h-2 overflow-hidden rounded bg-track"
            >
              <div className="h-full rounded bg-accent" style={{ width: `${Math.max(3, r.avance * 100)}%` }} />
            </div>
          )}
          <p className="text-[13px] text-ink2">
            Desde {fmtKg(r.meta.pesoInicialKg)} kg ·{" "}
            {r.fechaEstimada ? `a este ritmo llegás en ${mesAnio(r.fechaEstimada)}` : "la fecha estimada aparece cuando haya ritmo"} · proteína{" "}
            {String(r.meta.proteinaGPorKg).replace(".", ",")} g/kg
          </p>
        </>
      ) : (
        <p className="text-[15px] text-ink2">Fijá a qué peso querés llegar y para cuándo: la app calcula el ritmo y ajusta las calorías.</p>
      )}
      <FormMeta meta={r.meta} sinPesajes={r.actual === null} />
    </Tarjeta>
  );
}

async function Composicion() {
  const [ultimo, previo] = await ultimosReportes(2);
  const filas: { nombre: string; clave: "masaMuscularKg" | "grasaPct" | "musculoEsqueleticoKg" | "grasaVisceral"; unidad: string }[] = [
    { nombre: "Masa muscular", clave: "masaMuscularKg", unidad: "kg" },
    { nombre: "Grasa corporal", clave: "grasaPct", unidad: "%" },
    { nombre: "Músculo esquelético", clave: "musculoEsqueleticoKg", unidad: "kg" },
    { nombre: "Grasa visceral", clave: "grasaVisceral", unidad: "" },
  ];
  return (
    <Tarjeta etiqueta="Composición corporal" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <Etiqueta>Composición corporal</Etiqueta>
        {ultimo && <p className="text-[13px] text-ink2">{fechaLarga(ultimo.fecha)}</p>}
      </div>
      {ultimo ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          {filas.map((f) => {
            const v = ultimo[f.clave];
            const p = previo?.[f.clave];
            return (
              <div key={f.clave}>
                <dt className="text-[13px] text-ink2">{f.nombre}</dt>
                <dd className="text-[20px] font-semibold tabular-nums">
                  {v !== null ? fmtKg(v) : "—"} <span className="text-[13px] font-normal text-ink2">{f.unidad}</span>
                  {v !== null && p != null && v !== p && (
                    <span className="ml-1.5 text-[13px] font-normal text-ink2">{fmtDelta(v - p, 1)}</span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : (
        <p className="text-[15px] text-ink2">Todavía no cargaste reportes de la balanza.</p>
      )}
      <Link href="/progreso/balanza" className="flex h-11 items-center justify-center rounded-xl bg-fill text-[15px] font-semibold text-link">
        Cargar reporte
      </Link>
    </Tarjeta>
  );
}

async function Marcas() {
  const marcas = await marcasPersonales();
  return (
    <Tarjeta etiqueta="Marcas personales" className="flex flex-col gap-1">
      <Etiqueta className="pb-1">Marcas personales</Etiqueta>
      {marcas.length === 0 ? (
        <p className="py-1 text-[15px] text-ink2">Aparecen cuando termines tus primeros entrenos.</p>
      ) : (
        <ul>
          {marcas.map((m) => (
            <li key={m.ejercicio} className="flex min-h-11 items-center justify-between gap-3 border-t-[0.5px] border-sep first:border-t-0">
              <span className="text-[15px]">{m.ejercicio}</span>
              <span className="text-[15px] text-ink2 tabular-nums">{m.texto}</span>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}

async function Semana() {
  return <RevisionSemanal r={await revisionSemanal()} />;
}

async function FotosTarjeta() {
  const todas = await listarFotos();
  const ultimas = (["frente", "perfil", "espalda"] as const).map((p) => todas.findLast((f) => f.pose === p)).filter((f) => f !== undefined);
  const ultima = todas.at(-1)?.fecha ?? null;
  return (
    <Tarjeta etiqueta="Fotos" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <Etiqueta>Fotos</Etiqueta>
        {ultima && <p className="text-[13px] text-ink2">Última: {fechaLarga(ultima)}</p>}
      </div>
      {ultimas.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {ultimas.map((f) => (
            <Miniatura key={f.id} foto={f} />
          ))}
        </div>
      ) : (
        <p className="text-[15px] text-ink2">Una foto cada 2 a 4 semanas alcanza para ver el cambio que la balanza no muestra.</p>
      )}
      <SubirFoto deshabilitado={esDemo} />
      {todas.length > 0 && (
        <Link href="/progreso/fotos" className="flex h-11 items-center justify-center rounded-xl text-[15px] font-semibold text-link">
          Ver todas y comparar
        </Link>
      )}
    </Tarjeta>
  );
}

const Cargando = ({ alto }: { alto: string }) => <Tarjeta className={`animate-pulse ${alto}`}>{null}</Tarjeta>;

export default function ProgresoPage() {
  return (
    <>
      <Encabezado titulo="Progreso" />
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:gap-4">
        <div className="flex flex-col gap-3 md:gap-4">
          <Suspense fallback={<Cargando alto="h-96" />}>
            <Peso />
          </Suspense>
          <Suspense fallback={<Cargando alto="h-40" />}>
            <Semana />
          </Suspense>
          <Suspense fallback={<Cargando alto="h-48" />}>
            <Composicion />
          </Suspense>
        </div>
        <div className="flex flex-col gap-3 md:gap-4">
          <Suspense fallback={<Cargando alto="h-40" />}>
            <MetaTarjeta />
          </Suspense>
          <Suspense fallback={<Cargando alto="h-40" />}>
            <FotosTarjeta />
          </Suspense>
          <Suspense fallback={<Cargando alto="h-40" />}>
            <Marcas />
          </Suspense>
        </div>
      </div>
    </>
  );
}
