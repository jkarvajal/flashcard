# Tema 10 — Procesamiento de Imagen. Crecimiento de Regiones

> **Asignatura:** Visión Artificial · Máster en Inteligencia Artificial (UNIR)
> **Bloque 2:** Procesamiento Digital de Imagen

**Índice:** 10.2 Segmentación y crecimiento de regiones · 10.3 Técnicas · 10.4 Semillas · 10.5 Split and Merge · 10.6 Gradient Vector Flow (GVF) · 10.7 Watershed · 10.8 Basado en grafos.

---

## 10.2. Segmentación y crecimiento de regiones

- **Segmentación:** dividir una imagen en **regiones/segmentos de propiedades similares** (color, textura, o por estar acotadas por contornos bien definidos).
- **Crecimiento de regiones:** algoritmo **generalmente NO supervisado** (puede supervisarse, pero no es lo habitual) que, partiendo de unas regiones concretas (normalmente elegidas por una persona), **encuentra los límites** de cada región. Explora la **vecindad** y agrupa los píxeles **más parecidos** en la misma región hasta que deja de ser uniforme.
- **Desventajas:**
  - Necesita una **buena inicialización** (intervención humana que indique dónde empezar).
  - **Computacionalmente muy costoso** por dos motivos: (1) son **iterativos y NO paralelizables** (una iteración no empieza hasta acabar la anterior); (2) las **funciones de evaluación** de pertenencia son complejas y costosas.
- **Ventaja:** es **autónomo** hasta cierto punto para hallar fronteras, basándose en funciones de **comparación** y de **maximización/minimización** (si están mal definidas, no habrá buena segmentación).
- **Uso típico:** **biomedicina** (ecografías, radiografías), donde el médico indica la región de interés y el algoritmo halla las fronteras.

---

## 10.3. Técnicas empleadas (dos familias)

- **Bottom-up:** parten del **píxel** (máximo detalle) y **agrupan**. Dos sub-familias según la agregación:
  - **Agregación local:** solo se fija en los **vecinos más cercanos**.
  - **Agregación global:** visión **global** de toda la imagen; dos píxeles se unen solo si tiene sentido globalmente.
- **Top-down:** **dividen** la imagen en secciones pequeñas de forma iterativa y evalúan hasta qué punto unir regiones → **Split and Merge**.

---

## 10.4. Crecimiento basado en semillas (seeded region growing)

El más **intuitivo**. Ingredientes (comunes a otros métodos):
- Un **conjunto de píxeles semilla** (una semilla suele ser un píxel; también puede ser una forma predefinida: círculo, cuadrado…). Su posición la da su lugar en la imagen y sus propiedades una función **f** (normalmente la **intensidad/color**; también saturación u otras codificaciones).
- Una **función de similaridad S** entre dos píxeles (o regiones).
- Una **función de pertenencia** a una región: vale **1 si S supera un umbral**, y **0** en caso contrario. El **umbral** se fija automáticamente o manualmente.

El algoritmo busca el **número mínimo de regiones** que **maximiza** todas las funciones de similaridad y pertenencia dentro de cada región.

**Características:**
- Iterativo → **gran coste**, optimización secuencial (no paralela).
- Solo considera **regiones adyacentes**: dos píxeles parecidos pero **no adyacentes** no se unen.
- Suele producir **sobresegmentación** (muchos segmentos → requiere postprocesado).
- **Cada píxel debe tener una región**: algunos se fuerzan a una por estar en su adyacencia.
- Malo con regiones **no homogéneas** o de **geometrías complicadas** (crece en todas direcciones).
- Bueno (primera aproximación certera) en imágenes de **alto contraste**; sirve de **origen** para algoritmos más complejos.

---

## 10.5. Split and Merge (top-down)

- **Split:** divide la imagen en **cuatro** partes de forma recursiva mientras un segmento **no cumple** las condiciones de similaridad/pertenencia (demasiada variabilidad/entropía por encima de un umbral).
- **Merge:** fusiona segmentos **adyacentes con propiedades similares**.
- Primero divide automáticamente y luego evalúa si dos segmentos deben seguir juntos.
- **Ventajas:** es **paralelizable** (los cuatro cuadrantes se analizan a la vez); el coste **decrece** al avanzar (segmentos cada vez más pequeños y menos numerosos) y está **teóricamente acotado**.
- Construye un **grafo jerárquico** de divisiones (usado luego por técnicas como **graph-cuts**).
- **Desventaja:** una vez que dos segmentos quedan **separados en ramas distintas**, el algoritmo **no reevalúa** si podrían fusionarse → hay que hacerlo en un **postprocesado** (barato, porque hay pocos segmentos).
- El **umbral**: si se disminuye, el algoritmo es **más estricto** → más **sobresegmentación**.

---

## 10.6. Gradient Vector Flow (GVF) / Active Contour Models (ACM)

