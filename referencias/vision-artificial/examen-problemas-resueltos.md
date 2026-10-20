# Visión Artificial — Problemas tipo examen (resueltos)

> **Fuente:** documento *"Ejercicios Visión Artificial"*, A. Moujahid (diciembre 2025), Máster en IA (UNIR).
> 17 problemas de desarrollo con su solución paso a paso. Son el tipo de ejercicio que cae en el examen
> (decibelios, transformaciones de intensidad, convolución/correlación y detección de bordes,
> filtro gaussiano, histograma y morfología matemática).
>
> **Formato del examen:** 90 min, con calculadora, 2 ejercicios (uno de 6 y otro de 4 puntos), sin código.

---

## Bloque A — Decibelios e intensidad sonora

### Problema 1
Un sonido tiene una intensidad de `I = 10⁻¹⁰ W/m²`. ¿Cuál es su nivel de intensidad sonora en dB?

**Solución.** `L = 10·log₁₀(I/I₀)` con `I₀ = 10⁻¹² W/m²`.
`L = 10·log₁₀(10⁻¹⁰/10⁻¹²) = 10·log₁₀(10²) = 10·2 = **20 dB**`.

### Problema 2
El sonido A tiene **400 veces** la intensidad del sonido B. ¿Cuántos dB de diferencia hay?

**Solución.** `ΔL = L_A − L_B = 10·log₁₀(I_A/I_B) = 10·log₁₀(400)`.
Como `400 = 4·100`: `ΔL = 10·log₁₀(4) + 10·log₁₀(100) = 6.02 + 20 = **26.02 dB**`.

### Problema 3
El sonido A es **34 dB** más fuerte que B. ¿Cuántas veces mayor es la intensidad de A?

**Solución.** De `ΔL = 10·log₁₀(I_A/I_B)` → `I_A/I_B = 10^(ΔL/10) = 10^(34/10) = 10^3.4 ≈ **2512 veces**`.

---

## Bloque B — Transformaciones de intensidad

### Problema 4
Transformación lineal global `s = a·r + b` (imagen 8 bits). Original `r_min=35, r_max=190`; se mapean a `s_min=10, s_max=240`. Halla `a` y `b`.

**Solución.**
`a = (s_max − s_min)/(r_max − r_min) = (240−10)/(190−35) = 230/155 = 46/31 ≈ **1.484**`.
`b = s_min − a·r_min = 10 − (46/31)·35 = −1299/31 ≈ **−41.94**`.
→ `s ≈ 1.484·r − 41.94`.

### Problema 5
Ley de potencia `s = c·r^γ` (8 bits). Se sabe que `s(64)=16` y se desea `s(255)=255`. Halla `c` y `γ`.

**Solución.** Sistema: `c·64^γ = 16` y `c·255^γ = 255`.
Dividiendo: `(255/64)^γ = 255/16` → `γ = ln(255/16)/ln(255/64) ≈ **0.405**`.
Sustituyendo: `c = 16/64^0.405 ≈ **1.243**`.

### Problema 6
Transformación **lineal a trozos** que pasa por `(0,0), (64,48), (160,224), (255,255)`. Escribe los tramos, calcula valores y discute contraste.

**Solución.** Pendiente de cada tramo:
- **Tramo 1** `(0 ≤ r ≤ 64)`: por `(0,0)` y `(64,48)` → `a₁ = 48/64 = 3/4`, `b₁ = 0` → `T₁(r) = 0.75·r`.
- **Tramo 2** `(64 ≤ r ≤ 160)`: por `(64,48)` y `(160,224)` → `a₂ = 176/96 = 11/6 ≈ 1.83`, `b₂ = −208/3` → `T₂(r) = (11/6)·r − 208/3`.
- **Tramo 3** `(160 ≤ r ≤ 255)`: por `(160,224)` y `(255,255)` → `a₃ = 31/95 ≈ 0.33`, `b₃ = 3264/19` → `T₃(r) = (31/95)·r + 3264/19`.

**Continuidad:** `T₁(64)=T₂(64)=48`, `T₂(160)=T₃(160)=224` ✓.

**Valores:** `T(32)=24`, `T(64)=48`, `T(100)=114`, `T(160)=224`, `T(220)≈243.6`.

