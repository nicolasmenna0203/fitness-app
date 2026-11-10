# Decisiones técnicas

Por qué el producto y el código son así. Cada archivo documenta una decisión,
con las alternativas que se evaluaron y descartaron, y los límites que arrastra.

Antes de cambiar una fuente de datos, un criterio de entrenamiento o la lógica
de calorías: buscá el ADR acá. Ver [PLANTILLA.md](PLANTILLA.md) para el flujo.

**Próximo número: 0007**

## Plataforma y repo

| # | Decisión | Estado |
|---|---|---|
| [0001](0001-web-app-instalable-primero.md) | Web app instalable primero; app nativa solo si hace falta Apple Health | Propuesta |
| [0006](0006-repo-privado-y-espejo-publico.md) | Repo privado como fuente de verdad y espejo público sin datos personales | Aceptada |

## Datos

| # | Decisión | Estado |
|---|---|---|
| [0002](0002-fitbit-via-google-health-api-y-takeout.md) | Fitbit vía Google Health API como app personal sin verificar; Takeout para historial | Propuesta |
| [0003](0003-reporte-de-balanza-por-captura.md) | Reporte de la balanza cargado por captura, con extracción automática | Propuesta |

## Entrenamiento y nutrición

| # | Decisión | Estado |
|---|---|---|
| [0004](0004-entrenos-por-rotacion-sin-calendario.md) | Entrenos por rotación, sin calendario fijo | Propuesta |
| [0005](0005-calorias-adaptativas-por-tendencia-de-peso.md) | Calorías que se ajustan cada semana según la tendencia del peso | Propuesta |

## Reemplazadas

Ninguna todavía.
