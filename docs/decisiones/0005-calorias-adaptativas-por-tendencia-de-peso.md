---
numero: 0005
titulo: Calorías que se ajustan cada semana según la tendencia del peso
estado: Aceptada
fecha: 2026-11-10
codigo: lib/calorias.ts, lib/peso.ts, lib/datos/comer.ts, app/acciones/comer.ts
---

# 0005 — Calorías que se ajustan cada semana según la tendencia del peso

## Contexto

Para subir de peso con mayoría de músculo hace falta un superávit chico y
sostenido. El gasto diario real no se conoce: las fórmulas y las pulseras lo
estiman con errores de varios cientos de kcal, y cambia con el peso, la
actividad y los deportes. El peso diario fluctúa 1-2 kg por agua y comida, así
que un día suelto no sirve para decidir nada.

## Alternativas descartadas

- **Meta fija calculada con una fórmula** — el error de la fórmula se arrastra
  para siempre; si el peso no sube, nadie ajusta.
- **Calorías gastadas de la pulsera como verdad** — útiles como punto de
  partida, pero con sesgo propio según la persona y el tipo de actividad.
- **Ajuste por el peso de cada día** — reacciona al ruido del agua, no a la
  tendencia.

## Decisión

1. **Ritmo objetivo** derivado de la meta (peso objetivo y fecha), con tope de
   **0,5 % del peso corporal por semana**. Es la convención habitual para un
   aumento de peso que no sea mayormente grasa.
2. **Peso de tendencia:** media móvil exponencial de los pesajes (suavizado
   tipo α ≈ 0,1 por día; arbitrario, a calibrar).
3. **Estimación inicial del gasto:** metabolismo basal (de la balanza, o de la
   fórmula de Mifflin-St Jeor si no hay) por un factor de actividad, contrastado
   con las calorías de la pulsera.
4. **Ajuste semanal:** gasto estimado = consumo promedio − (cambio de la
   tendencia × 7700 kcal/kg) / días. Meta nueva = gasto estimado + superávit
   necesario para el ritmo objetivo. Cambios de ±150 kcal como máximo por semana.
5. **Días con deporte:** las calorías de la actividad registrada se suman a la
   meta de ese día.
6. **Proteína:** meta fija de 1,6-2,2 g por kg de peso corporal (rango estándar
   en la literatura para ganar músculo).

### Cómo quedó implementado

- **Tendencia:** media móvil exponencial con α = 0,1 por día; con días sin
  pesar, el peso del intervalo es 1 − (1 − α)^días (`lib/peso.ts`).
- **Ritmo objetivo:** lo que falta hasta la meta dividido las semanas que
  quedan, con el tope de 0,5 % del peso por semana.
- **Meta inicial:** gasto = (basal + calorías activas promedio de la pulsera)
  ÷ 0,9 (efecto térmico de la comida ≈ 10 %). Sin balanza, basal ≈ 22 kcal por
  kg; sin pulsera, actividad ≈ 30 % del basal. Estimaciones gruesas que el
  primer ajuste corrige.
- **Ajuste semanal:** cada 7 días desde la última meta, con los 7 días previos.
  Necesita comidas registradas en al menos 5 días y pesajes para la tendencia;
  si falta algo, la meta sigue igual y se explica por qué. Corre al abrir la
  app y en el cron diario; cada meta queda guardada con su motivo
  (`metas_calorias`).
- **Días con deporte:** se suman las calorías de actividades de 40 min o más
  que no sean caminar, yoga o elongación. No se duplica con el promedio de
  actividad: el ajuste semanal calibra con lo que realmente se comió.
- **Proteína:** el valor por kg del perfil (por defecto 1,8 g/kg) × la
  tendencia del peso.

## Consecuencias y límites

- **Límite:** 7700 kcal/kg es una aproximación de la densidad energética del
  tejido graso; el tejido magro tiene otra. Como se recalibra cada semana contra
  el peso real, el error no se acumula.
- **Límite:** necesita pesajes frecuentes (idealmente diarios) y registro de
  comida razonablemente completo; con datos faltantes, la app no ajusta esa
  semana y lo dice.
- **Límite:** las primeras 2 semanas son de calibración: el ajuste se activa
  cuando hay suficientes datos.
- **Revisar si:** la tendencia y el ritmo objetivo divergen más de 3 semanas
  seguidas pese a los ajustes.
