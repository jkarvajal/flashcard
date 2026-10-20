# Visión Artificial — Tests preparatorios (UNIR-ESIT), resueltos

> Preguntas de los **tests preparatorios del campus** (UNIR-ESIT), Máster en IA.
> Cada pregunta viene con sus opciones; la **respuesta correcta está en negrita** con ✅.
> Las respuestas las dedujo una IA a partir del contenido del curso (los tests venían sin corregir);
> contrástalas con la solución oficial si tienes dudas. Las marcadas con ⚠️ son las menos seguras.

---

## Tema 1 — Percepción visual y auditiva

1. El oído humano actúa como filtro paso-banda. ¿Rango de frecuencias?
   A. 0 Hz–4 kHz · **B. 20 Hz–20 kHz ✅** · C. 4 kHz–20 kHz · D. 20 Hz–4 kHz
2. Ancho de banda aproximado de una señal de voz: **A. 4 kHz ✅** · B. 8 kHz · C. 20 kHz · D. 10 kHz
3. ¿Qué determina el color percibido? A. Intensidad · B. Forma/posición · **C. La frecuencia (λ) de la luz reflejada ✅** · D. Posición de conos/bastones
4. Células especializadas en la visión: A. Conos · B. Bastones · **C. Conos y bastones ✅** · D. (invertida)
5. Banco de filtros en rojo/verde/azul: **C. Los conos, 3 filtros paso-banda en 564, 534 y 420 nm ✅**
6. Operación para identificar bordes (células fotosensibles): A. Suma · **B. Resta/diferencia entre intensidades cercanas ✅** · C. Producto · D. División
7. La Ley de Weber: **A. El incremento de intensidad necesario para una respuesta similar aumenta con la intensidad ✅** · B · C · D
8. ¿Dónde está la cóclea? A. Hueso · **B. Oído interno ✅** · C. Pabellón · D. Oído medio
9. ⚠️ La frecuencia de una onda sonora capturada: **B. Es inversamente proporcional a la longitud de las fibras pilosas ✅** (codificación tonotópica) · A (perilinfa) · C · D
10. ¿Qué es el tímpano? **C. Membrana del sistema auditivo cuya vibración capta intensidad y frecuencia ✅**

## Tema 2 — Elementos de un sistema de percepción

1. Un sistema de percepción necesita únicamente: **A. Un módulo de captura ✅** · B. Decisión · C. Ninguna
2. Sensor que solo detecta NO₂ con error grande: **A. Especificidad muy alta, precisión muy baja ✅** · B · C
3. Segmentar sin filtrar: **A. Mayor coste, el nº de segmentos podría ser muy alto ✅** · B · C
4. Objetivo del preprocesamiento: A · B. Reducir información · **C. Asegurar la máxima calidad de la información que llega al procesamiento ✅**
5. La decisión se hace siempre tras el procesado/extracción: A. Falso · **B. Verdadero ✅**
6. Radio AM con ruido: A · B · **C. Combinar filtrado analógico + A/D + filtrado digital ✅** · D
7. ⚠️ Microcalcificaciones en radiografía: **C. Filtrar (contraste) → segmentar → extraer características ✅** · A (solo extracción) · B *(nota: la opción menciona "color", pero la radiografía es en grises)*
8. Sensor para solo contar vehículos: A · B · **C. Poco específico, solo detecta el paso, 50 € ✅**
9. Dispositivo de voz "sin ruido": A · **B. Aun sin ruido puede captar info no deseada (otra voz/entorno) → filtrar ✅** · C
10. Sistema de percepción sin módulo de decisión: **A. Cuando la extracción de características da soporte a otro sistema ✅** · B · C

## Tema 3 — Muestreo y cuantificación

