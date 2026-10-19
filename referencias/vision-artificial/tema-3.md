# Tema 3 — Captura y Digitalización de Señales

> **Asignatura:** Visión Artificial · Máster en Inteligencia Artificial (UNIR)
> **Bloque 1:** Percepción Visual y Auditiva: Digitalización y Cancelación de Anomalías
> **Docente:** Alexandre Pérez Reina · Diapositivas: Dr. Abdelmalik Moujahid

**Problema planteado:** ¿Cuántas **muestras** y **niveles de cuantificación** son necesarios para representar digitalmente una señal?

**Objetivos de aprendizaje:**
- Comprender los conceptos fundamentales de muestreo y cuantificación.
- Reconocer la importancia de estos procesos en el procesamiento de señales.
- Identificar las aplicaciones prácticas del muestreo y la cuantificación.

**Caso práctico:** Fabricación de sensores para vehículos autónomos (cámaras, radares, LiDAR…) que recopilan gran volumen de datos del entorno (obstáculos, peatones, señales de tráfico). El desafío es la **eficiencia en la recopilación y procesamiento**. La elección adecuada de la **frecuencia de muestreo** y la **resolución de cuantificación** son cruciales para capturar y representar la información de forma precisa en tiempo real.

---

## Procesado de señal Analógico/Digital

Cadena de procesamiento:

`entrada analógica → [ muestreo → cuantificación ] (A/D) → procesamiento digital → D/A → salida analógica`

`f(t_n) → y_n → F(y_n) → g(t)`

- **ADC:** Analog-to-Digital Converter.
- **DAC:** Digital-to-Analog Converter.

---

## 1. Muestreo (Sampling)

- Consiste en tomar valores de una señal continua en instantes discretos de tiempo.
- Representación matemática:

  `x[n] = x(n·Ts),  n ∈ Z,  Ts ∈ ℝ`

  donde **Ts** es el **periodo de muestreo** y la **frecuencia de muestreo** es:

  `fs = 1 / Ts`

### Problema asociado: el *Aliasing*
- Si la frecuencia de muestreo es demasiado baja para la señal, aparece el **aliasing**: una señal de alta frecuencia mal muestreada se "disfraza" y se reconstruye como una señal de frecuencia distinta (más baja). Las muestras de una señal de baja y de alta frecuencia pueden producir la misma secuencia reconstruida.

### Teorema de muestreo (Nyquist)
- Para resolver todo el contenido frecuencial de una señal, ésta debe muestrearse a una tasa **superior al doble** de la frecuencia máxima presente en la señal.
- Una señal **limitada en banda** (sin frecuencias más allá de `f_max`) puede representarse totalmente mediante muestras si:

  `fs > 2·f_max  (Hz)`     con     `Ω_max = 2π·f_max`

- **Pre-procesamiento:** una señal continua **no limitada en banda** se muestrea aplicando primero un **filtro paso bajo** con frecuencia de corte `fc = f_max`, y luego muestreando con `fs > 2·f_max`.

### Ejemplo (Nyquist)
Hallar la tasa de muestreo mínima de:

`x(t) = cos(100πt) + sin(200πt) + cos(500πt + π/4) + 7`

**Solución:**
- Frecuencia máxima (en radianes): `Ω_max = 500π rad`.
- En Hertzios: `f_max = Ω_max / (2π) = 250 Hz`.
- Tasa de muestreo mínima (Nyquist): `fs > 2·f_max = 500 Hz`.

### Artefactos en imágenes por muestreo (Aliasing)
- Reducir la resolución de una imagen sin cuidado genera artefactos (patrones de Moiré). Ejemplo: pasar de 647×732 a 400×475 píxeles.
- En Matlab, el reescalado con antialiasing: `I2 = imresize(I1, 0.5, "Antialiasing", true)`.

### Frecuencias de muestreo típicas
- **4G / captura de voz:** entre 8 kHz y 16 kHz.
- **Audio de alta calidad** (música, alta fidelidad): 44.1 kHz o incluso más alta.

---

## 2. Cuantificación (Quantization)

- Formalmente, es el proceso de **discretizar** una señal continua (en tiempo o espacio) en un conjunto **finito de niveles discretos**:

  `x_q(t) = Q(x(t))`

  - `x_q(t)` es la señal cuantificada.
  - `Q(·)` asigna a cada muestra un valor discreto.
  - **Error de cuantificación:** `e = x(t) − x_q(t)`.

- A más **bits**, más niveles y menor error (representaciones de 1, 2, 3, 4… bits se aproximan cada vez mejor a la señal original).

### Proceso de cuantificación en N niveles
1. Definir el **rango** de valores posibles de la señal: `Rango = max(x(t)) − min(x(t))`.
2. Calcular el **paso de cuantificación**: `Δ = Rango / (N − 1)`, donde `N = 2^bits` es el número de niveles.
3. Aplicar la cuantificación a cada muestra `x[n]`:

   `x_q[n] = round( x[n] / Δ ) · Δ`

   donde `round(·)` redondea al entero más cercano.

> Formulación equivalente (con `S_min`): `S_q(t) = S_min + round( (S(t) − S_min) / ΔS ) · ΔS`, con `ΔS = (S_max − S_min)/(N−1)` y niveles `q_i = S_min + i·ΔS`, `i = 0,1,…,N−1`.

### Bits de cuantificación típicos
- **4G / voz:** de 8 a 16 bits por muestra.
- **Audio de alta calidad** (música, estudio, alta fidelidad): de 16 a 24 bits.

### Tasa de bits (Bit rate)
- Cantidad de bits transmitidos o procesados por unidad de tiempo (bits por segundo, **bps**).

  `Tasa de bits = Tasa de muestreo × Bits de cuantificación`

- Es clave para: **calidad** de la señal, **requisitos de almacenamiento/transmisión** y **eficiencia** en el procesamiento.

| Aplicación | Tasa de bits (aprox.) |
|------------|-----------------------|
| Transmisión de vídeo en alta definición | 3 Mbps – 20 Mbps |
| Televisión digital por satélite/cable | 10 Mbps – 20 Mbps o más |
| Transmisión de audio en línea | 96 kbps – 320 kbps |
| Redes de comunicaciones móviles | Varios Mbps – varios Gbps |

---

## 3. Aplicaciones del muestreo y la cuantificación

- Transmisión de audio y vídeo en línea.
- Diseño de sistemas de control y automatización.
- Captura de datos en investigación científica.

**Impacto en la tecnología moderna:**
- Mejora de calidad en plataformas de streaming de música/vídeo.
- Sistemas de control de alta precisión (automoción, fabricación).
- Avances en adquisición y procesamiento de datos en medicina y astronomía.

**Conclusión:** muestreo y cuantificación son procesos fundamentales del procesamiento de señales, con impacto en la transmisión de audio/vídeo, el diseño de sistemas de control, la investigación científica y la adquisición/transmisión eficiente y precisa de información en el mundo digital.

---

## Ideas clave

- **Muestreo:** discretizar en el tiempo. `x[n] = x(n·Ts)`, `fs = 1/Ts`.
- **Nyquist:** `fs > 2·f_max` para evitar **aliasing**.
- **Cuantificación:** discretizar en amplitud. `N = 2^bits` niveles, paso `Δ = Rango/(N−1)`.
- **Error de cuantificación:** `e = x(t) − x_q(t)`; disminuye al aumentar bits.
- **Tasa de bits = tasa de muestreo × bits de cuantificación**.
