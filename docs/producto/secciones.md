# Secciones y flujos

Primera versión de la estructura. Se va a refinar en la etapa de wireframes.

## Navegación

- **Celular:** barra de pestañas abajo con las cinco secciones (patrón de iOS).
- **Escritorio:** barra lateral (patrón de macOS/iPadOS) con más información
  visible a la vez; mismas secciones.

## Secciones

### Hoy
La pantalla de entrada. Responde "¿qué hago hoy y cómo vengo?".
- Próximo entreno sugerido, con botón para empezarlo.
- Anillos o barras: proteína y calorías del día.
- Sueño de anoche y estado de recuperación (dato de la pulsera, o un check-in
  rápido si no hay importación reciente).
- Avance hacia la meta de peso: tendencia, no el peso del día.

### Entrenar
- Entreno sugerido según la rotación y lo que se hizo los últimos días.
- Registro de series: el valor sugerido viene precargado; confirmar es un toque.
- Temporizador de descanso.
- Registrar un partido o una sesión de cardio.
- Historial de entrenos.

### Comer
- Metas del día (calorías y proteína) que se ajustan solas cada semana
  ([ADR 0005](../decisiones/0005-calorias-adaptativas-por-tendencia-de-peso.md)).
- Comidas frecuentes guardadas, cargables en un toque.
- Carga libre de calorías y proteína para lo que no está guardado.

### Progreso
- Peso: diario, con la línea de tendencia y el ritmo semanal.
- Composición corporal: evolución de los reportes de la balanza.
- Fotos de progreso.
- Marcas personales por ejercicio.

### Datos
- Importar datos de Google (Fitbit) y reportes de la balanza.
- Equipamiento: qué hay y cuánta carga da cada cosa.
- Meta y preferencias.

## Flujos clave

1. **Hacer el entreno de hoy:** Hoy → Empezar → confirmar series → Terminar.
2. **Cargar una comida frecuente:** Comer → tocar la comida.
3. **Cargar un reporte de la balanza:** Datos → Subir captura → revisar valores
   → Guardar.
4. **Revisión semanal:** resumen automático con peso promedio, entrenos hechos,
   promedio de proteína y el ajuste de calorías de la semana siguiente.
