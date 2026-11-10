---
numero: 0002
titulo: Fitbit vía Google Health API en modo personal; Takeout para historial
estado: Propuesta
fecha: 2026-11-10
codigo: —
---

# 0002 — Fitbit vía Google Health API en modo personal; Takeout para historial

## Contexto

La API web de Fitbit se apagó en noviembre de 2026. La reemplaza la Google
Health API (`health.googleapis.com/v4`), con OAuth de Google y cobertura de
todos los dispositivos Fitbit. Todos sus permisos son **restringidos**: para
una app abierta al público, Google exige una revisión de seguridad. Una app en
**modo prueba**, usada solo por cuentas agregadas como testers, funciona sin
esa revisión, pero Google vence su sesión (refresh token) **cada 7 días**.

Google Takeout exporta los mismos datos en un archivo, sin OAuth ni revisión,
pero de forma manual y con una espera de minutos a horas.

## Alternativas descartadas

- **Solo Takeout** — sirve para el historial, pero tener los datos de la semana
  exige exportar, esperar, descargar e importar cada vez. Es más fricción que
  volver a iniciar sesión una vez por semana.
- **App verificada por Google** — elimina el vencimiento semanal, pero la
  revisión de seguridad no se justifica para una app de uso personal.
- **Apple Health como intermediario** — una web app no puede leerlo (ADR 0001).
- **Agregadores de terceros** — agregan un servicio pago y otro lugar por donde
  pasan datos de salud.

## Decisión

- **Sincronización diaria:** Google Health API con la app en modo prueba y una
  sola cuenta como tester. Cuando la sesión vence, la app lo muestra y
  reconectar es un toque.
- **Historial y respaldo:** importación de un ZIP de Takeout, para traer todo
  lo anterior de una vez o cubrir períodos sin sincronización.
- Las dos vías escriben en el mismo modelo de datos; un dato que llega por las
  dos se deduplica por fecha y tipo.

## Consecuencias y límites

- **Límite:** reconexión manual cada 7 días mientras la app siga en modo prueba.
- **Límite:** los datos tienen el atraso de la sincronización pulsera → celular
  → nube.
- **Límite:** el formato de Takeout no está documentado como contrato; hay que
  verificarlo con una exportación real y puede cambiar.
- **Revisar si:** Google cambia la política de vencimiento en modo prueba, o
  aparece una vía oficial de acceso personal sin revisión.
