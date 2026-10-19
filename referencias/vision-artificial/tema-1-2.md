# Tema 1 y 2 — Introducción a los Sistemas de Percepción y sus Elementos

> **Asignatura:** Visión Artificial · Máster en Inteligencia Artificial (UNIR)
> **Bloque 1:** Percepción Visual y Auditiva: Digitalización y Cancelación de Anomalías
> **Docente:** Alexandre Pérez Reina

**Problema planteado:** ¿Cómo podemos *optimizar* la integración de los mecanismos de captación de señales auditivas y visuales humanas en el diseño de sistemas de percepción computacional?

---

## TEMA 1 — Introducción a los sistemas de percepción

### 0. Introducción — Captación de señales

- Estamos siendo continuamente bombardeados por señales de diversa índole (visuales, auditivas, etc.).
- El cerebro no recibe la señal "cruda": existe un proceso previo de **captación → transducción → procesamiento**. El esquema ingenuo "señal → cerebro" no es del todo correcto; entre medias hay sensores (oído, ojo) que transforman la señal física.

### 1. El sistema auditivo

#### El sonido (definición)
- **¿Qué es?** Vibración que se propaga en forma de **ondas longitudinales** a través de un medio (para nosotros, el aire).

#### Características del sonido
- **Amplitud:** tamaño de las vibraciones de las partículas del medio por el que se propaga el sonido. Se mide en **decibelios (dB)**. A mayor amplitud, mayor volumen percibido.
- **Frecuencia:** número de ciclos completos de vibración que una onda realiza por segundo. Se mide en **Hercios (Hz)**. Alta frecuencia → tono agudo; baja frecuencia → tono grave.

#### El oído — Funciones
1. Recepción del sonido
2. Transducción de señales
3. Procesamiento auditivo y percepción

**Anatomía y función por zonas:**

| Zona | Función | Componentes |
|------|---------|-------------|
| **Oído externo** | Recepción del sonido | Pabellón auricular, canal auditivo, tímpano |
| **Oído medio** | Transmisión del sonido | Martillo, yunque y estribo; trompa de Eustaquio |
| **Oído interno** | Conexión oído-cerebro | Cóclea, nervio auditivo |

#### Características físicas del oído humano
1. **Umbral de percepción:** 20 Hz – 20 kHz
2. **Mayor sensibilidad:** en torno a 4 kHz
3. **Umbral de dolor:** 120 dB
4. **Voz humana:** 300 Hz – 4 kHz

#### Percepción del sonido — Ley de Weber-Fechner
- La **intensidad acústica** es la rapidez promedio del flujo de energía acústica a través de un área unitaria (W/m²).
- El nivel de intensidad se expresa en dB:

  `L_I(dB) = 10 · log10( I / I0 )`  con  `I0 = 10^-12 W/m²`

- La ley de Weber-Fechner relaciona la magnitud de un estímulo físico con su percepción subjetiva mediante una **relación logarítmica**.

**Ejemplo:** Si una fuente tiene 60 dB, ¿cuál es el nivel combinado de 2 fuentes de 60 dB?

`L_I = 10·log((I1+I2)/I0) = 10·log(2I/I0) = 10·log2 + 10·log(I/I0) = 3 + 60 = 63 dB`

> **Regla útil:** doblar el valor de una magnitud equivale a sumar **3 dB**.

**Ejercicio:** Si el sonido A tiene 10 dB y el B tiene 20 dB, ¿qué sabemos de sus intensidades en W/m²? (Cada +10 dB equivale a ×10 en intensidad → B es 10 veces más intenso que A).

### 2. El sistema de visión

#### Introducción
- La **visión** es el fenómeno resultante de la percepción del color, forma y distancia de los objetos en el espacio.
- La base del estímulo visual es la **luz visible** que incide sobre la **retina**.
- La luz es la fuente de energía electromagnética que nos permite percibir el mundo a través de la vista.
- **Espectro visible (umbral de longitud de onda):** 400 nm – 700 nm.

