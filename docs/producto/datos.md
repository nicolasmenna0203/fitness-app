# Fuentes de datos

## Pulsera Fitbit (vía Google)

La API web de Fitbit se dio de baja en noviembre de 2026. Su reemplazo es la
**Google Health API** (`health.googleapis.com/v4`), con OAuth de Google. Cubre
todos los dispositivos Fitbit y no publica precios. Configuración paso a paso en
[la guía](../guias/google-health-api.md). Detalle de la estrategia en
[ADR 0002](../decisiones/0002-fitbit-via-google-health-api-y-takeout.md).

Datos que interesan:

| Dato | Para qué se usa |
|---|---|
| Sueño (duración, fases) | Recuperación, sugerencia de intensidad |
| FC en reposo, variabilidad de FC | Recuperación |
| Pasos, minutos activos | Gasto diario |
| Calorías gastadas | Estimación inicial del gasto |
| Actividades (fútbol, pádel, cardio) | Historial y calorías extra del día |

Los datos llegan con atraso: la pulsera sincroniza con la app del celular y de
ahí a la nube.

## Balanza de composición corporal

Balanza por bioimpedancia con app propia, sin API pública. En iPhone puede
pasar algunos datos a Apple Health, pero una web app no puede leer Apple
Health. La carga es por **captura del reporte**
([ADR 0003](../decisiones/0003-reporte-de-balanza-por-captura.md)).

Campos que trae el reporte:

| Campo | Unidad |
|---|---|
| Peso | kg |
| Puntuación corporal | puntos |
| IMC | — |
| Porcentaje de grasa corporal | % |
| Grasa corporal | kg |
| Masa de agua corporal | kg |
| Porcentaje de agua | % |
| Masa muscular | kg |
| Porcentaje de músculo | % |
| Masa muscular esquelética | kg |
| Masa proteica | kg |
| Porcentaje de proteínas | % |
| Contenido mineral óseo | kg |
| Porcentaje mineral óseo | % |
| Grasa visceral | índice |
| Metabolismo basal | kcal |
| Relación cintura-cadera | — |
| Edad corporal | años |
| Peso corporal sin grasa | kg |
| Frecuencia cardíaca | lpm |
| Tipo de cuerpo | categoría |
| Sugerencias (peso estándar, control de peso, grasa y músculo) | kg / texto |

**Límite de la bioimpedancia:** los valores absolutos son estimaciones y varían
con la hidratación. Sirven las tendencias medidas en condiciones parecidas
(misma hora, en ayunas). La app muestra tendencias, no celebra ni alarma por un
reporte suelto.

## Carga manual

Último recurso para todo lo anterior, y vía principal para comidas, series y
el check-in diario de sueño y energía.
