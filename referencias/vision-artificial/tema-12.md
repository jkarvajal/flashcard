# Tema 12 — Extracción de Características. Caracterización de Textura en Imágenes

> **Asignatura:** Visión Artificial · Máster en Inteligencia Artificial (UNIR)
> **Bloque:** Extracción de características

**Índice:** 12.2 Matriz de coocurrencia de Haralick · 12.3 Patrones binarios locales (LBP) · 12.4 Caracterización basada en transformadas unitarias.

---

## Introducción — ¿Qué es la textura?

- **No hay consenso** sobre su definición. De forma operativa:
  > La **textura** es una propiedad relacionada con la **aspereza de una superficie**, caracterizada por la **variación de la intensidad de los píxeles en el dominio espacial**.
- Aparece en imágenes de muy distinta naturaleza (tejidos biológicos, terrenos, piel…). Es clave en **diagnóstico médico**, **teledetección** e **identificación biométrica**.
- Para identificar una textura, el primer paso es extraer **descriptores** que la diferencien. Tres métodos en este tema:
  1. **Matriz de coocurrencia de Haralick.**
  2. **Patrones binarios locales (LBP).**
  3. **Caracterización basada en transformadas unitarias** (dominio transformado).

---

## 12.2. Matriz de coocurrencia de Haralick (GLCM)

- La textura se caracteriza por la **relación espacial** entre las intensidades de los píxeles. La matriz de coocurrencia refleja esas relaciones para una **dirección** entre píxeles vecinos: **0°, 45°, 90° y 135°**.
- Es una matriz **cuadrada de dimensión `N_g × N_g`**, donde `N_g` es el **número de niveles de gris** usados en la cuantificación.
- El elemento **(i, j)** se obtiene **contando cuántas veces** un píxel de intensidad `i` es **adyacente** a uno de intensidad `j`; luego se **divide por el número total de comparaciones** → cada elemento es la **probabilidad** de que un píxel `i` sea adyacente a uno `j` (según la dirección/distancia).
- Comúnmente se usa **`N_g = 8`** y se calculan las **cuatro matrices** (una por ángulo).
- A partir de la matriz se derivan **descriptores estadísticos** (NO se usa la matriz directamente): **momento angular de segundo orden / energía, contraste, entropía, media, varianza y correlación**.

---

## 12.3. Patrones binarios locales (LBP)

- **LBP (Local Binary Patterns):** transformación **píxel a píxel**; el nuevo valor de un píxel se obtiene **comparando su intensidad con la de sus vecinos**.
- **Ventajas:**
  - **Robustez frente a cambios monótonos de la escala de grises** (variaciones de iluminación / ruido).
  - **Simplicidad computacional** → útil en entornos de **tiempo real**.
- Describe la textura mediante dos medidas complementarias: **patrones espaciales locales** + **contraste de escala de grises**. Operador original de **Ojala (1996)**.

**Procedimiento (para cada píxel):**
1. Tomar la muestra de píxeles **vecinos** (si un vecino no cae exactamente en un píxel, se **interpola** de los más próximos).
2. Calcular la **diferencia** del píxel central con cada vecino.
3. Aplicar **umbral 0** sobre la diferencia (≥0 → 1; <0 → 0) → **cadena binaria**.
4. Convertir la cadena binaria en su **número decimal** → etiqueta del píxel.

- **Notación `(P, R)`:** **`P` puntos de muestreo** en un **círculo de radio `R`**.
- Cada píxel recibe una de **`2^P` etiquetas**. Con `P = 8` → **256 etiquetas** → el **histograma** de etiquetas es el **descriptor de textura**.
- **Limitaciones:** histograma con muchos **ceros** (muchas etiquetas sin asignar) y **sensibilidad a la rotación**.

### Patrones uniformes
- Un LBP es **uniforme** si su cadena de bits tiene **como máximo 2 transiciones** 0↔1.
  - Uniformes: `00000000` (0), `00001110` (2), `11110011` (2).
  - NO uniformes: `00110110` (4), `10101101` (6).
