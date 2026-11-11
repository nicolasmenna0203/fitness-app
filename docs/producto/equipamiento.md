# Equipamiento

La app modela el equipamiento como un catálogo: qué hay, qué ejercicios permite
y hasta cuánta carga da. Así puede sugerir un cambio de ejercicio cuando un
equipo llega a su tope.

Es una **guía, no un inventario exacto**: cada ejercicio trae un peso de
referencia para la primera vez y saltos aproximados (5 kg en la pila, ~2 kg por
mano en mancuernas). Se usa lo más cercano que se pueda armar y la progresión
sigue a partir de lo que se registró. El catálogo está en
`lib/entrenos/catalogo.ts` y se ve en Datos.

## Equipamiento de referencia

| Equipo | Notas para el modelo |
|---|---|
| Multigym con pila de pesas (Olmo Fit 90) | 45 kg de pesas, máx. 115 kg de usuario. Saltos de ~5 kg |
| Banco multiposición | Plano, inclinado, declinado |
| Mancuernas y discos | Pesos variados; saltos de ~2 kg por mano, sin tope conocido |
| Barra de dominadas | Peso corporal; progresión por repeticiones y negativas |
| Espacio al aire libre | Cardio, sprints, partidos |

Sin bandas ni lastre: al tope de un ejercicio de peso corporal, la app sugiere
una variante más difícil (más lenta, con pausa).

### Estaciones de la multigym

Press de pecho, polea alta (jalón), polea baja (remo, curl, tríceps),
extensión de cuádriceps y curl femoral.

## Límite que define la programación

Una pila de 45 kg alcanza para el tren superior por bastante tiempo, pero queda
corta pronto para piernas. Las piernas se trabajan sobre todo con mancuernas y
discos (sentadilla goblet, peso muerto rumano, búlgaras, hip thrust en el banco)
y la multigym queda como complemento. Ver
[ADR 0004](../decisiones/0004-entrenos-por-rotacion-sin-calendario.md).
