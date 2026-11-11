"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { sincronizarAlAbrir } from "@/app/acciones/google";

/**
 * Al abrir la app pide datos nuevos a Google (si pasaron 15 min desde la última
 * vez) y hace el ajuste semanal de calorías si toca; si cambió algo, refresca
 * la pantalla. No muestra nada (ADR 0005, 0007).
 */
export function SincronizarAlAbrir() {
  const router = useRouter();
  useEffect(() => {
    let vigente = true;
    sincronizarAlAbrir()
      .then((r) => {
        if (vigente && r.cambio) router.refresh();
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [router]);
  return null;
}
