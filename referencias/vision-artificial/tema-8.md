# Tema 8 — Procesamiento de Señales. Filtrado y Análisis en Frecuencia

> **Asignatura:** Visión Artificial · Máster en Inteligencia Artificial (UNIR)
> **Bloque 2:** Procesamiento Digital de Imagen

**Objetivo:** presentar el **análisis en frecuencia** desde su origen (**series de Fourier**) hasta su implementación actual (**FFT**), sentando las bases para otras herramientas (DCT, Wavelets, filtrado en frecuencia de imágenes).

**Índice:** 8.3 Introducción al análisis en frecuencia · 8.4 La transformada de Fourier · 8.5 DFT y su implementación mediante FFT.

---

## 8.3. Introducción al análisis en frecuencia

- Es una de las herramientas más potentes del procesamiento de la información.
- **Ejemplo cotidiano:** la señal del cable de red/fibra vista en un osciloscopio es una **señal compleja aperiódica** (aleatoria/caótica): superposición simultánea de voz, datos de Internet e incluso TV.
- En el **dominio del tiempo** no podemos saber si una señal es la suma de varias ni su origen (solo media, máximo, mínimo…).
- El **análisis en frecuencia** sí permite: dada la señal suma, averiguar **de qué señales proviene** y **cuán intensas (potencia)** son.
- **¿Cómo lo hace?** Barre el espectro de frecuencias y detecta, mediante un **producto escalar**, cuánta señal hay a cada frecuencia.
- Clave: dos señales **solapadas en el tiempo** pueden estar **separadas en frecuencia**, lo que permite separarlas/filtrarlas (imposible en el dominio temporal).

La herramienta principal es la **transformada de Fourier**, que permite:
- Saber qué **componentes de frecuencia** tiene una señal temporal y su intensidad.
- Separar comportamientos temporales de los frecuenciales.
- Hacer **filtrados en frecuencia** con razonamiento matemático.
- Está presente en todo (móvil, satélites, Internet…); considerada uno de los mayores avances matemáticos.

---

## 8.4. La transformada de Fourier

### Series de Fourier (funciones periódicas)
- Fourier entendió que cualquier función `f(t)` **real** y **periódica de período T** puede expresarse como una **suma infinita de senos y cosenos** cuyas frecuencias son **múltiplos** de la frecuencia fundamental `f0 = 1/T`:

  `f(t) = a0 + Σ_{n=1}^{∞} [ aₙ·cos(2π·n·f0·t) + bₙ·sin(2π·n·f0·t) ]`

- Las funciones sinusoidales son **ortogonales** entre sí (no se pueden expresar como combinación lineal unas de otras) y tienen muy buenas propiedades: continuidad, derivabilidad, ortogonalidad respecto al producto escalar.
- Los **coeficientes** `aₙ`, `bₙ` son el **producto escalar** de `f(t)` con la sinusoidal correspondiente → es la **proyección** de `f(t)` sobre esa sinusoidal.
  - Cuanto **más se parezca** `f(t)` a una sinusoidal de cierta frecuencia, **mayores** serán sus coeficientes (el producto escalar mide el parecido entre funciones).
- El gráfico de `aₙ` y `bₙ` en función de `n` (o de la frecuencia) es el **espectro de frecuencias** de la función.

### Series de Fourier en el espacio complejo
- Extensión a valores complejos (necesaria para modelar fenómenos como los campos electromagnéticos). Usa la **fórmula de Euler**:

  `e^{iθ} = cos(θ) + i·sin(θ)`

- Permite escribir la serie como suma de **exponenciales complejas**; de nuevo, los coeficientes son la proyección de `f(t)` sobre dichas exponenciales.

### Definición de la transformada de Fourier
- La transformada de Fourier **extiende la serie de Fourier a funciones NO periódicas** (como si fueran periódicas con **período infinito**): es un proceso límite.

  Directa:  `F(ω) = ∫_{-∞}^{+∞} f(t)·e^{-iωt} dt`

  Inversa:  `f(t) = (1/2π) ∫_{-∞}^{+∞} F(ω)·e^{+iωt} dω`

- `ω` es la variable de la transformada, **proporcional a la frecuencia**: `ω = 2π·f`. Se usa `ω` para no confundir la *F* de Fourier con la *f* de frecuencia. `F(ω)` **ya no tiene información del tiempo** (t es la variable de integración y desaparece).
- **No se pierde información** al hacer la transformada (es reversible).
- ⚠️ `F(ω)` vive en el **espacio complejo**: es una entelequia matemática, **no hay dispositivo que la "vea"**. Solo se puede **aproximar su módulo** `|F(ω)|` por computación.