- Se usa **una única etiqueta para todos los no uniformes** y una etiqueta distinta por cada uniforme. Hay **`P + 1` patrones uniformes** → **`P + 2` etiquetas** en total.
  - Ej.: vecindario `(8, 1)` → 256 patrones, **58 uniformes** → **59 etiquetas**.
- Ojala observó que los uniformes son ≈ **90 %** de los casos con `(8,1)` y ~**70 %** con `(16,2)`. Cada etiqueta es un **microtexton** (microestructura: bordes curvos, manchas, zonas planas…).

### LBP invariante a rotación (LBPriu2)
- Se obtiene **rotando circularmente** cada patrón de bits hasta su **valor mínimo**.
  - Ej.: `1000011`, `1110000`, `0011100` son rotaciones del mismo patrón → todas se normalizan a `0000111`.
- ⚠️ El **LBP original NO es invariante a rotación**; lo es la extensión basada en patrones uniformes/mínimo.

---

## 12.4. Caracterización basada en transformadas unitarias

- Representan la imagen (señal `f` en el espacio) en un **espacio transformado**, proyectándola sobre **funciones unitarias (ortonormales)** que forman una **base**.
- Esas funciones base suelen ser **sinusoidales**: como la textura es **repetición de estructuras**, proyectar la imagen sobre un **tren de pulsos/sinusoides** equivale a **muestrear** su superficie y **capturar las repeticiones** → por eso son eficientes para la textura.
- Ejemplos de transformadas: **Fourier**, **coseno (DCT)** y **Chebishov (Tchebichef)**.

### Momentos de Chebishov (Tchebichef)
- Son los **coeficientes** de la transformada de Chebishov. Definidos por **Mukundan (2001)** para superar las limitaciones de los momentos de **Zernike** y **Legendre**.
- Se calculan **proyectando la imagen** sobre el **polinomio de Chebishov**. El polinomio 2D es el **producto de dos polinomios 1D**: `T_mn(x,y) = T_m(x)·T_n(y)`.
- **Relación orden ↔ frecuencia** (Marcos y Cristóbal, 2013): **órdenes mayores ↔ mayores frecuencias de muestreo**. Un momento `T_n` de mayor magnitud que `T_m` (con `n > m`) indica que la imagen contiene **estructuras que se repiten con mayor frecuencia**. Texturas de **elementos pequeños y muy repetidos** → **momentos de orden alto grandes**.

### Firma de textura
- Se caracteriza la textura mediante la **suma de las magnitudes (módulos) de los momentos de un mismo orden `s`** → una **curva** función del orden `s`.
- Un **muro de ladrillo** (estructuras grandes) da un **pico en valores bajos de `s`**; **arena/tejido** (estructuras pequeñas y numerosas) concentran la firma en **valores altos de `s`**.
- El efecto de este operador es similar al de un **banco de filtros paso banda** centrados en diferentes frecuencias.

---

## Ideas clave

- **Textura:** aspereza/variación de intensidad en el dominio espacial; **sin definición única**. Útil en medicina, teledetección y biometría.
- **Haralick (GLCM):** matriz `N_g×N_g` (típico `N_g=8`, 4 direcciones 0/45/90/135°); elemento (i,j) = prob. de adyacencia i→j. De ella se derivan **estadísticos** (energía, contraste, entropía, correlación…).
- **LBP:** umbral de vecinos respecto al centro → cadena binaria → decimal. Robusto a iluminación, rápido. `(P,R)` = P vecinos en radio R → `2^P` etiquetas. **No** invariante a rotación.
- **Patrones uniformes:** ≤2 transiciones; `P+2` etiquetas (uno para todos los no uniformes). (8,1) → 59 etiquetas, ~90 % uniformes. **LBPriu2** = rotar al valor mínimo.
- **Transformadas unitarias:** base ortonormal sinusoidal que muestrea las repeticiones de la textura. **Momentos de Chebishov** (Mukundan 2001); orden alto ↔ alta frecuencia. **Firma de textura** = suma de módulos por orden `s` (≈ banco de filtros paso banda).
