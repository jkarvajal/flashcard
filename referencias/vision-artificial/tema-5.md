# Tema 5 — Detección y Cancelación de Anomalías

> **Asignatura:** Visión Artificial · Máster en Inteligencia Artificial (UNIR)
> **Bloque 1:** Percepción Visual y Auditiva: Digitalización y Cancelación de Anomalías
> **Docente:** Alexandre Pérez Reina · Dr. Abdelmalik Moujahid

**Problema planteado:** ¿Cómo diseñar un sistema de detección y cancelación de anomalías mediante algoritmos de aprendizaje **no supervisado**?

**Índice:** 1) Tipos de anomalías · 2) Detección de anomalías · 3) Eliminación de anomalías.

---

## Definición
- **Contexto general:** algo que se aparta de lo normal o esperado.
- **Contexto de señales:** comportamiento inusual o desviación significativa respecto de su patrón normal o esperado.

**Ejemplos:**
- **Audio:** sonido ruidoso o extraño que aparece en medio de una grabación.
- **Señales eléctricas:** variación brusca o pico inesperado en voltaje/corriente.
- **Series temporales:** valor que se desvía mucho de la tendencia general de la serie.

**¿Para qué sirve la detección de anomalías?**
- Detección de fraudes financieros.
- Detección de accesos no autorizados.
- Detección temprana de tumores.

---

## 1. Tipos de anomalías

- **Puntuales:** una muestra difiere significativamente del resto del conjunto (p. ej. un único valor extremo). Ejemplo: *SeasonalAD*.
- **Contextuales:** una muestra que parecería normal en un contexto general resulta anómala en un contexto específico.
  - 20 ºC es normal en primavera, pero anómalo en invierno.
  - Un aumento de consumo es normal de día, pero anómalo de noche.
- **Colectivas:** un **grupo** de datos considerados juntos muestra un patrón inusual, aunque los puntos individuales no sean anómalos por separado. Ejemplo: anomalías en series temporales.

---

## 2. Detección — Métodos de identificación

Tres familias: **Supervisados**, **Semi-supervisados** y **No supervisados**.

### Métodos SUPERVISADOS
- Se entrena el modelo con datos que incluyen la **solución deseada** (etiqueta).
- Dos tipos de aprendizaje supervisado: **clasificación** y **regresión**. Aquí interesa la **clasificación** (asignar un elemento a una clase en base a sus datos).
- Flujo: Dataset (etiquetado) → Modelo → Input nuevo → Clasificación.
- **Problemas:**
  - ¿Cómo sabemos *a priori* qué tipos de anomalías se van a producir?
  - ¿Cómo equilibramos (nivelamos) el volumen de datos de ambas etiquetas? (las anomalías suelen ser raras → clases desbalanceadas).

### Métodos SEMI-SUPERVISADOS
- ¿Qué pasa si entrenamos el modelo **solo con una clase** (la "normal")?
- El modelo es capaz de detectar **algo que se desvíe** de los datos de entrenamiento (novelty/anomaly detection).

### Métodos NO SUPERVISADOS
- **No** hay etiquetas: el modelo aprende sin un "profesor".
- Puede servir para agrupar/clasificar elementos en categorías. En nuestro caso, dos: **Anomalía** / **No anomalía**.
- Trabaja sobre el espacio de características (*feature 1*, *feature 2*, …): los puntos que quedan aislados del grueso de los datos se identifican como **anomalías**.

---

## 3. Eliminación de anomalías

### Filtro de mediana
- Se emplea en señales **1D y 2D** para eliminar ruido.
- Su respuesta consiste en **ordenar** los puntos (o píxeles) que forman la ventana que cubre el filtro y **reemplazar el punto central por la mediana**.
- **¿Por qué la mediana y no la media?** La mediana es **robusta frente a valores extremos**: un pico de ruido (outlier) no arrastra el resultado, mientras que la media sí se ve afectada por el valor atípico.

### Técnicas estadísticas (estimación de densidad)
Procedimiento general:
1. Determinar la **distribución de probabilidad** para los datos normales mediante una técnica de **estimación de densidad**.
2. Evaluar la **probabilidad** asociada a cada punto usando el modelo de densidad calculado.
3. Establecer un **límite (umbral) de probabilidad** que sirva de criterio para identificar anomalías.
4. Detectar los puntos cuya probabilidad esté **por debajo del umbral** y clasificarlos como anomalías.

### Método del Kernel de Parzen (ventana de Parzen)
- Estima la **función de densidad de probabilidad** de un conjunto de datos **sin asumir una forma paramétrica** (no paramétrico).
- Se superpone un **kernel** (función de peso) sobre cada punto de datos. El kernel `K(u)` asigna **más peso a los puntos cercanos** y **menos a los lejanos**.
- Densidad estimada en un punto `x`:

  `f̂(x) = (1 / (n·h^d)) · Σ_{i=1}^{n} K( (x − x_i) / h )`

  - `n`: número de datos del conjunto.
  - `h`: parámetro de ancho de banda o **suavizado** (bandwidth).
  - `d`: dimensionalidad de los datos.
  - `K`: kernel utilizado.

---

## Ideas clave

- **Anomalía:** desviación significativa del patrón normal de una señal.
- **Tipos:** puntual (un valor), contextual (depende del contexto), colectiva (un grupo).
- **Supervisado:** necesita etiquetas; problema del desbalanceo y de anticipar tipos de anomalía.
- **Semi-supervisado:** se entrena solo con la clase normal y detecta desviaciones.
- **No supervisado:** sin etiquetas; separa anomalía / no-anomalía en el espacio de features.
- **Filtro de mediana:** robusto a outliers (por eso mediana y no media).
- **Kernel de Parzen:** estimación de densidad no paramétrica con parámetro de suavizado `h`.
