# Tema 9 — Procesamiento de Imagen. Morfología Matemática

> **Asignatura:** Visión Artificial · Máster en Inteligencia Artificial (UNIR)
> **Bloque 2:** Procesamiento Digital de Imagen

**Índice:** 9.2 Introducción · 9.3 Elemento estructural · 9.4 Erosión y dilatación · 9.5 Apertura y clausura · 9.6 Gradiente morfológico · 9.7 Top Hat · 9.8 Ejercicio práctico.

---

## 9.2. Introducción a la morfología matemática

- Rama de las matemáticas que estudia el **análisis y tratamiento de estructuras geométricas** basándose en **topología y geometría**.
- **Origen:** Escuela de Minas de París, tesis doctoral de **Jean Serra**, supervisada por **Georges Matheron**.
- **Utilidad principal:** **simplificar el aspecto visual** de una imagen **conservando sus características/composición principales**: eliminar detalles, ruido o componentes que distraigan a otros algoritmos de segmentación.
- Ayuda mucho a **postprocesar el resultado de una segmentación** (eliminar residuos de sobresegmentación, suavizar contornos, unir/separar objetos).
- Se aplica a señales 1D, pero su mayor uso es en **imágenes binarias** y en **escala de grises**.
- ⚠️ Los operadores morfológicos **no** aportan información sobre la forma ni **extraen características** por sí mismos: sirven para **limpiar** imágenes (segmentadas u originales) y que la posterior extracción de características sea más precisa.

**Efecto de los operadores (visión general):**
- **Dilatación + Clausura (closing):** potencian la **eliminación de detalles** de la superficie, quedándose con la **forma** global.
- **Erosión + Apertura (opening):** potencian los **detalles** (p. ej. las hebras de una hoja).
- **Apertura y clausura CONSERVAN** el tamaño y las proporciones de la imagen original. **Erosión y dilatación NO** las conservan.

---

## 9.3. Elemento estructural (B)

- Ingrediente esencial (también "elemento estructurante"). Su función es análoga a la **máscara de un filtro** (p. ej. gaussiano).
- Es un **elemento matricial** (mínimo **3×3** píxeles) que **recorre la imagen de forma iterativa**; los operadores morfológicos actúan sobre él.
- Un operador morfológico actúa como la **suma de todos los efectos** producidos sobre el elemento estructural al recorrer la imagen.
- **Debe parecerse lo más posible a lo que se quiere encontrar/procesar.** Ejemplos de formas: **disco** (también llamado **hexágono**, porque un círculo no se aproxima perfectamente en una matriz pixelada), **línea** (con cierta longitud y orientación, p. ej. 90°/180°), **cruz**, **diamante**, etc.
- Por sí solo carece de sentido: se entiende junto a los operadores.

---

## 9.4. Erosión y dilatación

Son los operadores **esenciales**; a partir de ellos se construyen los demás.
⚠️ **La erosión NO es la inversa de la dilatación** (ni viceversa), aunque en algún caso concreto lo parezca.

### Dilatación `A ⊕ B`
- **Potencia/aumenta los contornos** de una imagen binaria: magnifica detalles y puede **fusionar** objetos que estaban separados pero cercanos.
- **Regla (iterativa):** si el elemento estructural B coincide en **al menos un píxel** con la imagen A, se **añade B** en esa posición → la imagen crece por los contornos (se mantiene en el interior).
- **Resultado:** **más** píxeles en blanco que el original. **No conserva** la forma original.
- Útil cuando, tras una segmentación, hay objetos separados pero cercanos que conviene unir.

### Erosión `A ⊖ B`
- **Elimina detalles, reduce contornos** y, en algunos casos, **desune** objetos.
- **Regla (iterativa):** si el elemento estructural B está **contenido íntegramente** en A, se conserva la posición central → el contorno se reduce considerablemente.
- **Resultado:** **menos** píxeles en blanco. **No conserva** la forma original.
- Útil para **contar objetos** (menos píxeles que procesar) o **localizar el centro** de un objeto (reduce contornos/detalles).

> `A` = imagen original · `B` = elemento estructural · `E` = generalización del espacio euclídeo (todos los puntos posibles, incluidos los de A).

---

## 9.5. Apertura y clausura

Son los primeros operadores **combinación** de varias operaciones. Su gran propiedad: **respetan la morfología/forma original** (combinan efectos de erosión y dilatación pero **mantienen la proporción**).

### Apertura (Opening) `A ∘ B = (A ⊖ B) ⊕ B`
- **Erosión seguida de dilatación.**
- Sirve principalmente para **separar objetos** y **eliminar detalles pequeños** (según el elemento estructural), **manteniendo los objetos grandes**.
- Ej.: con un disco de radio 5 px elimina los puntos pequeños y conserva los objetos grandes.

### Clausura (Closing) `A • B = (A ⊕ B) ⊖ B`
- **Dilatación seguida de erosión.**
- Sirve para **reafirmar y consolidar formas** (rellenar huecos, unir en un bloque).
- Ej.: con un disco de radio 20 px transforma una figura fragmentada en un solo bloque.

---

## 9.6. Gradiente morfológico

- Se define como la **diferencia entre la dilatación y la erosión**:

  `Gradiente = (A ⊕ B) − (A ⊖ B)`

- Como la dilatación agranda y la erosión encoge, su diferencia resalta los **bordes** de la imagen → sirve para **detección de bordes**. (Ej.: granos de arroz con disco de radio 3 px.)

---

## 9.7. Top Hat

- Se define como la **diferencia entre la imagen original y su apertura**:

  `Top Hat = A − (A ∘ B)`

- Devuelve una imagen con **solo los detalles que la apertura eliminó**.
- Muy útil para **detectar detalles finos**, p. ej. **leer el texto/marcas de una moneda**. En cambio, **no** aporta valor para **contar** las monedas (se centra en los detalles, no en los objetos).

---

## 9.8. Ejercicio práctico (quedarse solo con el fotógrafo)

Objetivo: conservar al fotógrafo y eliminar la cámara (trípode) y el fondo.
1. **Clausura** con un elemento estructural de **línea perpendicular a las patas** de la cámara (p. ej. línea de 45 px a 45°) → difumina/elimina las patas conservando la forma del fotógrafo.
2. **Apertura** → consolida las formas y elimina las líneas residuales del paso anterior.
3. **Aplicar el filtro** a la imagen original **multiplicando** ambas imágenes **componente a componente** → se elimina fondo y cámara; además el reescalado deja ver más detalles del abrigo.

**Referencia:** González, R. C. y Woods, R. E. (2008). *Digital Image Processing*. Pearson.

---

## Ideas clave

- **Morfología matemática:** simplifica la imagen conservando su forma; limpia segmentaciones. No extrae características por sí sola. Sobre todo en imágenes **binarias** y de **grises**.
- **Elemento estructural (B):** matriz ≥3×3 que recorre la imagen; debe parecerse a lo buscado (disco/hexágono, línea, cruz…).
- **Dilatación `A⊕B`:** agranda contornos, une objetos, **más** blancos. **Erosión `A⊖B`:** reduce contornos, desune, **menos** blancos. **No** son inversas.
- **Apertura `(A⊖B)⊕B`:** erosión→dilatación; separa y quita detalles pequeños. **Clausura `(A⊕B)⊖B`:** dilatación→erosión; consolida/rellena. Ambas **conservan la forma**.
- **Gradiente morfológico = dilatación − erosión** → bordes.
- **Top Hat = original − apertura** → detalles finos (p. ej. marcas de una moneda).
- La **apertura** consume más cómputo que la dilatación sola (son dos operaciones).
