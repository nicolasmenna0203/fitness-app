---
numero: 0001
titulo: Web app instalable primero; app nativa solo si hace falta Apple Health
estado: Propuesta
fecha: 2026-11-10
codigo: —
---

# 0001 — Web app instalable primero; app nativa solo si hace falta Apple Health

## Contexto

La app se usa en un iPhone (en el gimnasio, durante el entreno) y en la compu
(para revisar el progreso con más espacio). Una web app puede instalarse en la
pantalla de inicio del iPhone y verse a pantalla completa, pero **no puede leer
Apple Health**, ni instalada. La pulsera no escribe en Apple Health de forma
útil y la balanza tiene su propia app, así que hoy Apple Health no es la fuente
central de ningún dato.

## Alternativas descartadas

- **App nativa de iPhone** — acceso completo a Apple Health, pero obliga a una
  versión aparte para la compu, a publicar por la App Store o renovar la firma
  cada 7 días con cuenta gratuita, y a más trabajo para el mismo resultado.
- **Solo escritorio** — el registro del entreno pasa con el celular en la mano.

## Decisión

Web app responsive e instalable (PWA): una sola base de código para celular y
escritorio. Si en algún momento Apple Health pasa a ser imprescindible, se
envuelve la misma web en un contenedor nativo (tipo Capacitor) que agregue solo
la lectura de HealthKit.

## Consecuencias y límites

- **Límite:** sin acceso a Apple Health ni a Bluetooth de la balanza desde la
  web; los datos entran por API de Google o por importación (ADR 0002, 0003).
- **Límite:** las notificaciones push en iPhone solo funcionan con la web
  instalada en la pantalla de inicio.
- **Revisar si:** aparece un dato valioso que solo vive en Apple Health, o la
  carga por captura de la balanza resulta demasiado tediosa.
