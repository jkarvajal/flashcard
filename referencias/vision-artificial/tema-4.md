# Tema 4 — Fuentes y Tipos de Ruido

> **Asignatura:** Visión Artificial · Máster en Inteligencia Artificial (UNIR)
> **Bloque 1:** Percepción Visual y Auditiva: Digitalización y Cancelación de Anomalías
> **Docente:** Alexandre Pérez Reina

**Problema planteado:** ¿Cómo identificar alteraciones significativas en la distribución de energía de una señal?

**Índice:** 1) Entropía · 2) Fuentes perturbadoras de señales · 3) Caracterización matemática del ruido.

---

## Distribución de energía de una señal
- Describe cómo se reparte la energía de una señal en el tiempo, el espacio o el dominio frecuencial.
- Es un concepto fundamental: proporciona información sobre la **calidad, contenido y características** de una señal.
- **Señal continua** `x(t)`:  `E = ∫_{-∞}^{+∞} |x(t)|² dt`
- **Señal discreta** `x[n]`:  `E = Σ_{n=-∞}^{+∞} |x[n]|²`

---

## 1. La entropía

- En el contexto de señales y teoría de la comunicación: **medida de la cantidad de incertidumbre o información** contenida en una señal.
- Introducida por **Claude Shannon (1947/1948)**.
- La entropía `H(X)` de una fuente de información discreta `X` que emite símbolos `x1, x2, …, xn` con probabilidades `P(x1), …, P(xn)`:

  `H(X) = − Σ_i P(xi) · log2( P(xi) )`

### Interpretación
- **Incertidumbre:** si todos los símbolos son igualmente probables, la entropía es **máxima** (máxima incertidumbre sobre qué símbolo llegará). Si un símbolo tiene probabilidad cercana a 1 y los demás a 0, la entropía es **baja** (casi no hay incertidumbre).
- **Información promedio:** la entropía representa la cantidad promedio de información por símbolo emitido. Un evento **inesperado** aporta más información que uno **predecible**.

### Aplicaciones de la entropía
- **Compresión de datos:** algoritmos para evitar redundancias.
- **Ruido y capacidad de canal:** la entropía afecta a la capacidad del canal.
- **Análisis de señales:** identificación de patrones (p. ej. señales biomédicas como EEG o ECG).

### Ejemplo 1 — Fuente binaria equiprobable
Fuente que transmite "0" y "1" con `P(0) = P(1) = 0.5`:

`H(X) = −[0.5·log2(0.5) + 0.5·log2(0.5)] = 1 bit`

Cada bit contiene 1 bit de información. Si en cambio `P(0)=0.9` y `P(1)=0.1`, la entropía sería **menor** (menos incertidumbre, la fuente es más predecible).

### Ejemplo 2 — Fuente de 4 caracteres
`P(A)=0.4, P(B)=0.3, P(C)=0.2, P(D)=0.1`:

- Para A: `−0.4·log2(0.4) = 0.52877`
- Para B: `−0.3·log2(0.3) = 0.52109`
- Para C: `−0.2·log2(0.2) = 0.46439`
- Para D: `−0.1·log2(0.1) = 0.33219`

`H(X) = 0.52877 + 0.52109 + 0.46439 + 0.33219 ≈ 1.8464 bits/carácter`

Como es ≈ 1.85 bits/carácter, **no** necesitamos 2 bits por símbolo (como en una codificación fija para 4 símbolos): se puede codificar de forma más eficiente.

### Entropía máxima
- Se da cuando todos los símbolos son **equiprobables**: `P(xi) = 1/n` para una variable discreta `X` con `n` valores posibles. En ese caso `H_max = log2(n)`.

---

## 2. Fuentes perturbadoras de señales

- **Ruido:** cualquier interferencia **no deseada** que se mezcla con la señal original, degradando su calidad o alterando su interpretación:

  `S(t) = f(t) + r(t)`   (señal observada = señal original + ruido)

### Proyecto ilustrativo: magnetómetro autónomo
- **Objetivo:** medir perturbaciones geomagnéticas debidas a la radiación solar (que provoca cambios en el campo magnético).
- Es **importante elegir bien el emplazamiento** del magnetómetro por el ruido ambiente.
- Primer emplazamiento (laboratorio universitario): **no** es adecuado. Perturbaciones detectadas:
  - **Vías del tren** (fuente de ruido externa).
  - **Temperatura** (deriva de `Δ 1.5 nT/ºC`).
  - **Seres humanos a 1 m:** apenas generan perturbación (las perturbaciones existen independientemente de las personas que pasan).
  - **Dispositivos electrónicos (smartphone a 1 m):** interferencias evidentes.
  - **Agitar llaves a 1 m:** todavía más interferencias.
- **Mejor emplazamiento:** sótano del jardín botánico (bajo ruido).
- **Solución al ruido:** filtros — pero **con cuidado**, porque un filtrado agresivo puede **perder información** útil.

### Tipos de ruido

- **White Noise (ruido blanco):**
  - Distribución de probabilidad con **media 0** y varianza (teóricamente) infinita / densidad espectral plana.
  - Sus elementos son **estadísticamente independientes**.
  - Si la distribución es **normal** con `μ = 0` y varianza `σ²`, es **ruido blanco gaussiano**.

- **Pink Noise (ruido rosa):**
  - Proceso aleatorio con **densidad espectral inversamente proporcional a la frecuencia** (1/f).
  - Ocurre en muchos sistemas físicos y biológicos.

- **Signal to Noise Ratio (SNR):**
  - Relación señal-ruido.
  - SNR **alto** → señal más fuerte y distinguible del ruido.
  - SNR **bajo** → señal más difícil de distinguir del ruido.
  - SNR **negativo** → el nivel de ruido es mayor que el de la señal.
  - Con **imágenes** ocurre lo mismo (más SNR = imagen más limpia).

---

## 3. Caracterización matemática del ruido

- **Procesos estocásticos:**
  - Colección de variables aleatorias que evolucionan con el tiempo (u otra dimensión).
  - Representan sistemas donde los valores de una señal **no** pueden predecirse con certeza, sino que están sujetos a **incertidumbre**.

- **Ejemplo — Random Walk (paseo aleatorio):**
  - Secuencia estocástica `{S_n}` con `S_0 = 0`, formada por la suma sucesiva de variables aleatorias `X_k` **independientes e idénticamente distribuidas** (i.i.d.).
  - Se usa, por ejemplo, como modelo financiero: el mercado de valores se mueve de forma impredecible.

---

## Ideas clave

- **Energía de la señal:** `E = ∫|x(t)|²dt` (continua) o `Σ|x[n]|²` (discreta).
- **Entropía (Shannon):** `H(X) = −Σ P(xi)·log2 P(xi)`; máxima con símbolos equiprobables (`log2 n`).
- **Ruido:** interferencia no deseada, `S(t) = f(t) + r(t)`.
- **Blanco:** media 0, muestras independientes, espectro plano; **gaussiano** si es normal.
- **Rosa:** densidad espectral ∝ 1/f.
- **SNR:** alto = buena señal; negativo = más ruido que señal.
- **Random walk:** suma acumulada de v.a. i.i.d. (proceso estocástico).