#### El ojo humano
- Proceso similar al del oído: **Captación → Transformación → Procesamiento**.
- **Recepción y transducción:** conos y bastones.

| Fotorreceptor | Características | Función |
|---------------|----------------|---------|
| **Conos** | Menos numerosos, poco sensibles a la luz | Visión **diurna**, responsables de la **visión en color** |
| **Bastones** | Más numerosos, muy sensibles a la luz | Visión **nocturna** (por eso no distinguimos colores en la oscuridad), visión periférica |

- A veces el espectro de luz visible no es suficiente, pero es lo que tenemos.

#### Percepción visual — Ley de Weber-Fechner
- La percepción es proporcional al **logaritmo** del estímulo físico.
- Cuanto mayor es la intensidad de la luz, más variación es necesaria para apreciar un cambio similar.

  `L_(I+ΔI)(dB) = 10·log((I+ΔI)/I0) = 10·log(1 + ΔI/I) + L_I`

#### Inhibición lateral
- **Filtrado espacial:** mecanismo neural donde las células sensoriales **inhiben** la actividad de sus vecinas para mejorar el **contraste** y la percepción de **bordes**.
- **Filtrado temporal:** la respuesta temporal del ojo es relativamente lenta. Si una fuente de luz parpadea suficientemente rápido (> 30 ms → ~30 Hz), la percibimos como **continua**. En esto se basan los estándares de vídeo **PAL (25 fps)** y **NTSC (30 fps)**.

#### Síntesis del color
- El color se percibe en función de **tres canales no independientes** (relacionado con los tres tipos de conos).

---

## TEMA 2 — Elementos de un sistema de percepción

### Imitando al mundo animal
- Obsesión (buena) por modelar matemáticamente lo que nos rodea.
- Queremos reflejar el comportamiento de organismos sencillos.
- El proceso es: **captura de información → procesamiento → toma de decisión**.

### Limitaciones
- ¿Es posible modelar el cerebro humano? ¿Las redes neuronales son un buen modelado?
- El cerebro humano tiene ~**10¹⁰ neuronas**; una red neuronal artificial grande tiene ~**10¹¹ "neuronas" (parámetros)**. El número no garantiza que sea una representación fiel de la realidad.

### Captura de información — parámetros de un sensor
- **Especificidad:** ¿tiene el dispositivo los sensores necesarios?
- **Precisión:** ¿cómo mide los errores el dispositivo?
- **Sensibilidad:** ¿cuánta variación es capaz de medir?
- **Consumo y tamaño:** autoexplicativo.

#### ADC (Analog-to-Digital Converter)
- Convierte intensidades físicas (analógicas) a dígitos binarios (digital).
- Ventajas: reduce en gran medida la lógica de procesamiento; menor cantidad de información almacenada.
- Inconveniente: **pérdida de información**.

### Pre/Procesamiento
Operaciones habituales sobre la señal capturada:
- Eliminación de ruido
- Detección de anomalías
- Segmentación y detección de regiones
- Extracción de características

### Toma de decisión
- Con todos los elementos anteriores, un **modelo** produce una salida (p. ej. clasificación *perro 0.97 / gato 0.03*).
- Flujo completo: **Captura de información → Procesado → Toma de decisión**.
- Durante el entrenamiento se añade **Feedback** (¿bien o mal?) que permite el **aprendizaje** del modelo.

---

## Ideas clave

- La percepción no es directa: hay captación, transducción y procesamiento.
- Sonido = onda longitudinal; se describe por amplitud (dB) y frecuencia (Hz).
- Oído: externo (recepción), medio (transmisión), interno (conexión con el cerebro).
- Percepción sigue una ley **logarítmica** (Weber-Fechner). Doblar magnitud ≈ +3 dB.
- Visión: conos (color/día) y bastones (noche/periferia); espectro visible 400–700 nm.
- Un sistema de percepción artificial = captura (sensor/ADC) → procesado → decisión (+ feedback en entrenamiento).
