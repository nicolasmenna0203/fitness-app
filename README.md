# Fitness App

App web personal para entrenar en un gimnasio en casa y seguir el progreso
corporal: rutinas y registro de entrenos, nutrición simple, composición corporal
y datos de una pulsera de actividad, todo en un solo lugar. Funciona en el
celular y en la compu, con una interfaz inspirada en el ecosistema de Apple.

> **Estado:** en uso. Hoy, Entrenar, Comer y Progreso funcionan con datos
> reales, sincronizados con la pulsera. Faltan la sección Datos (equipamiento y
> preferencias) y una demo pública con datos sintéticos.

## Qué resuelve

Las apps de gimnasio asumen un gimnasio comercial y un calendario fijo. Esta
parte de lo contrario:

- **Equipamiento real de casa:** una multigym con pesas limitadas, banco,
  mancuernas, barra de dominadas y espacio al aire libre. La app sabe
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
- **Postgres en Neon** con **Drizzle ORM**, base y funciones en São Paulo ([ADR 0009](docs/decisiones/0009-drizzle-y-neon-en-sao-paulo.md))
- **Google Health API** para los datos de la pulsera, con sincronización al abrir la app y cron diario ([ADR 0002](docs/decisiones/0002-fitbit-via-google-health-api-y-takeout.md))
- Fotos de progreso comprimidas en el dispositivo y guardadas en Neon ([ADR 0011](docs/decisiones/0011-fotos-de-progreso-en-la-base.md))

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # compilación de producción
npm run lint && npm run typecheck && npm test
node scripts/crear-clave.mjs   # contraseña de la app → .env.local
npm run db:generate            # migración a partir de db/schema.ts
npm run db:migrate             # aplicarla en Neon
npm run db:semilla             # catálogo de ejercicios y rotación inicial
npm run leer-reporte -- <archivo>  # probar el lector de reportes de la balanza
```

Variables de entorno: ver [.env.example](.env.example).

```
app/(app)/        secciones con la navegación común (Hoy, Entrenar, Comer, Progreso, Datos)
components/       navegación, tarjetas de Hoy, íconos y piezas de UI
lib/formato.ts    números y duraciones en formato es-AR
lib/sesion.ts     sesión firmada; lib/clave.ts: hash de la contraseña
lib/google/       cliente de la Google Health API, conversión a filas y sincronización
lib/datos/        lecturas de la base para las pantallas
lib/entrenos/     progresión de carga, rotación y versión liviana (funciones puras)
lib/peso.ts       tendencia, ritmo y proyección del peso
lib/calorias.ts   meta inicial, ajuste semanal y extra por deporte
lib/balanza/      lector de reportes de la balanza (OCR por posición, PDF, texto)
app/(foco)/       pantallas sin navegación: el entreno en curso
db/               esquema de Drizzle y migraciones
app/api/          OAuth de Google y cron de sincronización
proxy.ts          exige sesión en toda la app salvo /login, íconos y el cron
types/            tipos compartidos
scripts/          prueba de la Google Health API
```

## Documentación

- [Visión y principios](docs/producto/vision.md)
- [Secciones y flujos](docs/producto/secciones.md)
- [Fuentes de datos](docs/producto/datos.md)
- [Equipamiento](docs/producto/equipamiento.md)
- [Sistema visual](docs/producto/sistema-visual.md)
- [Modelo de datos](docs/producto/modelo-de-datos.md)
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
- [x] Login de un solo usuario ([ADR 0008](docs/decisiones/0008-login-de-un-solo-usuario.md))
- [x] Base de datos en Neon ([modelo de datos](docs/producto/modelo-de-datos.md))
- [x] Sincronización con Google Health: pasos, calorías, FC en reposo, sueño y ejercicios
- [x] Entrenar: rotación A/B, registro de series, progresión de carga e historial ([ADR 0004](docs/decisiones/0004-entrenos-por-rotacion-sin-calendario.md))
- [x] Progreso: peso diario con tendencia, meta, lector de reportes de la balanza (OCR en el dispositivo) y marcas personales
- [x] Comer: calorías y proteína con meta calculada y ajuste semanal automático ([ADR 0005](docs/decisiones/0005-calorias-adaptativas-por-tendencia-de-peso.md))
- [ ] Datos: equipamiento y preferencias
- [x] Primer despliegue en Vercel, con datos sintéticos
- [ ] Demo pública para el portfolio

## Privacidad

El repo es público y no contiene datos personales: ni perfil, ni mediciones, ni
exportaciones. Eso vive en una carpeta local fuera de git. Ver
[ADR 0006](docs/decisiones/0006-repo-privado-y-espejo-publico.md).