1. ¿Nyquist mide el ancho de banda de una señal? A. Verdadero · **B. Falso ✅**
2. El muestreo permite: A. Reducir información · B. Tomar "fotos" · C. Acelerar procesado · **D. Todas las anteriores ✅** · E. Solo A y B
3. ¿Una señal constante no se puede muestrear? **A. Sí se puede, todas las señales se muestrean ✅** · B · C
4. Orden de un ADC: **A. Muestreo, cuantificación y codificador ✅** · B · C
5. El sobremuestreo: **A. Muestrear a una frecuencia más elevada que la de Nyquist ✅** · B · C
6. ¿Una señal tras A/D puede recuperarse completamente? A · **B. Sí, siempre que se respete Nyquist ✅** · C
7. Voz (ancho de banda 4 kHz), ¿frecuencia de muestreo? A · **B. Según Nyquist, 8 kHz mínimo ✅** · C
8. Sin muestreo/cuantificación no hay filtros: A · **B. Falso, las analógicas se filtran con filtros analógicos ✅** · C
9. Rueda a 4 vueltas/s (250 ms/vuelta), ¿frecuencia? A. 250 Hz · **B. 4 Hz ✅** · C. 2 kHz
10. ¿Dónde aplicar compresión en el A/D? A · B · **C. Después de la codificación (sale binaria, fácil de comprimir) ✅** · D

## Tema 4 — Ruido y entropía

1. ¿Qué es el ruido? A · B · **C. Componente no deseada y aleatoria que modifica la intensidad de la señal ✅** · D
2. ¿Etapa específica para el ruido? **A. Sí, como etapa inicial, para preservar la información original ✅** · B · C · D
3. Entropía en teoría de la información: A · B · C · **D. La cantidad de información, en promedio, de una fuente aleatoria ✅**
4. X uniforme [a,b] vs Y gaussiana (varianza pequeña), ¿mayor entropía? A · B · C · **D. La variable X (la uniforme) ✅**
5. ¿Cómo se evalúa la entropía? A · B · **C. Calculando la probabilidad asociada a cada muestra (valor) ✅** · D
6. ¿Qué es la entropía aproximada? A · B · C · **D. Un algoritmo para estimar la entropía en una serie temporal ✅**
7. Ruido interno/inherente: A · B · C · **D. Señales aleatorias generadas en los dispositivos por sus propiedades físicas ✅**
8. Ruido producido por el hombre: A · B · **C. Artefactos eléctricos (automóviles, motores, alta tensión); ruido industrial ✅** · D
9. Ruido térmico: A · **B. Agitación aleatoria de electrones; solo se cancela en el cero absoluto ✅** · C · D
10. Proceso estocástico: A · B · **C. Variable aleatoria cuyo resultado de un experimento es una señal ✅** · D

## Tema 5 — Detección y cancelación de anomalías

1. Outlier y anomalía: **A. Se emplean indistintamente ✅** · B · C · D
2. ¿Qué es una anomalía? A · B · **C. Un patrón inusual que no se ajusta al comportamiento esperado ✅** · D
3. Anomalía puntual: A · **B. Una muestra individual notablemente diferente del resto ✅** · C · D
4. Anomalía contextual: **A. Una muestra anómala en un contexto específico ✅** · B · C · D
5. Anomalía colectiva: A · B · C · **D. Colección de instancias relacionadas con comportamiento inusual respecto al conjunto ✅**
6. Métodos supervisados: A · B · C · **D. Parten de ejemplos etiquetados (anomalía/no); habitual en fraude con tarjeta ✅**
7. Métodos no supervisados: A · B · C · **D. Flexibles y suelen basarse en el cálculo de distancias ✅**
8. Eliminar ruido impulsivo (señales e imágenes): A · B · **C. Filtro de mediana ✅** · D
9. Mediana de longitud 5 sobre el punto (12) de `[2 1 3 4 5 2 3 12 1 4 5 4 5]`: **A. 3 ✅** (ventana [2,3,12,1,4] → mediana 3)
10. Mediana de longitud 7 sobre el mismo punto: **B. 4 ✅** (ventana [5,2,3,12,1,4,5] → mediana 4)

## Tema 6 — Operaciones elementales (punto a punto)