**Contraste** (según la pendiente):
- Oscuros (`a₁=3/4 < 1`): **compresión** (`Δs < Δr`).
- Medios (`a₂=11/6 > 1`): **expansión** (`Δs > Δr`).
- Brillantes (`a₃=31/95 < 1`): **compresión**.

---

## Bloque C — Filtros espaciales, convolución y detección de bordes

### Problema 7
Filtro gaussiano 3×3 `(1,2,1; 2,4,2; 1,2,1)/16`, **padding por replicación**, sobre:
```
20 20 40 40
20 20 40 40
60 60 80 80
60 60 80 80
```
Calcula la salida en los píxeles (2,2) y (3,3).

**Solución.**
- (2,2): ventana `20 20 40 / 20 20 40 / 60 60 80` → suma ponderada = 480 → `480/16 = **30**`.
- (3,3): ventana `20 40 40 / 60 80 80 / 60 80 80` → = 1000 → `1000/16 = **62.5**`.
- Son **únicos** porque ambas ventanas caen dentro de la imagen (no tocan el borde replicado).

### Problema 8
Filtro **Laplaciano** `(0,−1,0; −1,4,−1; 0,−1,0)` sobre una 5×5 con centro 120 y sus 4 vecinos = 80. Calcula `g(3,3)`, el `α` para que `f_R = f + α·g = 200`, e indica si hay saturación.

**Solución.**
`g(3,3) = 4·120 − (80+80+80+80) = 480 − 320 = **160**`.
`f_R = f + α·g` → `120 + 160·α = 200` → **α = 0.5**.
Máscara con centro positivo → realza bordes; `α=0.5 < 1` → realce moderado. `f_R = 200 ∈ [0,255]` → **no satura**.

### Problema 9
Subimagen `20 20 20 / 20 20 20 / 200 200 200`. Diseña un filtro 3×3 que, por **correlación**, resalte un **borde horizontal**. Describe la convolución.

**Solución.** Filtro con fila superior negativa e inferior positiva:
```
−1 −1 −1
 0  0  0
 1  1  1
```
Por **correlación**, da respuesta positiva donde arriba es oscuro y abajo claro → localiza el borde horizontal.
Por **convolución**, el filtro se **gira 180°** (`1 1 1 / 0 0 0 / −1 −1 −1`) y la respuesta se desplaza: **no** localiza bien el borde.

### Problema 10
Subimagen con **borde vertical** `180 180 20` (×3 filas). Diseña un filtro que resalte la transición **claro→oscuro** (claro a la izquierda).

**Solución.** Filtro con columna izquierda positiva y derecha negativa:
```
1 0 −1
1 0 −1
1 0 −1
```
Por **correlación**, respuesta positiva donde la izquierda es clara y la derecha oscura.
Por **convolución** se gira 180° y la respuesta se concentra mal (no marca el borde entre columnas 2 y 3).

### Problema 11
Filtro diagonal `h = (−1,−2,0; −2,0,2; 0,2,1)` sobre `0 0 50 / 0 50 50 / 50 50 100`. Respuesta central por correlación y por convolución.

**Solución.**
- **Correlación** (filtro tal cual): `= +300`.
- **Convolución** (filtro girado 180°): `= −300`.
- Mismo **módulo (300)**, **signo opuesto**: la convolución realza la misma estructura pero con orientación invertida. La correlación resalta el **borde diagonal** dominante. → En filtros **asimétricos** hay que elegir con cuidado correlación vs convolución.

---

## Bloque D — Filtro gaussiano y corrección de iluminación

### Problema 12
El gaussiano 3×3 `(1,2,1; 2,4,2; 1,2,1)/16` es la discretización de `G(r) = K·e^(−r²/2σ²)`. Estima `σ` y calcula la salida central de `100 102 98 / 103 101 99 / 97 100 102`.

**Solución.**
Posiciones radiales: `G(0)=K=4`, `G(1)=2`, `G(√2)=1`.
De `4·e^(−1/2σ²) = 2` → `1/(2σ²) = ln 2` → `σ² = 1/(2·ln 2)` → **σ ≈ 0.849**.
(Verificación: `G(√2) = 4·e^(−1/σ²) = 4·e^(−2ln2) = 4·(1/4) = 1` ✓.)
Salida central: suma ponderada `= 1609` → `1609/16 = **100.5625**`, muy cercana a la media local (100.22). El gaussiano pondera (centro 0.25, bordes 0.125, esquinas 0.0625): **reduce la varianza del ruido preservando la media**.

