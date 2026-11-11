---
numero: 0010
titulo: Leer los reportes de la balanza con OCR en el dispositivo, por posición
estado: Aceptada
fecha: 2026-11-10
codigo: lib/balanza/lector.ts, components/progreso/LectorReporte.tsx, scripts/leer-reporte.mjs
---

# 0010 — Leer los reportes de la balanza con OCR en el dispositivo, por posición

Reemplaza al [ADR 0003](0003-reporte-de-balanza-por-captura.md), que proponía
extraer los valores con un modelo de IA con visión.

## Contexto

Los reportes llegan como captura de pantalla de la app de la balanza, como PDF
o como texto exportado. Se cargan cada pocas semanas y tienen más de 20 campos.
Se pidió un lector que acepte varios formatos sin depender de un servicio pago.
El reporte de Huawei Health son tarjetas en dos columnas con el valor **arriba**
del nombre: leído como texto de corrido, el OCR mezcla las columnas. Una captura
reenviada por WhatsApp queda en unos 220 px de ancho y pierde legibilidad.

## Alternativas descartadas

- **Modelo de IA con visión (ADR 0003)** — lee bien cualquier diseño, pero
  necesita una API key paga y manda la imagen de un dato de salud a un tercero.
  Queda como mejora opcional si el OCR no alcanza.
- **OCR en el servidor** — Tesseract en una función de Vercel descarga los datos
  de idioma en cada arranque en frío (lento) y obliga a subir la imagen.
- **Leer el texto de corrido** — con dos columnas, el valor de una tarjeta se
  asigna al nombre de la de al lado.
- **Carga manual campo por campo** — 20+ valores por reporte; queda como
  respaldo en el mismo formulario.

## Decisión

- **OCR en el navegador** con Tesseract.js (idioma español, modo de texto
  disperso). El archivo no sale del dispositivo.
- **Por posición:** para cada nombre de campo se toma el número que está
  encima y en la misma columna; si no hay, a la derecha en la misma línea; si
  no, debajo. Los nombres se reconocen por similitud (Levenshtein ≥ 0,72), los
  más largos primero, para que "masa muscular" no le gane a "masa muscular
  esquelética".
- **Números con la unidad mal leída** ("41,6kg" → "41,610"): se recortan a los
  decimales del campo y, si quedan fuera de rango, se prueba sin la cola.
- **Controles cruzados:** peso = peso sin grasa + grasa; % de grasa = grasa ÷
  peso. El "Peso estándar" de las sugerencias no cuenta como peso.
- **Imágenes chicas:** se agrandan hasta 1000 px de ancho (sin pasar el límite
  de píxeles de un canvas en iOS) y se pasan a escala de grises antes del OCR.
- **PDF:** se usa su texto con posiciones (pdf.js); si es escaneado, se dibuja
  la página y se pasa por OCR. **Texto y CSV:** lectura línea por línea.
- **Siempre se revisa** lo leído en un formulario antes de guardar.
- El mismo lector se usa desde la terminal: `npm run leer-reporte -- <archivo>`.

## Consecuencias y límites

- **Límite:** con capturas comprimidas (WhatsApp) se leen pocos campos; la app
  lo avisa y pide la captura original.
- **Límite:** depende del diseño del reporte de Huawei; otra balanza o un cambio
  de diseño puede necesitar nuevos nombres en `CAMPOS_REPORTE`.
- **Límite:** la primera lectura descarga los datos del idioma (unos MB) desde
  un CDN; después quedan en caché del navegador.
- **Revisar si:** con capturas originales se leen menos de la mitad de los
  campos principales; ahí conviene sumar el modelo con visión como opción.
