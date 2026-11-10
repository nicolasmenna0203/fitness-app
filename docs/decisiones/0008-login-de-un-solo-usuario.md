---
numero: 0008
titulo: Login de un solo usuario con contraseña hasheada y cookie firmada
estado: Aceptada
fecha: 2026-11-10
codigo: proxy.ts, lib/sesion.ts, lib/clave.ts, app/login/acciones.ts, scripts/crear-clave.mjs
---

# 0008 — Login de un solo usuario con contraseña hasheada y cookie firmada

## Contexto

La app guarda datos de salud de una sola persona y está publicada en una URL
pública (ADR 0007). Tiene que quedar cerrada antes de guardar cualquier dato
real. Se usa como app instalada en el iPhone, así que pedir la contraseña
seguido es fricción sin ganancia real. Todavía no hay base de datos, y en
Vercel cada pedido puede caer en una instancia distinta.

## Alternativas descartadas

- **Proveedor de identidad (Auth.js con Google, Clerk)** — resuelve
  multiusuario, recuperación y sesiones, nada de lo cual hace falta para una
  persona; suma dependencias y otro servicio con acceso a la cuenta.
- **Login con Google reutilizando el OAuth de la Google Health API** — ata el
  acceso a la app al cliente OAuth sin verificar y a sus permisos restringidos.
- **Usuario y contraseña en texto plano en variables de entorno** — si se
  filtran las variables, se filtra la clave.
- **Contador de intentos fallidos** — sin base de datos no se comparte entre
  instancias; se puede sumar cuando exista Neon.

## Decisión

- **Solo contraseña** (sin usuario), guardada como hash scrypt en
  `APP_PASSWORD_HASH` con formato `scrypt.<sal>.<hash>` (N=16384, r=8, p=1,
  32 bytes, sal de 16 bytes). El separador es `.` y no `$`: Next expande
  `$NOMBRE` en los archivos `.env` y truncaba el hash. Se
  genera con `scripts/crear-clave.mjs`, que la pide sin mostrarla y exige 12
  caracteres o más.
- **Sesión:** cookie `sesion` = `<payload base64url>.<HMAC-SHA256>` con
  `SESSION_SECRET`, `httpOnly`, `secure`, `sameSite=lax`, válida **180 días**
  (arbitrario: una app instalada de un solo usuario). Rotar `SESSION_SECRET`
  cierra todas las sesiones.
- **`proxy.ts`** (el middleware de Next 16, que corre en Node) protege todas las
  rutas salvo `/login` y lo que el iPhone necesita para instalar la app:
  manifiesto e íconos. Sin `SESSION_SECRET` o sin hash configurado, no entra
  nadie: falla cerrado.
- **Fuerza bruta:** demora fija de 800 ms por intento fallido, más el costo de
  scrypt, más una contraseña de 12 caracteres o más.
- Comparaciones en tiempo constante (`timingSafeEqual`) para la firma y el hash.

## Consecuencias y límites

- **Límite:** sin contador de intentos, un atacante paralelizado no queda
  bloqueado; lo frena la longitud de la clave. Revisar cuando haya base de datos.
- **Límite:** no hay "olvidé mi contraseña": se regenera con el script y se
  actualiza la variable en Vercel.
- **Límite:** una sesión robada vale hasta 180 días, salvo que se rote el secreto.
- **Límite:** las páginas se prerenderizan estáticas y el proxy las protege antes
  de servirlas; si una ruta nueva tiene que ser pública, va explícita en el
  `matcher` o en `proxy.ts`.
- **Revisar si:** la app pasa a tener más de un usuario, o se agrega la demo
  pública (que necesita rutas sin login y sin acceso a datos reales).
