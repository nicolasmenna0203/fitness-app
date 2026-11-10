---
numero: 0002
titulo: Fitbit vía Google Health API como app personal sin verificar; Takeout para historial
estado: Propuesta
fecha: 2026-11-10
codigo: lib/google/, app/api/google/, app/api/cron/sync/route.ts, scripts/probar-google-health.mjs
---

# 0002 — Fitbit vía Google Health API como app personal sin verificar; Takeout para historial

## Contexto

La API web de Fitbit se apagó el 2 de noviembre de 2026. La reemplaza la
Google Health API (`health.googleapis.com/v4`), con OAuth de Google y cobertura
de todos los dispositivos Fitbit. No publica precios: se usa desde un proyecto
de Google Cloud, con un límite de 300 consultas por minuto por usuario, que una
app personal no se acerca a usar.

Todos sus permisos son **restringidos**: para más de 100 usuarios, Google exige
una auditoría de seguridad anual (CASA). Por debajo de eso:

- En publicación **"Testing"**, la sesión (refresh token) **vence a los 7 días**.
- En **"In production"**, la sesión no vence salvo que se revoque o pasen unos
  6 meses sin uso.
- Google exceptúa de la verificación a las **apps de uso personal** con menos
  de 100 usuarios, que aceptan el aviso de "app no verificada" al iniciar
  sesión.

Lo que la documentación no dice explícitamente es si esa excepción alcanza a
los permisos restringidos de esta API. El script de prueba lo resuelve.

Google Takeout exporta los mismos datos en un archivo, sin OAuth, pero de forma
manual y con una espera de minutos a horas.

## Alternativas descartadas

- **Solo Takeout** — sirve para el historial, pero tener los datos de la semana
  exige exportar, esperar, descargar e importar cada vez.
- **App verificada por Google** — la auditoría anual no se justifica para una
  app de un solo usuario.
- **Apple Health como intermediario** — una web app no puede leerlo (ADR 0001).
- **Agregadores de terceros** — suman un servicio pago y otro lugar por donde
  pasan datos de salud.

## Decisión

- **Sincronización diaria:** Google Health API con la app publicada como
  **"In production" sin verificar**, amparada en la excepción de uso personal.
  Permisos de solo lectura: actividad, métricas de salud y sueño.
- **Plan B:** si Google no permite publicar sin verificar, la app queda en
  "Testing" con una sola cuenta de prueba, y reconectar cada 7 días es un toque
  avisado por la app.
- **Historial y respaldo:** importación de un ZIP de Takeout, para traer lo
  anterior de una vez o cubrir períodos sin sincronización.
- Las dos vías escriben en el mismo modelo de datos; lo que llega por las dos
  se deduplica por tipo y fecha.
- Pasa a `Aceptada` cuando `scripts/probar-google-health.mjs` confirme el
  acceso en producción y que la sesión sigue viva pasados 7 días.

## Consecuencias y límites

- **Límite:** depende de que Google mantenga la excepción de uso personal.
- **Límite:** los datos tienen el atraso de la sincronización pulsera → celular
  → nube.
- **Límite:** la cuenta tiene que estar vinculada a la app Google Health; sin
  eso la API responde `ACCOUNT_NOT_LINKED`.
- **Límite:** el formato de Takeout no es un contrato documentado; hay que
  verificarlo con una exportación real.
- **Revisar si:** Google cambia la política para apps sin verificar, o la app
  pasa a tener más de un usuario.