### Problema 13
Tablero de ajedrez con sombreado (2048×2048, cuadros 128×128). Se estima el sombreado con un gaussiano grande (512×512) y se corrige dividiendo `(a)/(b)`. ¿Por qué el filtro debe ser varias veces mayor que los cuadros y qué papel tiene `σ`?

**Solución (conceptual).**
- El filtro debe cubrir **varios periodos** del tablero para que el promedio **borre el patrón** (si es más pequeño, quedan residuos del tablero en b). Un soporte de ~6σ contiene el 99.7 % de la energía; con cuadros de 128 px hace falta un filtro de ~512 px (≈4σ con σ=128).
- `σ` es un **selector de escala**: con `σ` del orden del tamaño del cuadro, el filtro **elimina la alta frecuencia** (tablero) y **conserva la baja frecuencia** (sombreado).
- `σ` **muy pequeño** → solo promedia dentro de un cuadro → b ≈ a → **no corrige**.
- `σ` **muy grande** → promedio casi uniforme (media global) → tampoco corrige localmente.

---

## Bloque E — Histograma y morfología

### Problema 14
Dos imágenes **binarias distintas** con el **mismo histograma**. Se aplica un *box filter* 3×3. ¿Siguen teniendo el mismo histograma tras el filtrado?

**Solución.** **No.** El filtrado depende de la **distribución espacial**, no solo del histograma.
En las **zonas de transición** negro↔blanco el promedio genera **grises intermedios**; cuantos más píxeles de borde tenga la imagen, más niveles intermedios aparecen.
→ La imagen más **fragmentada** (más fronteras) obtiene un histograma con **más grises**; la de regiones compactas conserva más píxeles en 0 y 255. Los histogramas resultantes son **diferentes**.

### Problema 15
Imagen `I = (223,0,223; 64,223,64; 32,0,32)` (uint8) y EE en **cruz** `se = (0,1,0; 1,1,1; 0,1,0)`. Calcula erosión, dilatación y gradientes morfológicos.

**Solución.**
En escala de grises: **erosión = mínimo** de los píxeles cubiertos por el EE; **dilatación = máximo** (solo el centro y los 4 vecinos de la cruz).
Ej.: centro 223 con vecinos arriba/abajo = 0 e izq/der = 64 → **erosión → 0**, **dilatación → 223**. Se recorre toda la imagen (padding por replicación).
**Gradiente interno** = `I − erosión(I)`; **gradiente externo** = `dilatación(I) − I`. Ambos resaltan los bordes.

### Problema 16
Misma imagen `I`, pero con EE **línea horizontal** `se = (1 1 1)`. Erosión, dilatación y gradientes.

**Solución.** El EE cubre el píxel y sus vecinos **izquierdo y derecho**.
**Erosión = mínimo** de la terna; **dilatación = máximo**.
Ej.: centro 223 con izq = 64, der = 64 → **erosión → 64**, **dilatación → 223**.
Gradiente interno = `I − erosión`; externo = `dilatación − I`. (La diferencia con el P15 es la **forma** del EE: aquí solo actúa en horizontal.)

### Problema 17
Imagen binaria `B` con monedas (las pequeñas tienen radio ≈ 24 px). Interpreta: (1) apertura de `B` con `se = 25`; (2) dilatación del resultado con `se = 4`; (3) `AND` de `B` con el resultado de (2).

**Solución.**
1. **Apertura con radio 25 > 24** → **elimina las monedas pequeñas** (y el ruido), dejando solo las **grandes** (algo encogidas).
2. **Dilatación con se = 4** → **recupera el tamaño** de las monedas grandes.
3. **AND con B** → usa el resultado como **máscara** sobre la imagen original → quedan **solo las monedas grandes** con su forma exacta.
→ Método clásico para **separar/seleccionar objetos por tamaño**.

---

## Temas que cubren estos problemas

| Problemas | Tema |
|-----------|------|
| P1–P3 | Tema 1-2 · Percepción (decibelios, Weber-Fechner) |
| P4–P6, P13, P14 | Tema 6 · Operaciones elementales (intensidad, histograma) |
| P7–P12 | Tema 7 · Operaciones espaciales (convolución, filtros, bordes) |
| P15–P17 | Tema 9 · Morfología matemática |
