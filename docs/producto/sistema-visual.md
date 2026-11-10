# Sistema visual

Inspirado en el ecosistema de Apple: tipografía del sistema, mucho aire,
tarjetas sobre fondo agrupado y un solo acento. Los valores viven como
variables CSS en [app/globals.css](../../app/globals.css) y se usan desde
Tailwind (`bg-card`, `text-ink2`, `bg-accent`…).

## Color

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `accent` / `move` | `#E8590C` | `#EE6316` | Acciones principales y entreno. Texto encima: `#111111` |
| `prot` | `#1C7ED6` | `#339AF0` | Proteína |
| `kcal` | `#2F9E44` | `#2FA84A` | Calorías |
| `sleep` | `#6741D9` | `#9775FA` | Sueño |
| `bg` | `#F2F2F7` | `#000000` | Fondo |
| `card` | `#FFFFFF` | `#1C1C1E` | Tarjetas |
| `ink` | `#1C1C1E` | `#F5F5F7` | Texto |
| `ink2` | `#6C6C70` | `#A1A1A6` | Texto secundario (≥ 4,5:1 sobre `bg` y `card`) |
| `warn` / `good` | `#B35C00` / `#2B8A3E` | `#FFA94D` / `#51CF66` | Estados, siempre con ícono y texto |

- **Calorías, proteína y entreno** están validados como paleta categórica
  (separación para daltonismo, banda de luminosidad y contraste ≥ 3:1) en los
  dos modos. Si se cambia uno, hay que volver a validar los tres.
- **El texto nunca va en el color de la serie:** la identidad la lleva una
  marca de color al lado (`<Marca>`).
- **Modo oscuro:** sigue al sistema (`prefers-color-scheme`). Es una paleta
  propia, no una inversión automática.

## Tipografía

SF Pro en dispositivos Apple (fuente del sistema) e Inter en el resto.

| Rol | Tamaño / peso |
|---|---|
| Título grande | 34 / 700 |
| Título de tarjeta | 22 / 600 |
| Cuerpo, valores, botones | 17 / 400–600 |
| Secundario | 15 / 400 |
| Etiqueta de sección | 13 / 600, mayúsculas |

Los números usan cifras tabulares (`tabular-nums`).

## Forma y espacio

- Radios: tarjeta 20, botón 14, campo 12, chip 12.
- Espaciado en múltiplos de 4.
- Áreas táctiles de 44 px como mínimo.

## Navegación

- **Celular:** barra de pestañas abajo, translúcida.
- **Escritorio (≥ 768 px):** barra lateral fija con las mismas secciones.