### Ejemplos de pares de transformadas
- **Función constante** (p. ej. componente continua/DC o ruido constante): su energía se concentra en torno a la **frecuencia cero** (una constante no tiene frecuencia). Por eso las componentes constantes son fácilmente **eliminables por filtros**.
- **Función sinusoidal** (tono puro): se transforma en **dos deltas de Dirac** (en `+f` y `−f`). Lógico: un tono puro solo tiene una frecuencia. Aparecen a ambos lados porque se trabaja en el dominio complejo (frecuencias negativas existen matemáticamente, aunque no físicamente).

### Ejemplos con datos reales
- **Voz:** su transformada ocupa un ancho de banda de **~4 kHz**. Por eso los móviles **filtran** todo lo que esté por encima de ~4 kHz y transmiten solo frecuencias menores (voz nítida, menos ruido).
- **Imagen (FT 2D):** más difícil de interpretar pero válida.
  - Patrones puros (rayas verticales/horizontales) dan transformadas características.
  - Permite **extraer características** que identifican el contenido (p. ej. caracteres manuscritos: letras circulares como «B»/«Q» dan componentes distintas a «T»/«K»).
  - Sirve para **detectar/eliminar ruido**: al desenfocar, las componentes espectrales varían (se pierde nitidez) y el ruido aparece muy marcado (una raya blanca que pasa por el origen).

---

## 8.5. Transformada discreta de Fourier (DFT) y FFT

### DFT (Discrete Fourier Transform)
- La transformada continua está pensada para **señales continuas**. Para señales **discretizadas (digitales)** se usa la **DFT**.
- Características frente a la continua:
  - Ya no se habla de `f(t)` sino de **secuencias**; se usan variables entre **corchetes** `x[n]`.
  - El **sumatorio está acotado entre 0 y N−1** (secuencia de longitud N, puede no ser periódica).
  - **No existe el concepto de frecuencia** continua, sino la variable **`k`** (discreta); la DFT tiene los **mismos N puntos** que la secuencia original.

  `X[k] = Σ_{n=0}^{N-1} x[n]·e^{-i·2π·k·n/N}`,  con `k = 0, 1, …, N−1`

  (El factor `1/N` suele dejarse para la **transformada inversa**.)
- El **número de muestras** elegido afecta a la **resolución/calidad** de la DFT; existe un número óptimo para evitar que aparezca ruido.

### FFT (Fast Fourier Transform)
- Es la **implementación más eficiente** de la DFT (no una transformada distinta): la mejor aproximación actual, incluida en la mayoría de lenguajes de programación.
- **Reduce la complejidad de `O(N²)` a `O(N·log N)`** → avance notable.
- **Limitación:** las secuencias deben tener longitud **múltiplo/potencia de 2** para facilitar y paralelizar el cálculo.
- Historia: la original la crearon **Cooley y Tukey (IBM, 1960s)**, revisada por **C. S. Burrus (Rice University)**; permitió procesar voz en dispositivos muy limitados. Hoy hay muchas implementaciones según el objetivo (rapidez, precisión, consumo…).

---

## Ideas clave

- **Análisis en frecuencia:** separa señales solapadas en el tiempo pero distintas en frecuencia; mide el parecido con cada frecuencia vía **producto escalar**.
- **Series de Fourier:** `f(t)` periódica = suma de senos/cosenos ortogonales; coeficientes = proyección (producto escalar). Espectro = coeficientes vs frecuencia.
- **Euler:** `e^{iθ} = cosθ + i·sinθ` (base de la versión compleja).
- **Transformada de Fourier:** extiende las series a señales **no periódicas**; `F(ω)`, `ω = 2πf`; reversible y sin pérdida; compleja (solo se ve `|F(ω)|`).
- **Pares típicos:** constante → energía en f=0; sinusoide → dos **deltas de Dirac**. Voz ≈ 4 kHz.
- **DFT:** versión para secuencias discretas `x[n]`, variable `k`, suma de 0 a N−1, N puntos.
- **FFT:** implementación eficiente de la DFT, `O(N²) → O(N·log N)`, requiere longitud potencia de 2 (Cooley-Tukey).
