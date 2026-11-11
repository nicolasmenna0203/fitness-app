---
numero: 0004
titulo: Entrenos por rotación, sin calendario fijo
estado: Aceptada
fecha: 2026-11-10
codigo: lib/entrenos/progresion.ts, lib/datos/entrenos.ts, app/acciones/entrenos.ts, components/entrenar/, scripts/semilla-entrenos.mjs
---

# 0004 — Entrenos por rotación, sin calendario fijo

## Contexto

El entreno es en casa, alrededor de 3 veces por semana, sumado a deportes
(fútbol, pádel) que caen en días distintos cada semana. Un plan con días fijos
se rompe la primera semana que no encaja. Para un principiante, lo que más
importa es la constancia y la progresión de carga en pocos ejercicios básicos.
El equipamiento tiene topes: la pila de la multigym es de 45 kg.

## Alternativas descartadas

- **Plan con días fijos de la semana** — no tolera la variación de agenda; un
  día perdido desarma la semana.
- **Divisiones por grupo muscular (5-6 días)** — más frecuencia de la que el
  tiempo disponible sostiene, y menos eficiente para un principiante.
- **Generación libre de rutinas por IA** — poco predecible; la progresión
  necesita repetir los mismos ejercicios para medir avance.

## Decisión

- **Cuerpo completo en rotación** de 2 o 3 entrenos (A/B o A/B/C). La app
  muestra siempre "el próximo"; no hay días asignados.
- **Meta semanal blanda:** ~3 entrenos, sin importar qué días.
- **Adaptación:** si se registró un partido o un esfuerzo alto (o hubo poco
  sueño), la app sugiere descansar o una versión más liviana al día siguiente.
  Sugerencia, nunca bloqueo.
- **Progresión doble:** cada ejercicio tiene un rango de repeticiones; cuando
  se completan todas las series en el tope del rango, se sugiere subir la carga
  al siguiente escalón disponible. Es la convención estándar para
  principiantes, y tolera saltos de carga grandes como los de una pila de pesas.
- **Tope de equipamiento:** cuando un ejercicio llega a la carga máxima del
  equipo, se sugiere una variante más difícil (unilateral, más repeticiones,
  tempo, pausa).

### Cómo quedó implementado

- **Rotación inicial:** "Cuerpo completo A" y "B", 6 ejercicios de 3 series
  cada uno, cargados por `scripts/semilla-entrenos.mjs`. Las piernas van sobre
  todo con mancuernas; la multigym, para empuje, tirón y accesorios.
- **Saltos de carga (supuestos, a ajustar con el equipo real):** 5 kg en la
  pila de la multigym, con tope de 45 kg; 2 kg por mano en mancuernas, sin tope.
  Por tiempo (plancha) se suman 5 s por sesión.
- **Precarga de cada serie:** el peso de la serie anterior de hoy (o el
  sugerido) y como objetivo una repetición más que la misma serie de la última
  sesión, dentro del rango. Confirmar es un toque.
- **Primera vez de un ejercicio:** no se inventa un peso; se pide elegirlo.
- **Versión liviana:** se sugiere si ayer hubo una actividad de 40 min o más
  que no sea caminar, yoga o elongación, o si la recuperación está baja.
- **Meta semanal:** 3 entrenos en los últimos 7 días (ventana móvil, no semana
  calendario).

## Consecuencias y límites

- **Límite:** sin calendario no hay "periodización" formal; para un principiante
  no hace falta, más adelante sí puede.
- **Límite:** la sugerencia por recuperación depende de datos con atraso (ADR
  0002) o de un check-in manual.
- **Revisar si:** la progresión se estanca en la mayoría de los ejercicios por
  más de 3-4 semanas (señal de pasar a un esquema intermedio).
