# Tema 11 — Extracción de Características. Propiedades Estadísticas y Frecuenciales de la Señal

> **Asignatura:** Visión Artificial · Máster en Inteligencia Artificial (UNIR)
> **Bloque:** Extracción de características

**Índice:** 11.2 Caracterización en el dominio natural · 11.3 Características derivadas del análisis en frecuencia.

---

## Introducción

- **Objetivo:** proporcionar herramientas para **caracterizar** el comportamiento de las señales → un conjunto de **atributos** que cuantifican cualidades de la fuente de información.
- Estos atributos **sintetizan** la información de la señal para manejarla eficientemente en una etapa final de **reconocimiento de patrones**.
- Las señales (series temporales 1D, imágenes 2D) se modelan como **procesos estocásticos**. Se asume que son **estacionarios en sentido amplio**: sus propiedades estadísticas **no varían** con las coordenadas (tiempo/espacio).
- Las muestras de la señal `f(·)` son **realizaciones de una variable aleatoria** (p. ej. en un ECG, cada muestra = observación del potencial eléctrico).
- Las **funciones de distribución y de densidad de probabilidad** definen **por completo** el comportamiento estadístico; pero en la práctica se usan **atributos cuantitativos** (caracterización **parcial**), más manejables.
- Se extraen atributos en **dos dominios**: el **natural** (tiempo o espacio) y el **frecuencial**. El resultado es un **vector global de características**.

---

## 11.2. Caracterización en el dominio natural

### Caracterización estadística parcial

- **Máximo y mínimo:** su diferencia define el **rango dinámico** de la señal.

- **Media (μ):** media ponderada de todos los valores posibles, con peso = **frecuencia relativa** (nº de observaciones del valor / nº total de muestras), que **aproxima la probabilidad** de ese valor. De forma precisa:

  `μ = E{F} = ∫ f · p_F(f) df`   (E{·} = esperanza matemática)

  > El cálculo implica (1) **discretizar** la variable continua de amplitud y (2) **estimar su densidad de probabilidad** por la frecuencia de observación. Este esquema se repite para los demás estadísticos.

- **Mediana:** valor que deja **0.5 de probabilidad a cada lado** (áreas iguales bajo la densidad). En la práctica (discreto): el valor **central** tras **ordenar** las muestras (media de los dos centrales si N es par).

- **Moda:** valor que se toma con **mayor probabilidad** (el **máximo** de la función de densidad).

- **Varianza (σ²):** promedio de las **desviaciones cuadráticas** respecto a la media:

  `σ² = E{(F − μ)²}`.  La **desviación típica** `σ` es su raíz cuadrada positiva.

- **Asimetría / Skewness (γ):** grado de asimetría de la densidad respecto al eje vertical de la media:

  `γ = E{(F − μ)³} / σ³`

  - `γ > 0`: la **cola derecha** es más larga que la izquierda.
  - `γ < 0`: la cola izquierda es más larga.
  - `γ = 0`: función **simétrica** (p. ej. la **gaussiana**).

- **Curtosis (κ):** caracteriza las **colas** de la densidad:

  `κ = E{(F − μ)⁴} / σ⁴`

  - Referencia: la **normal tiene curtosis 3**.
  - `κ < 3` (negativa respecto a la normal): outliers **menos** extremos que en la normal.
  - `κ > 3`: outliers **más** extremos.

- **Percentiles:** el percentil de umbral `u` es el valor para el que la **probabilidad acumulada** es `u`. Se suelen usar 0.1…0.9, o solo **0.25, 0.5 y 0.75** para reducir parámetros.

- **Rango intercuartil (IQ):** diferencia entre el **tercer cuartil (0.75)** y el **primer cuartil (0.25)**:

  `IQ = P_0.75 − P_0.25`.  Mide la **dispersión** de la variable.

### Otros parámetros (teoría de la información / del caos)

- **Entropía:** promedio de la **cantidad de información** de la variable. Es **mayor** cuanto más **uniforme** sea la densidad (más incertidumbre). La **distribución uniforme** tiene la **entropía máxima**.

- **Complejidad de Lempel-Ziv:** medida **no paramétrica** de complejidad de una fuente. Cuenta el número de **subsecuencias diferentes** de la señal y su **frecuencia de repetición**. **Mayor repetición → menor complejidad** (fuente más predecible, menos caótica). Sirve para **cuantificar cómo de predecible** es una señal a partir de su histórico.

- **Medida de la tendencia central:** a partir del **gráfico de diferencias de primer orden** (representar `x[n+1]` frente a `x[n]`, centrado en el origen) se obtiene una métrica del **grado de variabilidad/caos**. **Mayor valor → mayor variabilidad y más difícil de predecir.**

---

## 11.3. Características derivadas del análisis en frecuencia

La representación frecuencial (teoría de **Fourier**) revela atributos no observables en el dominio natural.

- **Densidad espectral de potencia (DEP):** refleja la **potencia por unidad de frecuencia**. Se obtiene como la **transformada de Fourier de la función de autocorrelación** de la señal. Las regiones de mayor amplitud señalan las **componentes frecuenciales más significativas**. (Ej.: la voz concentra su DEP entre ~**300 Hz y 4 kHz**.)

- **Ancho de banda:** rango de frecuencias en que la DEP es **mayor que cero** (ancho de banda **absoluto** = frecuencia máxima − mínima). En la práctica se usan criterios como:
  - La diferencia entre frecuencias con **atenuación de 3 dB** respecto al máximo.
  - El rango donde se concentra el **90 % de la potencia**.
  - Cualitativamente, **mayor ancho de banda → cambios más diversos** (variaciones lentas y rápidas) → **más información**.

- **Formantes:** **máximos locales** de la DEP; se asocian a las **principales frecuencias** contenidas en la señal.

- **Caracterización estadística del espectro:** si se **normaliza la DEP** (área = 1), puede interpretarse como una **función de densidad de probabilidad** de la frecuencia. De ahí se obtienen **media, mediana** (la **frecuencia mediana** es muy usada) y **varianza** del espectro.

- **Entropía espectral:** la **entropía** calculada sobre la DEP **normalizada** (la variable aleatoria es la componente frecuencial).

---

## Ideas clave

- **Objetivo:** extraer un **vector de características** que sintetice la señal para reconocimiento de patrones. Señales = procesos estocásticos **estacionarios en sentido amplio**.
- **Estadística parcial:** rango dinámico (máx−mín), **media**, **mediana**, **moda**, **varianza/σ**, **skewness** (cola: >0 derecha, 0 simétrica), **curtosis** (colas; normal = 3), **percentiles**, **IQ = P75 − P25** (dispersión).
- **Teoría de la información/caos:** **entropía** (máx = uniforme), **Lempel-Ziv** (predecibilidad; más repetición = menos compleja), **medida de tendencia central** (variabilidad/caos).
- **Frecuencia:** **DEP** = potencia/frecuencia (TF de la autocorrelación); **ancho de banda** (a 3 dB o 90 % de potencia; más ancho = más información); **formantes** (máximos locales); **frecuencia mediana** y **entropía espectral** (DEP normalizada).
