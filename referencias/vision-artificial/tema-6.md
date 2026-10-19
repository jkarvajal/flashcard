# Tema 6 — Procesamiento de Imagen. Operaciones Elementales

> **Asignatura:** Visión Artificial · Máster en Inteligencia Artificial (UNIR)
> **Bloque 2:** Procesamiento Digital de Imagen
> **Docente:** Alexandre Pérez Reina

**Problema planteado:** ¿Cómo abordar el desafío de mejorar la visibilidad de detalles en imágenes?

**Objetivos del bloque 2 (Temas 6–8):**
- Implementar transformaciones de la intensidad.
- Procesar el histograma.
- Diseñar técnicas de mejora de imágenes.
- Diseñar filtros espaciales.
- Analizar una señal en el dominio de la frecuencia.
- Implementar filtros en el dominio de Fourier.
- Comprimir imágenes usando la transformada de Fourier.

**Índice del tema:** 1) Introducción · 2) Ajuste de intensidad · 3) Procesado del histograma · 4) Operadores aritméticos para suavizado y realce.

---

## 1. Introducción

- Recordemos el proceso: ya hemos **capturado la información** (la imagen). Ahora, ¿qué **calidad** tiene?
- **Objetivo del procesado:** capturar la **información relevante** de la imagen.
- **Herramientas disponibles:**
  - **Supresión de ruido** → remarcar contenido.
  - **Ajuste de intensidad** → aumentar el nivel de contraste.
  - **Realce de bordes** → delimitar transiciones.
- **¿Para qué / para quién?** Para **humanos** (mejor visualización) y para **máquinas** (mejor análisis automático).

### Operaciones Punto a Punto vs. Espaciales

| | **Punto a punto** | **Espaciales** |
|---|---|---|
| Cálculo | Cada píxel de salida se calcula de forma **independiente** | Cada píxel de salida usa su valor **y el de sus vecinos** |
| Vecindario | **No** lo tienen en cuenta | Usan info del **contexto local** |
| Coste | Rápidas de implementar | Más costosas |
| Uso típico | Modificar **intensidades individuales** | Detección de **bordes** y de **objetos**, modificar detalles estructurales |

Forma general de una operación punto a punto:  `B(x,y) = T( A(x,y) )`.

---

## 2. Ajuste de intensidad

Transformaciones de la forma `B(x,y) = T(A(x,y))`:

- **Negativo:**
  - Imagen invertida respecto a la original.
  - `T(u) = L − u`  (siendo `L` el nivel máximo, p. ej. 255).
  - Es una transformación **lineal**.

- **Logarítmico:**
  - Mapea un rango pequeño de entrada en uno grande de salida.
  - `T(u) = C · log(1 + u)`.
  - Ideal para **expandir el rango de intensidad de los píxeles oscuros**, equiparando (comprimiendo) los claros.

- **Ley de potencia (gamma):**
  - `T(u) = C · u^γ`.
  - `γ < 1` **expande** el rango de intensidad de los píxeles **oscuros** y **comprime** el de los claros (`γ > 1` hace lo contrario).
  - Variando `γ` se genera una amplia familia de transformaciones.

- **Funciones definidas a trozos:**
  - Permiten especificar con más detalle los rangos sobre los que operar.
  - Inconveniente: requieren más esfuerzo en la definición de la función.

---

## 3. Procesado sistemático del histograma

- **¿Qué proporciona el histograma de una imagen?** Una representación gráfica de la **distribución de intensidades** de los píxeles.
  - **Eje X:** niveles de intensidad de los píxeles (0–255).
  - **Eje Y:** número de píxeles que tienen cada valor de intensidad.
- Analizar y manipular el histograma (p. ej. **ecualización**) permite mejorar el **contraste** de la imagen.

---

## 4. Operadores aritméticos (suavizado y realce)

- La **suma** y la **resta** son las operaciones más comunes y útiles.

- **Resta:** realza **diferencias** entre dos imágenes.
  - `C(x,y) = B(x,y) − A(x,y)`.

- **Suma / promedio:** útil para obtener la **imagen promedio** (reduce ruido aleatorio).
  - `C(x,y) = (1/M) · Σ_{i=1}^{M} A_i(x,y)`, para un conjunto de `M` imágenes `A_i(x,y)`.

---

## Ideas clave

- Procesar imagen = extraer la información relevante (supresión de ruido, ajuste de intensidad, realce de bordes).
- **Punto a punto:** píxel independiente (`B = T(A)`); **espacial:** usa vecinos (bordes/objetos).
- **Negativo:** `T(u)=L−u` (lineal). **Log:** `T(u)=C·log(1+u)` (aclara oscuros). **Gamma:** `T(u)=C·u^γ` (γ<1 aclara oscuros).
- **Histograma:** distribución de intensidades (X: nivel 0–255, Y: nº de píxeles); su procesado mejora el contraste.
- **Resta** de imágenes: realza diferencias. **Promedio** de imágenes: reduce ruido.