- También llamados **modelos de contorno activo** o, popularmente, **algoritmo de la serpiente (snake)**.
- Funcionan deformando un **contorno inicial** (normalmente un **círculo**) de forma **iterativa** hasta que se adapta a la forma del objeto a segmentar.
- Muy **dependientes de la inicialización** y de las **funciones de coste/energía**.
- El snake original es un **contorno 2D paramétrico** que **minimiza una energía**:

  `E = E_interna + E_imagen + E_contorno`

  - **E_interna:** energía del contorno interior (suavidad/elasticidad).
  - **E_imagen:** energía debida a la intensidad de la imagen.
  - **E_contorno:** modela la parte exterior del contorno.
- **GVF vs ACM:** GVF es una **extensión** de ACM. Diferencias clave: **converge en las concavidades** del contorno y **no necesita una inicialización tan cercana** al contorno. GVF usa una **superficie paramétrica** (función de más dimensiones) en vez de solo una curva.
- *(Ref.: Kass, Witkin y Terzopoulos, 1987, "Snakes: Active contour models".)*

---

## 10.7. Watershed (algoritmos de inundación)

- Suele englobarse en la **morfología matemática** (nació en topografía), pero funciona como **crecimiento de regiones**. Se conoce como **algoritmo de inundación**.
- Objetivo: **dividir en regiones** una imagen en **niveles de gris** (una suele ser el fondo) y determinar los **contornos** de los objetos.
- Usa el **gradiente** de la imagen: los **contornos** se corresponden con las **líneas de cresta** de la imagen gradiente (donde el nivel de gris varía más rápido).
- **Interpretación topográfica 3D** (coords. espaciales vs. nivel de gris), con tres tipos de puntos:
  - **Mínimos locales.**
  - **Puntos watershed** (*catchment basins*): una gota de agua cae con certeza a **un único** mínimo.
  - **Líneas watershed** (líneas de cresta): el agua caería con **igual probabilidad a más de un** mínimo. **El objetivo es alcanzar estas líneas divisorias.**
- **Idea de inundación:** se hace un agujero en cada mínimo y se **inunda desde abajo**; cuando el agua de dos cuencas va a juntarse se construye un **dique (dam)**. Las líneas watershed forman un **camino conexo** → **bordes continuos** entre regiones.
- Produce **sobresegmentación** (por texturas, ruido, tonalidades). Se corrige: eliminar contornos irrelevantes, **imponer marcadores** como mínimos del gradiente, **suprimir** los demás mínimos y **preservar** las líneas de cresta importantes entre marcadores.

---

## 10.8. Crecimiento basado en grafos

- La imagen se entiende como un **grafo**: píxeles = **nodos**, conexiones = **edges** con propiedades (similaridad, peso, distancia). El algoritmo itera **eliminando las conexiones débiles** y reforzando las fuertes.

- **Graph-cuts / Normalized-cuts:** dado el grafo, **cortan (eliminan) las conexiones más débiles** (menos parecidas) entre nodos. Ese corte da nombre al algoritmo. Luego se reconvierte el grafo en imagen con la frontera de segmentación.

- **Agregación multiescala:**
  1. Cada píxel es un nodo.
  2. Se **agrupan** los nodos más próximos según similaridad (segmentación poco precisa).
  3. Cada grupo se resume en un **representante** (normalmente la **media**) → nueva **escala** con menos nodos.
  4. Se **itera** la agregación sobre los representantes hasta alcanzar un nº de segmentos o una condición de calidad.
  5. Se deshacen las agrupaciones para segmentar la imagen final.
  - Muy similar a split and merge (pero usando graph-cuts para dividir). Puede **asociar regiones parecidas aunque estén separadas espacialmente**.

**Ref.:** González y Woods (2008), *Digital Image Processing*, Pearson.

---

## Ideas clave

- **Crecimiento de regiones:** parte de semillas, agrupa vecinos parecidos; no supervisado, **costoso** (iterativo, no paralelizable), muy usado en **biomedicina**.
- **Bottom-up** (del píxel, agregación local/global) vs **top-down** (split and merge).
- **Semillas:** f (intensidad), similaridad S, pertenencia (1 si S>umbral). Solo vecinos adyacentes → **sobresegmentación**.
- **Split and Merge:** divide en 4 recursivamente y fusiona similares. **Paralelizable**, coste acotado; no reevalúa fusiones entre ramas (postprocesado).
- **GVF/ACM (snake):** deforma un contorno (círculo) minimizando energía (interna + imagen + contorno). **GVF** = extensión de ACM: converge en concavidades y tolera peor inicialización.
- **Watershed:** inundación sobre el gradiente; líneas de cresta = contornos; **diques** separan cuencas; sobresegmenta → **marcadores**.
- **Grafos:** graph-cuts (cortar edges débiles) y agregación multiescala (jerárquica, asocia regiones separadas espacialmente).
