# Tema 13 — Extracción de Características. Procesamientos Multiescala y Métodos Avanzados

> **Asignatura:** Visión Artificial · Máster en Inteligencia Artificial (UNIR)
> **Bloque:** Extracción de características

**Índice:** 13.2 Introducción al procesamiento multiescala · 13.3 Transformada Wavelet · 13.4 Filtros de Gabor · 13.5 Transformada SIFT.

---

## 13.2. Introducción — ¿por qué procesamiento multiescala?

- La mayoría de métodos previos (histogramas de color, variaciones de intensidad, texturas) **no** reconocen patrones complejos como la **identificación de un objeto**, y fallan ante la **rotación**, la **traslación** o la **oclusión** (parte del objeto oculta).
- **Wavelets, filtros de Gabor y SIFT** proporcionan características más robustas:
  - Dan una visión más detallada de texturas, variabilidad y objetos.
  - Son **invariantes al cambio de escala, rotación y ruido**.
- **Aplicaciones típicas:** **biometría** (iris, huella — el iris cambia de tamaño constantemente, de ahí la necesidad de invariancia a escala), **panorámicas** del móvil (SIFT encuentra puntos comunes y aplica rotación/escalado para fusionar), **identificación de monedas** en máquinas de vending (Wavelets, invariancia a rotación).

---

## 13.3. Transformada Wavelet

### Limitación de Fourier → STFT
- **Fourier** descompone la señal en componentes sinusoidales de frecuencia (pasa de la base de **tiempo** a la base de **frecuencia**), pero **pierde la información temporal**: no dice **en qué momento** ocurre una variación de frecuencia.
- Esto es un problema para **señales no estacionarias / transitorias** (tendencias, cambios abruptos, inicios/finales de eventos), que suelen ser las secciones más interesantes.
- **STFT (Short Time Fourier Transform):** en **1946 Denis Gabor** adaptó Fourier usando una **ventana** para analizar pequeñas secciones de la señal → la lleva al **plano 2D tiempo-frecuencia**. En cada ventana se calcula la FFT.
  - Es un **compromiso** tiempo-frecuencia, con precisión **limitada por el tamaño de la ventana**.
  - **Desventaja clave:** una vez fijado, el **tamaño de la ventana es el mismo para todas las frecuencias**.

### Wavelets como evolución de STFT
- Usan **ventanas de tamaño variable** (análisis **multirresolución**):
  - Ventanas **anchas** (intervalos grandes de tiempo) para **baja frecuencia**.
  - Ventanas **angostas** para **alta frecuencia**.
- Mapea la señal en una representación **tiempo-escala**; es eficiente para el análisis **local** de señales no estacionarias y transitorias.
- **Operación intuitiva:** la señal pasa por **filtros paso bajo y paso alto** que separan las porciones de alta y baja frecuencia, repitiendo el proceso sobre las porciones resultantes.

### Utilidades de las Wavelets
- **Detección de discontinuidades / puntos de quiebre** (fronteras entre colores y formas).
- **Estudio de fractales** (patrones repetitivos).
- **Identificación de frecuencias puras** (base ortogonal, análoga a la sinusoidal de Fourier).
- **Eliminación de ruido** (1D y 2D).
- **Compresión de imágenes** (análisis 2D; una de sus aplicaciones **más importantes**).
- **Medicina:** señales no estacionarias como el **EEG** (donde Fourier no sirve); p. ej. diagnóstico de **Alzheimer** entrenando redes neuronales con datos de wavelets multirresolución.

---

## 13.4. Filtros de Gabor

- Son una **particularidad de la STFT** cuya **ventana tiene distribución gaussiana**.
- Junto con las Wavelets, son los que **mejor imitan el ojo natural**: las **células simples de la corteza visual** son sensibles a la **orientación** y a la **frecuencia espacial**.
  - **Orientación:** ángulo de un objeto respecto a un eje de referencia.
  - **Frecuencia espacial:** repetición de un patrón en el espacio (unidades inversas de longitud).
  - Esas células aparecen en **pares** con **diferencia de fase de π/2 radianes**: una detecta objetos **simétricos/repetidos** (líneas paralelas) y la otra los **asimétricos**.
