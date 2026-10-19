# Tema 14 — Decisión. Principios e Implementación de Algoritmos de Ayuda en la Toma de Decisiones

> **Asignatura:** Visión Artificial · Máster en Inteligencia Artificial (UNIR)
> **Bloque:** Decisión / Reconocimiento de patrones

**Índice:** 14.2 Clasificación y reconocimiento de patrones · 14.3 Aplicación de técnicas de machine learning al procesado de señales.

---

## Introducción

- La **decisión** es la **etapa final** del procesado de una señal: su **interpretación automática** (p. ej. ¿la señal biomédica indica patología?, ¿la figura es una persona?).
- Requiere una etapa de **reconocimiento de patrones**, **específica de cada aplicación** pero con **metodología común**.
- Se basa en disponer de un **conjunto amplio de ejemplos** del problema, de los que se **infiere** qué propiedades diferencian las categorías → un **modelo**.
- La etapa **inmediatamente anterior** es la **extracción de características**: sintetiza el objeto en un **vector de variables**, **reduciendo la dimensionalidad** (de muchos píxeles/puntos a un vector corto) y **minimizando la pérdida de información relevante** para el problema.

---

## 14.2. Clasificación y reconocimiento de patrones

### Conjunto de entrenamiento y aprendizaje supervisado
- El modelo se obtiene de un **conjunto de entrenamiento `D`** formado por **pares (objeto `x`, categoría `t`)**, con `m` ejemplos.
- Como se conoce **a priori** la categoría de cada ejemplo, esto es **aprendizaje supervisado**.
- Objetivo: tomar decisiones **minimizando el error** ante objetos `x` **nuevos** (no vistos en `D`).

### Marco estadístico
- La **función de densidad de probabilidad conjunta `p(x, t)`** describe **por completo** el generador de las muestras:

  `p(x, t) = p(t | x) · p(x)`

- La función a **modelar** por el sistema de decisión es la **probabilidad a posteriori `p(t | x)`**: la probabilidad de la categoría `t` dado el objeto observado `x`.

### Clasificación
- Cuando la variable `t` es **categórica**, el problema es de **clasificación**: determinar a cuál de las categorías `{C1,…,Ck}` pertenece `x`.
- `x = (x1,…,xn)` es un **vector n-dimensional** de características (un punto en el espacio de entrada).
- El **clasificador** es una función `y = f(x, w)` que mapea el espacio de entrada a la categoría, con **parámetros ajustables `w`**.

### Regla de decisión de Bayes y MAP
- La **regla de decisión de Bayes** asigna `x` a la categoría de **mínimo riesgo condicionado** (minimiza el coste del error). El riesgo pondera el coste del error por la probabilidad a posteriori.
- Con una **función de pérdida 0/1** (0 si acierta, 1 si falla), la regla se reduce a la **regla del máximo a posteriori (MAP)**: asignar `x` a la **categoría más probable** dado `x` (máximo `p(Ck | x)`).
- **Teorema de Bayes:** obtiene `p(Ck | x)` a partir de la **verosimilitud `p(x | Ck)`**, la **probabilidad a priori `p(Ck)`** y la **evidencia `p(x)`**:

  `p(Ck | x) = p(x | Ck) · p(Ck) / p(x)`

- **Algoritmos que modelan `p(t|x)` directamente:** regresión logística, redes neuronales **MLP** y **RBF**.
- **Algoritmos que estiman `p(x|Ck)` y aplican Bayes:** **K-vecinos próximos**, redes neuronales probabilísticas, clasificadores gaussianos (**discriminante lineal/cuadrático**), **Naïve Bayes**.
- **Fuera del marco estadístico** (no estiman densidades): **árboles de decisión** y **máquinas de vectores soporte (SVM)**.

### Entrenamiento y generalización
- El **entrenamiento** ajusta los parámetros `w` **minimizando una función de error** (disparidad entre la salida `y` del clasificador y el objetivo `t`). Es **supervisado**.
- No se busca memorizar `D`, sino **aproximar `p(t|x)`** → buena **capacidad de generalización** (acertar con muestras **nuevas**).
- La generalización depende de **tres factores**:
  1. **Tamaño y representatividad** del conjunto de entrenamiento (más ejemplos → mejor estimación).
  2. **Flexibilidad del modelo** (nº de parámetros `w` ajustables → más funciones posibles).
  3. **Complejidad del problema** (dada por `p(t|x)`; **fuera del control** del usuario).

