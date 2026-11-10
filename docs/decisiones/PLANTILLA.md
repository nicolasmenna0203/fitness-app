---
numero: NNNN
titulo: Título en presente ("Importar datos de Fitbit con Takeout")
estado: Aceptada          # Propuesta | Aceptada | Reemplazada por NNNN | Revertida
fecha: YYYY-MM-DD
codigo: —                 # archivos que materializan la decisión (cuando existan)
---

# NNNN — Título

## Contexto

Qué había que resolver y qué restricciones eran reales: datos que no existen,
APIs que no publican lo necesario, límites de la plataforma. 2-6 frases. Sin
narrar el proceso: solo el estado del mundo que forzó la decisión.

## Alternativas descartadas

Una línea por alternativa evaluada, con el motivo concreto del descarte. Si no
hay ninguna, probablemente esto no sea un ADR sino documentación de producto,
que va en `docs/producto/`.

- **Nombre** — qué ofrecía y por qué no alcanzó.

## Decisión

Qué se hizo. Si hay constantes, fórmulas o umbrales, van acá con su origen
explícito: dato oficial, convención del área, estimado o arbitrario.

## Consecuencias y límites

Lo que esta decisión hace cierto, sobre todo lo incómodo.

- **Límite:** ...
- **Revisar si:** condición observable que invalidaría la decisión.

---

## Cómo usar esta plantilla

1. Leer el número en `Próximo número` del [índice](README.md).
2. Copiar este archivo a `NNNN-slug-en-espanol.md`. El slug describe la
   **decisión**, no un archivo.
3. Llenarlo, agregar la fila al índice e incrementar `Próximo número`.
4. Cuando haya código, agregar al tope de cada archivo listado en `codigo:` el
   comentario `// Decisión y alternativas descartadas: docs/decisiones/NNNN-....md`.

**`Propuesta`** es una decisión tomada antes de que exista el código: pasa a
`Aceptada` cuando se implementa y se confirma.

**Los ADRs no se editan cuando cambiás de opinión.** Se escribe uno nuevo, el
viejo pasa a `estado: Reemplazada por NNNN` y su fila se mueve a "Reemplazadas"
en el índice.

**Recordá que el repo se publica.** Nada de pesos, medidas, valores de la
balanza ni metas personales con cifras. La regla completa está en
[CLAUDE.md](../../CLAUDE.md).