1. Característica de un operador punto a punto: **A. El píxel (x,y) de salida es función únicamente del (x,y) original ✅** · B · C · D
2. ¿Cuándo se usa el negativo? A · B · **C. Realzar estructuras de mayor intensidad encerradas en áreas oscuras ✅** · D
3. Operador que expande los oscuros y equipara los claros: A · **B. Transformación logarítmica ✅** · C · D
4. Ventaja de la ley de potencia frente al logaritmo: A · B · **C. Genera una familia de transformaciones variando un parámetro (y sus inversas) ✅** · D
5. ¿Cuándo usar función definida a trozos? A · **B. Para aplicar distintas transformaciones según el rango de intensidad ✅** · C · D
6. ¿Qué representa el histograma? A · B · C · **D. Una estimación de la densidad de probabilidad de la intensidad de los píxeles ✅**
7. ¿Por qué se usa la ecualización del histograma? A · B · **C. Aumenta el contraste al hacer uniforme la distribución de píxeles ✅** · D
8. Operador resta de imágenes: **A. Todas las respuestas siguientes podrían ser válidas ✅** · B · C · D
9. Operador suma de imágenes: **A. Reducir el ruido a partir de una secuencia de instantáneas de la misma escena ✅** · B · C · D
10. TF de imagen con solo un punto central (DC): **A. Transformación logarítmica ✅** · B · C · D

## Tema 7 — Operaciones espaciales y filtros

1. ¿Qué caracteriza a un operador espacial? A · **B. El píxel (x,y) de salida es función del (x,y) y de su vecindad ✅** · C · D
2. ¿Cómo se expresa? **A. Mediante su máscara ✅** · B · C · D
3. El paso bajo equivale a: A · B · **C. Integración o promedio ✅** · D
4. Coeficientes de un filtro paso bajo: **A. Positivos ✅** · B · C · D
5. El paso alto equivale a: **A. Derivada o diferencia ✅** · B · C · D
6. Coeficientes de un filtro paso alto: A · B · **C. Positivos y negativos ✅** · D
7. Para reducir ruido de fondo: **A. Filtro espacial paso bajo (aunque suaviza bordes) ✅** · B · C · D
8. Operadores de detección de bordes: A · **B. Implementan filtrado paso-alto ✅** · C · D
9. Máscara `1 1 1 / 0 0 0 / −1 −1 −1`: A · **B. Prewitt para bordes horizontales ✅** · C · D
10. Identificar bordes (imagen ya sin ruido): A · B · **C. Aplicar el filtro de Canny ✅** · D

## Tema 8 — Análisis en frecuencia (Fourier)

> *(Este test del campus coincide con el test oficial del Tema 8 que ya está en el mazo "Tests oficiales".)*

1. Las series de Fourier permiten: A · B · C · **D. Todas las anteriores ✅**
2. ¿Usar cualquier función no sinusoidal? A. Verdadero · **B. Falso ✅**
3. La transformada de Fourier: **A. Permite entender qué componentes en frecuencia describen f(t) ✅** · B · C
4. ¿Separar dos voces simultáneas con la TF? **A. No: ambas tienen ~4 kHz y se solapan en frecuencia ✅** · B · C
5. DFT a un disco de música clásica: A · **B. Picos asociados a los tonos de las notas ✅** · C
6. Personas en un supermercado durante un año (TF): A · **B. Picos en frecuencia (horas centrales, fines de semana) ✅** · C
7. ¿Aplicar la TF directamente sin DFT? **A. No: la TF es el concepto teórico y la DFT su implementación ✅** · B · C
8. ¿Función sin TF? A · B · **C. Si es continua, derivable y acotada (sin asíntotas) tendrá TF ✅**
9. La transformada inversa de Fourier: A · **B. Devuelve f(t) original sin modificación ✅** · C
10. ¿TF a funciones sinusoidales? A. Falso · **B. Verdadero (son periódicas y continuas) ✅**

---

*Pendientes:* tests de los Temas 9-15 (cuando se compartan). Los tests oficiales de los Temas 8-15 ya están en el mazo "Tests oficiales (opción múltiple)" de la app.
