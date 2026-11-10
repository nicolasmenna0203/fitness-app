# Configurar la Google Health API (uso personal)

Pasos para que la app (o el script de prueba) lea los datos de una pulsera
Fitbit de **una sola cuenta**, sin la auditoría de seguridad que Google exige a
las apps públicas. Contexto y alternativas en
[ADR 0002](../decisiones/0002-fitbit-via-google-health-api-y-takeout.md).

## Antes de empezar

- La pulsera tiene que estar vinculada a la app **Google Health** del celular,
  con la misma cuenta de Google que vas a usar acá. Si la API responde
  `ACCOUNT_NOT_LINKED`, falta este paso.
- Alcanza con una cuenta de Google común. No hace falta `gcloud`.

## Pasos en Google Cloud Console

1. **Crear un proyecto.** Entrá a
   [console.cloud.google.com/projectcreate](https://console.cloud.google.com/projectcreate),
   ponele un nombre (por ejemplo `fitness-app`) y crealo. Asegurate de que
   quede seleccionado arriba a la izquierda.

2. **Activar la API.** En
   [la página de la Google Health API](https://console.cloud.google.com/apis/library/health.googleapis.com)
   tocá **Habilitar**. Si pide una cuenta de facturación, anotalo: es una de
   las preguntas de la prueba.

3. **Pantalla de consentimiento** (Google Auth Platform → *Branding*, o
   *Pantalla de consentimiento de OAuth*):
   - Nombre de la app: cualquiera (`Fitness App`).
   - Mail de soporte y de contacto: el tuyo.
   - Tipo de usuario / *Audience*: **Externo**.

4. **Permisos** (*Data Access* → *Add or remove scopes*): buscá
   "Google Health API" y marcá estos tres:
   - `.../auth/googlehealth.activity_and_fitness.readonly`
   - `.../auth/googlehealth.health_metrics_and_measurements.readonly`
   - `.../auth/googlehealth.sleep.readonly`

   Guardá. Google va a avisar que son permisos restringidos: es esperable.

5. **Cliente OAuth** (*Clients* → *Create client*, o *Credenciales* →
   *Crear credenciales* → *ID de cliente de OAuth*):
   - Tipo: **Aplicación web**.
   - URI de redireccionamiento autorizado: `http://localhost:8765/callback`
   - Crear y **descargar el JSON**. Guardalo como
     `privado/client_secret.json` dentro del proyecto. La carpeta `privado/`
     no se versiona.

6. **Publicar la app** (*Audience* → *Publishing status*): tocá
   **Publish app** para pasarla de *Testing* a **In production**. Google puede
   ofrecer iniciar la verificación: **no hace falta**, porque la excepción de
   uso personal cubre apps con menos de 100 usuarios.

   > Si Google no deja publicar con permisos restringidos sin verificar, dejala
   > en *Testing* y agregá tu cuenta en *Test users*. La prueba funciona igual,
   > pero la sesión va a vencer a los 7 días.

## Correr la prueba

```bash
node scripts/probar-google-health.mjs login
```

Se abre el navegador. Iniciá sesión con tu cuenta. Si aparece "Google no
verificó esta app", tocá **Configuración avanzada → Ir a Fitness App (no
seguro)**: es tu propia app. Aceptá los permisos y volvé a la terminal.

El script muestra:
- si Google informó un vencimiento de la sesión (señal de modo *Testing*);
- qué datos llegan (sueño, pasos, FC, variabilidad, ejercicios, calorías,
  oxígeno, peso) y cuántos registros;
- dónde guardó las respuestas crudas para estudiar el formato.

**A los 8 días**, para confirmar que la sesión no vence:

```bash
node scripts/probar-google-health.mjs datos
```

## Qué se guarda y dónde

Todo en `privado/`, fuera de git: el JSON del cliente, la sesión (refresh
token) y las respuestas crudas. Para revocar el acceso en cualquier momento:
[myaccount.google.com/connections](https://myaccount.google.com/connections).
