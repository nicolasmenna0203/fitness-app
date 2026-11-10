---
numero: 0003
titulo: Reporte de la balanza cargado por captura, con extracción automática
estado: Propuesta
fecha: 2026-11-10
codigo: —
---

# 0003 — Reporte de la balanza cargado por captura, con extracción automática

## Contexto

La balanza de composición corporal guarda sus mediciones en su propia app, sin
API pública para terceros. En iPhone puede pasar algunos valores a Apple Health,
pero la web no lo lee (ADR 0001). El reporte que muestra la app tiene más de
20 campos ([datos.md](../producto/datos.md)): cargarlos a mano es lento y
propenso a errores, y la medición se hace cada pocas semanas.

## Alternativas descartadas

- **Carga manual campo por campo** — 20+ valores por reporte: se abandona.
- **Solo peso y % de grasa a mano** — rápido, pero pierde masa muscular y
  esquelética, que es justamente lo que importa en un aumento de peso.
- **Exportación de datos de la marca** — existe como pedido de datos
  personales, con demora de días: sirve una vez, no como flujo habitual.

## Decisión

Subir la captura del reporte: un modelo con visión extrae los campos a un JSON
con esquema fijo, la app muestra los valores para revisar y se guardan con un
toque. La carga manual queda como alternativa. El proveedor del modelo se elige
en la etapa de stack.

## Consecuencias y límites

- **Límite:** depende del diseño de pantalla de la app de la balanza; si cambia,
  hay que revisar la extracción. La revisión humana antes de guardar es
  obligatoria, no opcional.
- **Límite:** la captura sale del dispositivo hacia el proveedor del modelo; se
  procesa y no se guarda fuera del almacenamiento de la app.
- **Límite:** los valores de bioimpedancia son estimaciones; la app los muestra
  como tendencia.
- **Revisar si:** la marca publica una API, o aparece una forma de leer la
  balanza directamente.
