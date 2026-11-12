---
numero: 0007
titulo: Desplegar en Vercel con Next.js y Postgres en Neon
estado: Propuesta
fecha: 2026-11-10
codigo: —
---

# 0007 — Desplegar en Vercel con Next.js y Postgres en Neon

## Contexto

La app tiene que estar disponible desde el celular en cualquier lugar, con una
URL fija con HTTPS: lo exigen la instalación como web app en el iPhone y el
registro de la dirección de retorno del OAuth de Google (ADR 0002). Guarda datos
de salud de una sola persona: entrenos, comidas, pesajes, datos de la pulsera,
fotos y capturas de la balanza. El volumen es chico y el uso es personal y no
comercial.

## Alternativas descartadas

- **Supabase** (base, login y archivos en uno) — en el plan gratuito el proyecto
  se pausa tras una semana sin uso, y suma otro panel que administrar.
- **Cloudflare (Workers, D1, R2)** — gratis y capaz, pero es otro ecosistema sin
  ganancia concreta para este caso.
- **Servidor propio o la compu local** — no es accesible desde el celular fuera
  de casa sin exponer la red.

## Decisión

- **Next.js en Vercel**, plan Hobby (gratuito, uso personal no comercial).
- **Postgres en Neon**, conectado desde Vercel. Plan gratuito.
- **Archivos privados** (fotos de progreso, capturas de la balanza) en Vercel
  Blob, sin URLs públicas. *Actualizado: las fotos van en la base
  ([ADR 0011](0011-fotos-de-progreso-en-la-base.md)) y las capturas no se
  guardan ([ADR 0010](0010-lector-de-reportes-con-ocr-en-el-dispositivo.md)).*
- **Login de un solo usuario** con cookie de sesión firmada y middleware, sin
  proveedor de identidad externo.
- **Sincronización con la Google Health API:** al abrir la app y con un respaldo
  diario programado (el plan Hobby permite tareas programadas de frecuencia
  diaria). Los avisos automáticos (webhooks) de Google quedan para más adelante.
- **Dos proyectos de Vercel desde el mismo código:** la app real, detrás del
  login, y una demo pública con datos sintéticos para el portfolio (ADR 0006),
  que nunca lee la base real.

## Consecuencias y límites

- **Límite:** los límites del plan gratuito de Vercel y de Neon pueden cambiar;
  con el volumen de una persona hay margen amplio.
- **Límite:** la tarea programada es diaria como máximo en el plan Hobby; los
  datos del día dependen de abrir la app.
- **Límite:** el repo está en OneDrive; en desarrollo hay que usar el cache de
  webpack en memoria (ver CLAUDE.md).
- **Límite:** la URL de producción hay que agregarla como dirección de retorno
  autorizada en el cliente OAuth de Google.
- **Revisar si:** la app pasa a tener más usuarios o uso comercial (el plan
  Hobby no lo cubre), o el respaldo diario resulta insuficiente.
