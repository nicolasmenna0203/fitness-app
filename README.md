# Fitness App

App web personal para entrenar en un gimnasio en casa y seguir el progreso
corporal: rutinas y registro de entrenos, nutrición simple, composición corporal
y datos de una pulsera de actividad, todo en un solo lugar. Funciona en el
celular y en la compu, con una interfaz inspirada en el ecosistema de Apple.

> **Estado:** primeras pantallas. La pantalla **Hoy** y la navegación están
> construidas con datos sintéticos; faltan la base de datos, el login y la
> sincronización con Google.

## Qué resuelve

Las apps de gimnasio asumen un gimnasio comercial y un calendario fijo. Esta
parte de lo contrario:

- **Equipamiento real de casa:** una multigym con pesas limitadas, banco,
  mancuernas, barra de dominadas, bandas y espacio al aire libre. La app sabe
  qué hay y hasta cuánto da cada cosa.
- **Sin calendario rígido:** muestra el próximo entreno y se adapta a lo que
  pasó (un partido, un día salteado), en vez de exigir días fijos.
- **Una meta de peso con ritmo sano:** las calorías se ajustan solas según la
  tendencia real del peso, no según una fórmula fija.
- **Los datos que ya existen:** pulsera Fitbit (vía Google) y balanza de
  composición corporal, sin tener que cargar todo a mano.

## Funcionalidades (primera versión)

| Sección | Qué hace |
|---|---|
| **Hoy** | Próximo entreno, proteína y calorías del día, sueño y recuperación, avance hacia la meta |
| **Entrenar** | Entreno sugerido, registro rápido de series y kilos, progresión de carga; partidos y cardio |
| **Comer** | Metas de calorías y proteína, comidas frecuentes en un toque |
| **Progreso** | Tendencia del peso, reportes de la balanza, fotos, marcas personales |
| **Datos** | Importaciones (Google, balanza), equipamiento, ajustes |

Detalle en [docs/producto/](docs/producto/).

## Stack

- **Next.js 16** (App Router, Cache Components, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS 4** con los tokens del [sistema visual](docs/producto/sistema-visual.md)
- Web app instalable (manifiesto e íconos generados por Next)
- Previsto: Postgres en Neon, Vercel Blob y Google Health API ([ADR 0007](docs/decisiones/0007-despliegue-en-vercel-con-neon.md))

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # compilación de producción
npm run lint && npm run typecheck
```

```
app/(app)/        secciones con la navegación común (Hoy, Entrenar, Comer, Progreso, Datos)
components/       navegación, tarjetas de Hoy, íconos y piezas de UI
lib/demo/         datos sintéticos (los de la demo pública)
lib/formato.ts    números y duraciones en formato es-AR
types/            tipos compartidos
scripts/          prueba de la Google Health API
```

## Documentación

- [Visión y principios](docs/producto/vision.md)
- [Secciones y flujos](docs/producto/secciones.md)
- [Fuentes de datos](docs/producto/datos.md)
- [Equipamiento](docs/producto/equipamiento.md)
- [Sistema visual](docs/producto/sistema-visual.md)
- [Decisiones técnicas (ADRs)](docs/decisiones/README.md)
- [Guía: configurar la Google Health API](docs/guias/google-health-api.md)

## Hoja de ruta

- [x] Relevamiento: objetivos, equipamiento, dispositivos, alcance
- [x] Fuentes de datos: Fitbit vía Google, balanza por captura
- [x] Prueba real de la Google Health API ([script](scripts/probar-google-health.mjs)): acceso sin verificación confirmado
- [ ] Confirmar que la sesión sigue viva pasados 7 días
- [x] Secciones y flujos principales
- [x] Despliegue: Next.js en Vercel, Postgres en Neon ([ADR 0007](docs/decisiones/0007-despliegue-en-vercel-con-neon.md))
- [x] Sistema visual y mockups (celular y escritorio)
- [x] Base de la app: navegación y pantalla Hoy con datos sintéticos
- [ ] Base de datos, modelo de datos y login
- [ ] Sincronización con Google Health
- [ ] Entrenar, Comer, Progreso y Datos
- [x] Primer despliegue en Vercel, con datos sintéticos
- [ ] Demo pública para el portfolio

## Privacidad

El repo es público y no contiene datos personales: ni perfil, ni mediciones, ni
exportaciones. Eso vive en una carpeta local fuera de git. Ver
[ADR 0006](docs/decisiones/0006-repo-privado-y-espejo-publico.md).
