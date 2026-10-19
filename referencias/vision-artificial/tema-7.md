# Tema 7 — Procesamiento de Imagen. Operaciones Espaciales

> **Asignatura:** Visión Artificial · Máster en Inteligencia Artificial (UNIR)
> **Bloque 2:** Procesamiento Digital de Imagen
> **Docente:** Alexandre Pérez Reina

**Problema planteado:** ¿Cómo la consideración de la información **espacial** en el procesamiento de imágenes puede optimizar resultados en reconocimiento/segmentación?

**Índice:** 1) Introducción · 2) La convolución · 3) Filtros Paso-Bajo y Paso-Alto · 4) Detección de bordes.

---

## 1. Introducción

Recordatorio (del Tema 6):

| | **Punto a punto** | **Espaciales** |
|---|---|---|
| Cálculo | Cada píxel de salida se calcula de forma **independiente** | Cada píxel usa su valor **y el de sus vecinos** |
| Vecindario | No lo tienen en cuenta | Usan info del **contexto local** |
| Coste | Rápidas | Más costosas |
| Uso | Modificar intensidades individuales | **Detección de bordes** y de objetos |

- En las operaciones **espaciales**, el valor del píxel resultante es **función del píxel original y de su vecindad**.
  - `v` = valor de intensidad del píxel resultante.
  - `u` = píxel correspondiente de la imagen original.
  - `λ` = coeficientes de la **máscara** (kernel) del operador espacial.

---

## 2. La convolución

- Es la operación base de los operadores espaciales: se desliza una **máscara/kernel** (p. ej. 3×3 con coeficientes `λ1…λ9`) sobre la imagen, multiplicando y sumando con la vecindad de cada píxel.

### ¿Por qué se usa la convolución en visión artificial?
- Porque los **inputs** de una red neuronal serían demasiado grandes si conectáramos cada píxel:
  - Imagen 100×100 → **10.000 inputs**.
  - Imagen de alta calidad 2550×1440×3 → **11.016.000 inputs** (¡y cada input con sus pesos!).
- La convolución permite compartir una máscara pequeña por toda la imagen (menos parámetros).

### Tamaño de la imagen resultante
- Con una imagen de `n×n` y un filtro de `f×f` (sin padding):

  `(n − f + 1) × (n − f + 1)`

- Ejemplo: imagen 6×6 con filtro 3×3 → resultado **4×4**.

### Dos problemas de la convolución
1. Si seguimos convolucionando, la imagen **se reduce** en cada operación.
2. Los píxeles de las **esquinas/bordes** se usan **menos** que los centrales → **se pierde información** de los bordes.

### Solución: Padding
- Añadir píxeles (`p`) alrededor de la imagen inicial. Con padding, el tamaño de salida es:

  `(n + 2p − f + 1) × (n + 2p − f + 1)`

- Ejemplo: imagen 6×6, `p=1`, `f=3` → `6 + 2·1 − 3 + 1 = 6` → resultado **6×6** (igual al original).
- **Valid convolution:** **sin** padding.
- **Same convolution:** **con** padding, de modo que tamaño de salida = tamaño de entrada.
- El parámetro `f` del filtro suele ser **impar** (para tener un píxel central bien definido).

### Stride (paso)
- Normalmente nos desplazamos **1 celda** por operación. Con **stride `s`**, nos desplazamos `s` posiciones cada vez, lo que **reduce** el tamaño de salida:

  `⌊(n + 2p − f)/s + 1⌋ × ⌊(n + 2p − f)/s + 1⌋`

- Si el resultado no es entero se **redondea (hacia abajo)**; si la máscara se **sale** de la región, no se computa.

### Convolución en RGB (volúmenes)
- Hasta aquí pensábamos en 1 dimensión (escala de grises). En **RGB** se hacen **convoluciones en volúmenes**: el filtro tiene profundidad 3 (una por canal) y la operación es igual que antes (multiplicar y sumar sobre el volumen).

---

## 3. Filtros Paso-Bajo y Paso-Alto

### Filtro Paso-Bajo (suavizado / blur)
- Calcula el **promedio** a partir de los valores de los píxeles vecinos.
- **Atenúa las variaciones bruscas** de intensidad → suaviza y reduce ruido.
- Útil cuando **no** tenemos un conjunto de imágenes similares (a diferencia del promedio de imágenes del Tema 6).
- **Box Filter:** todos los coeficientes de la máscara son **iguales** (aunque no tienen por qué serlo).
- **A mayor tamaño de filtro:** mayor eliminación de ruido, pero **más desenfoque** (pérdida de detalle).

### Filtro Paso-Alto (realce / bordes)
Se basan en **derivadas** para responder a los cambios de intensidad:

- **Derivadas de primer orden:**
  - Producen **bordes más gruesos**.
  - Reacción marcada ante variaciones abruptas de intensidad con forma **escalonada** (escalón).

- **Derivadas de segundo orden:**
  - Responden de forma **más intensa a elementos pequeños** (líneas finas, puntos individuales).
  - Suelen generar una **respuesta doble** ante transiciones tipo escalón.
  - Reacción: más intensa en **puntos** que en líneas finas, y en estas más que en un cambio escalonado.

---

## 4. Detección de bordes

- Se usan **filtros paso-alto** basados en el cálculo del **gradiente** para detectar bordes.

| Operador | Máscara | Uso / característica |
|----------|---------|---------------------|
| **Roberts** | 2×2 | Gradiente en **diagonales** (una máscara a 135°, otra a 45°). |
| **Prewitt** | 3×3 | Bordes **horizontales** y **verticales**; coeficientes iguales en la fila/columna. |
| **Sobel** | 3×3 | Similar a Prewitt, pero da **más peso a los píxeles cercanos** al píxel objetivo. |

- (Prewitt) *¿Qué pasaría si los "10" estuvieran a la izquierda?* Cambiaría el **signo** del gradiente detectado; la solución habitual es tomar el **valor absoluto** de la respuesta.

### Algoritmo de Canny
Una de las transformaciones **más utilizadas**. Objetivo: identificar **bordes significativos** minimizando el ruido y maximizando la precisión. Pasos:

1. **Suavizado** de la imagen con un **filtro gaussiano** para reducir el ruido.
2. **Cálculo del gradiente** (derivadas horizontal/vertical, normalmente con **Sobel**): magnitud y dirección en cada píxel.
3. **Non-Maximum Suppression:** adelgaza/refina los bordes dejando solo los máximos locales.
4. **Umbralado con histéresis:** dos umbrales (**alto** y **bajo**). Píxeles con gradiente > umbral alto = **bordes fuertes**; entre ambos umbrales = **débiles** (se conservan si conectan con uno fuerte); por debajo del bajo = **se descartan**.

---

## Ideas clave

- **Operación espacial:** el píxel de salida depende de su vecindad (máscara/kernel).
- **Convolución:** base de todo; tamaño de salida `(n − f + 1)` sin padding.
- **Padding (`p`):** evita el encogimiento y la pérdida de bordes → *same* vs *valid*. `f` suele ser impar.
- **Stride (`s`):** desplazamiento del filtro; reduce el tamaño → `⌊(n+2p−f)/s + 1⌋`.
- **Paso-bajo:** promedia, suaviza, quita ruido (box filter); más grande = más blur.
- **Paso-alto:** derivadas; 1er orden = bordes gruesos/escalón, 2º orden = puntos y líneas finas.
- **Bordes:** Roberts (2×2, diagonales), Prewitt (3×3), Sobel (3×3, pondera vecinos cercanos), **Canny** (gauss → gradiente → NMS → histéresis).