- A diferencia de las Wavelets (**unidimensionales**), los filtros de Gabor son **bidimensionales** → excelentes para la **descomposición multiescala de imágenes**.
- Convolucionar la imagen con un **banco** de filtros Gabor (varias frecuencias y orientaciones) detecta **bordes, contornos, texturas y patrones**.
- **Aplicaciones:** sobre todo **biometría de huella e iris**. En el iris, reducen la textura a un **patrón comparable** mediante una distancia sencilla (p. ej. **distancia de Hamming**); el resultado (iris code) parece un **código QR**.

---

## 13.5. Transformada SIFT (Scale Invariant Feature Transform)

- Muy útil hoy; resuelve problemas complejos como localizar **objetos parcialmente ocultos**, rotados o a distinta escala.
- Devuelve, para cada objeto, su **ubicación** (recuadro grande), sus **características** (recuadros pequeños) y, para cada una, su **tamaño y orientación**.
- Propuesto para **escala de grises**; cada punto de interés se describe con un **vector de 128 elementos** que recoge cómo se distribuyen las intensidades a su alrededor.

**Dos partes del algoritmo:**
1. **Obtención de puntos característicos (keypoints).**
2. **Descripción de la región** alrededor de cada punto.

### Keypoints: esquinas vs blobs
- Se buscan regiones con **diferencias de gradiente significativas**, detectables de forma **consistente a distintas escalas**.
- No solo **esquinas** (corner: punto donde confluyen ≥2 bordes), sino **blobs**: regiones cuyas propiedades se mantienen aprox. **constantes** (similitud de nivel de gris, medida por la variación del gradiente en varias direcciones).
- En resumen: **regiones de intensidad estable** alrededor de las cuales hay **variación de gradiente en más de una dirección**.

### Descriptor invariante
- Se calcula un **histograma de las direcciones del gradiente local** alrededor del punto.
- **Invariante a escala:** se normaliza el tamaño del vecindario según la escala.
- **Invariante a rotación:** se determina la **orientación dominante** del gradiente y se orienta la rejilla del histograma con ella.

### Pasos de SIFT
1. **Detección de extremos en el espacio-escala:** se buscan candidatos en todas las escalas mediante la **diferencia de gaussianas (DoG)**.
2. **Localización precisa de keypoints:** se ajusta un modelo (ubicación y escala) y se **eliminan** los puntos de **bajo contraste** o próximos a **bordes**.
3. **Asignación de orientación:** una o varias orientaciones según el gradiente local (da la invariancia a rotación).
4. **Descripción del punto:** gradientes locales + histograma → representación **robusta a cambios de iluminación** y pequeñas distorsiones.

---

## Ideas clave

- **Multiescala:** Wavelets, Gabor y SIFT dan características **invariantes a escala, rotación y ruido** (lo que no logran histogramas/textura).
- **Fourier** pierde el "cuándo"; **STFT** (Gabor, 1946) añade ventana tiempo-frecuencia, pero de **tamaño fijo**.
- **Wavelets:** ventanas de **tamaño variable** (multirresolución): anchas para baja frecuencia, angostas para alta. Usos: compresión, denoising, fronteras, EEG. Son **1D**.
- **Gabor:** STFT con **ventana gaussiana**, **2D**; imita la corteza visual (orientación + frecuencia espacial). Biometría (iris → distancia de Hamming, "código QR").
- **SIFT:** keypoints = **blobs** detectados con **DoG** en todas las escalas; descriptor de **128** valores (histograma de gradientes), **invariante a escala, rotación e iluminación**. Resuelve oclusión y panorámicas.
- **Cronología:** Gabor (STFT, 1946) → Wavelets → **SIFT** (el más reciente).
