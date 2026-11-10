# Fitness App

App web personal (celular + escritorio, instalable) para un gimnasio en casa:
entrenos, nutrición simple, composición corporal y datos de una pulsera Fitbit.
UI inspirada en el ecosistema de Apple. Stack previsto: Next.js en Vercel,
Postgres en Neon, datos de la pulsera vía Google Health API (ADR 0002, 0007).
Estado: planificación, sin código de la app todavía. Se avanza por etapas: relevamiento → datos → secciones → sistema de
diseño → wireframes → mockups → código.

## El código se publica

Se desarrolla en un repo privado y se publica un espejo público que sirve de
portfolio (ADR 0006): todo archivo versionado y todo mensaje de commit es
público. No escribas en ningún archivo versionado:

- Datos corporales reales: peso, medidas, valores de la balanza, metas
  personales con cifras, fotos.
- Datos identificatorios: nombres, mails, rutas absolutas con el usuario.
- Contenido de exportaciones reales (Takeout, reportes de balanza).

Todo eso va en `privado/` (ignorada por git). El perfil personal está en
`privado/PERFIL.md`: leelo para tener contexto, pero no copies sus cifras a la
documentación, a los tests ni a la demo.

Los fixtures y la demo usan **datos sintéticos** con el mismo formato que los
reales. Si hace falta un fixture a partir de un archivo real, anonimizalo antes.

Sí va, porque es producto e ingeniería: fuentes de datos y sus límites,
fórmulas, criterios de entrenamiento y nutrición en general, equipamiento como
catálogo.

## Cómo trabajar

- **Flexible, no rígido.** Ni el producto ni la planificación se atan a
  calendarios o estructuras fijas: la app sugiere y se adapta (ADR 0004).
- **Pocos toques.** Registrar una serie o una comida tiene que costar 1-2 toques.
  Si un flujo pide más, revisarlo.
- **Idioma:** español rioplatense en la UI, la documentación y los commits.
- **Commits:** `tipo: descripción` (feat, fix, refactor, chore, docs, test).

## Decisiones

Están en [docs/decisiones/](docs/decisiones/README.md). Antes de cambiar una
fuente de datos, un criterio de progresión o la lógica de calorías, leé el ADR.
Cuando tomemos una decisión con alternativas descartadas, ofrecé escribir el
ADR antes de cerrar el tema.

## Entorno

El repo vive en una carpeta sincronizada por OneDrive. Si se usa Next.js, el
cache de webpack en disco se corrompe por la sincronización: usar cache en
memoria en desarrollo.
