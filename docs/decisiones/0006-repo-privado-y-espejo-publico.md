---
numero: 0006
titulo: Repo privado como fuente de verdad y espejo público sin datos personales
estado: Aceptada
fecha: 2026-11-10
codigo: .gitignore, CLAUDE.md
---

# 0006 — Repo privado como fuente de verdad y espejo público sin datos personales

## Contexto

El proyecto sirve como portfolio, así que tiene que ser público. Pero trabaja
con datos de salud: peso, composición corporal, sueño, frecuencia cardíaca y
fotos. Un dato que entra en un commit queda en la historia aunque el commit
siguiente lo borre.

## Alternativas descartadas

- **Un solo repo público** — cualquier descuido (un reporte, un fixture con
  valores reales) queda publicado sin vuelta atrás.
- **Un solo repo privado** — no sirve como portfolio.

## Decisión

- **Dos repos:** `fitness-app-privado` (fuente de verdad) y `fitness-app`
  (espejo público).
- **Los datos personales nunca se versionan**, ni en el privado: viven en la
  carpeta local `privado/` (en `.gitignore`), igual que las exportaciones y
  las credenciales.
- **Autor de los commits:** el mail noreply de GitHub, para no publicar el mail
  personal.
- **Mientras nada privado esté versionado, el espejo recibe la misma historia
  que el privado.** Cuando aparezca contenido que solo deba estar en el privado,
  se agrega un script de publicación que escanee cada commit (términos
  prohibidos, mails, rutas de usuario) antes de pasarlo al espejo.
- **Demo pública con datos sintéticos** cuando exista la app.

## Consecuencias y límites

- **Límite:** la protección depende de la disciplina con `privado/` hasta que
  exista el escaneo automático.
- **Revisar si:** se versiona algo que no deba ser público; en ese momento el
  espejo deja de ser una copia directa y hace falta el script.