### Underfitting y overfitting
- **Underfitting (infrajuste):** modelo **rígido/poco flexible**, no ajusta ni las muestras de entrenamiento. **Solución:** usar modelos **más flexibles**.
- **Overfitting (sobreajuste):** modelo **demasiado flexible**, ajusta perfectamente `D` (incluso el **ruido**). **Soluciones:** más datos (no siempre posible), **reducir la dimensión** del espacio de entrada, o **ensembles** (combinar modelos): **bagging** y **gradient boosting**.

### Sesgo y varianza (dos componentes del error)
- **Sesgo (bias):** componente **sistemática** del error = diferencia entre la **media de las predicciones** (de modelos entrenados con distintos `D`) y el **objetivo**. **Sesgo alto → modelos simples → underfitting**.
- **Varianza:** componente del error por la **dependencia del modelo con el conjunto `D`** (los modelos difieren mucho al cambiar `D`). **Varianza alta → modelos muy flexibles → overfitting** (capturan ruido). **Más ejemplos → menor varianza.**

### Máxima verosimilitud vs. inferencia bayesiana
- **Máxima verosimilitud (ML):** ajusta `w` para **maximizar la probabilidad de observar `D`**. En la práctica se **minimiza el logaritmo negativo** de esa probabilidad (función de error). Para clasificación de **2 clases** (t=1 para C1, t=0 para C2) resulta la **función de entropía cruzada (cross-entropy)**.
  - Maximizar la verosimilitud **no** garantiza la mejor generalización (riesgo de **overfitting** en modelos de alta varianza).
- **Inferencia bayesiana:** trata `w` como **variable aleatoria** con densidad `p(w)`; tras observar `D`, se obtiene `p(w|D)` por Bayes. La predicción final es un **promedio ponderado** de **todos** los modelos posibles, pesados por `p(w|D)` → mitiga el sobreajuste.

---

## 14.3. Aplicación de machine learning a señales

- **Clasificación de señales:** se automatiza cuando (a) el **humano no puede** resolver el problema por observación, o (b) **puede pero es muy costoso** (tiempo, recursos). Debe **acotarse a un escenario concreto** (p. ej. persona/no persona; tejido pulmonar dañado/sano; ECG/EEG/SaO patológico/sano; voz hombre/mujer; reconocimiento del habla con un **léxico**).
- **Segmentación:** filtros espaciales clasifican el **píxel central**. **Supervisado** (categorías definidas → ejemplos etiquetados) o **no supervisado** (sin ejemplos → **clustering**).
- **Predicción:** estimar valores **futuros** de una señal temporal a partir del **histórico** (p. ej. si la cotización bursátil subirá o bajará).

**Metodología común (sistema de decisión):**
1. **Identificar** el objeto a clasificar (píxel, región, segmento…).
2. **Preprocesado** (quitar outliers/ruido, bordes, altas frecuencias…).
3. **Caracterización** → construir el **vector `x`**.
4. **Definir** la variable objetivo `t` (qué se decide).
5. **Construir** el conjunto de entrenamiento `D` (pares `x, t`).
6. **Entrenamiento y test** (evaluar sobre muestras **no** usadas para ajustar el modelo).

---

## Ideas clave

- **Decisión = última etapa** del procesado (interpretación automática). Metodología común basada en **ejemplos**.
- **Supervisado:** `D` = pares (x, t). Se modela `p(t|x)` (a posteriori). `p(x,t)=p(t|x)·p(x)`.
- **Bayes / MAP:** asignar a la categoría de **mínimo riesgo** → con pérdida 0/1, la **más probable** `p(Ck|x)`. Teorema de Bayes: verosimilitud × priori / evidencia.
- **Clasificadores:** p(t|x) directa (logística, MLP, RBF); vía p(x|Ck) (KNN, gaussianos, Naïve Bayes); no estadísticos (árboles, SVM).
- **Generalización** depende de: datos, flexibilidad del modelo y complejidad del problema.
- **Underfitting** (rígido, sesgo alto) vs **overfitting** (flexible, varianza alta, captura ruido). Remedios del overfitting: más datos, reducir dimensión, **ensembles** (bagging, gradient boosting).
- **ML:** máxima verosimilitud (→ **entropía cruzada** en 2 clases) vs **inferencia bayesiana** (promedio de modelos, menos overfitting).
- **Aplicaciones:** clasificación de señales (ECG/EEG, voz), segmentación (super/no supervisada = clustering), predicción (series temporales).
