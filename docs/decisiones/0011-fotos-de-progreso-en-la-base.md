---
numero: 0011
titulo: Fotos de progreso comprimidas en el dispositivo y guardadas en la base
estado: Aceptada
fecha: 2026-11-11
codigo: db/schema.ts, components/progreso/Fotos.tsx, app/acciones/fotos.ts, app/api/fotos/[id]/route.ts
---

# 0011 — Fotos de progreso comprimidas en el dispositivo y guardadas en la base

## Contexto

Las fotos de progreso son el dato más sensible de la app: nunca pueden quedar
en una URL pública. El ADR 0007 preveía Vercel Blob. Pero el volumen es chico:
unas pocas fotos por mes (frente, perfil, espalda), y una foto de celular
reducida a 1600 px en JPEG pesa entre 200 y 600 KB. Las capturas de la balanza
ya no se guardan: el lector las procesa en el dispositivo (ADR 0010).

## Alternativas descartadas

- **Vercel Blob** — suma un servicio, un token y una configuración más, y hay
  que cuidar que ningún archivo quede con acceso público. Para decenas de fotos
  por año no compensa.
- **Guardar la foto original** — 3-5 MB por foto, más que el límite del cuerpo
  de una acción de servidor (1 MB) y sin ninguna ventaja para comparar.

## Decisión

- La foto se **comprime en el dispositivo** antes de subirla: lado mayor de
  1600 px, JPEG con calidad 0,82, bajando hasta que pese menos de 700 KB.
- Se guarda en la tabla `fotos` de Neon, en base64, con fecha y pose.
- Se sirve solo por `/api/fotos/[id]`, que está detrás del login como todo el
  resto (ADR 0008). Respuesta `private`, cacheable en el navegador porque una
  foto nunca cambia.
- Las consultas que listan fotos no traen la columna de la imagen.
- En la demo pública no se pueden subir fotos.

## Consecuencias y límites

- **Límite:** el plan gratuito de Neon tiene 0,5 GB. A ~0,7 MB por foto en
  base64, entran unas 600 fotos: más de 10 años a 3 fotos por mes.
- **Límite:** el respaldo de la base incluye las fotos. Es lo esperable.
- **Revisar si:** se suman videos o fotos frecuentes, o la base pasa de 300 MB.
  Ahí corresponde mover las imágenes a un almacenamiento de archivos privado.
