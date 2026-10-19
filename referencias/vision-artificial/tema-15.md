# Tema 15 — Aplicaciones Actuales del Tratamiento de la Señal

> **Asignatura:** Visión Artificial · Máster en Inteligencia Artificial (UNIR)
> **Bloque:** Aplicaciones (tema final)

**Índice:** 15.2 Biometría · 15.3 Self-driving car · 15.4 Retos y limitaciones de la percepción computacional.

---

## 15.2. Biometría

- **Biometría:** conjunto de técnicas de **reconocimiento de patrones** que **verifican e identifican a una persona de forma unívoca**.
- La seguridad reside en **tres pilares**:
  - **«Lo que sabes»:** contraseñas (usuario/contraseña, clave pública/privada…).
  - **«Lo que tienes»:** un **token** (el móvil que recibe un SMS, una tarjeta de coordenadas…).
  - **«Lo que eres»:** la **biometría** (rasgos físicos únicos: iris, retina, huella…).

### Verificación vs. Identificación
- **Verificación (1:1):** el usuario **se identifica** y el sistema comprueba que es quien dice ser, comparando sus rasgos con **su** template. Si no supera un **umbral**, se rechaza.
- **Identificación (1:N):** el usuario **no** da identificación previa; el sistema debe **reconocer de quién se trata** comparando con **todos** los templates de la base de datos.

### Enrollment (alta en el sistema)
El usuario debe **registrarse** primero. Pasos:
1. **Captura** de la información biométrica con sensores especializados (cámaras infrarrojas, sensores de huella…).
2. **Extracción de características** → creación del **patrón/template**.
3. **Almacenamiento** en la base de datos.

### Técnicas biométricas

**Reconocimiento facial:**
- Características geométricas muy identificativas (distancia entre ojos, proporción de la nariz…).
- **Segmentación:** detector de **color de piel** (o infrarrojos/temperatura, más costoso).
- **Extracción:** **eigenfaces** (usa **PCA** / descomposición en **vectores propios** → preciso y razonable en cómputo).
- **Ventaja:** poco **invasiva** (el usuario no colabora). **Dificultades:** iluminación, gafas, barba, heridas.

**Reconocimiento de iris:**
- De los **más precisos** por la gran **entropía y unicidad** del iris (cada ojo es único, incluso el izquierdo y el derecho).
- **Segmentación** (3 enfoques): por **color** (sencilla pero poco precisa por la iluminación), por **forma** (iris circular → **crecimiento de regiones**), por **textura** (la más usada, porque se captura con **sensores infrarrojos**).
- **Extracción:** **filtros de Gabor** (también MRF, Wavelets, DCT). Se transforman las coordenadas **polares a cartesianas**.
- **Comparación:** muy sencilla computacionalmente (**distancia euclídea** o de **Hamming**) → rápida.

**Huella digital:**
- Captura: infrarrojos o escáner. **Segmentación sencilla** (el sensor hace el trabajo; clustering de 2 clases + morfología matemática). **Extracción:** propiedades geométricas de las líneas, **similar a SIFT**.

**Palmprint (palma):** líneas y textura de la palma. Segmentación **más compleja** (identificar la palma; basada en intensidad). Extracción similar a la huella.

**Geometría de mano:** forma de la mano. Captura sencilla (cámara de móvil) → segmentación **compleja** (agregación multiescala, color, crecimiento de regiones). Extracción: medidas relativas de dedos/mano/muñeca.

**Venas de la mano y retina:** captura por **infrarrojo obligatorio** (ver a través de la piel). Segmentación color/intensidad. Extracción: **Gabor** + algoritmos que comparan las venas como **redes de nodos**.

**Firma:** **online** (sensor con bolígrafo, sin segmentación) u **offline** (foto → segmentación por binarización). Extracción: parametrización de curvas, similar a SIFT. **Comparación con Dynamic Time Warping** (programación dinámica, ideal para señales que se **estiran en tiempo/espacio**).

> La biometría, junto con las **imágenes biomédicas**, es el campo donde más ha avanzado la percepción computacional.

---

## 15.3. Self-driving car (coche autónomo)

- Modelo de percepción computacional: **captura → procesamiento → toma de decisiones**.
- **Captura:** gran diversidad de sensores que **superan al humano** (infrarrojos, radares, aceleración, movimiento, humedad, posicionamiento…).
- Requiere un **computador a bordo** (puede ocupar el maletero); el **procesamiento de vídeo** es de lo más costoso, y las representaciones **3D** disparan el coste de la segmentación en **tiempo real**.

### Retos del procesamiento
1. **Información de diversa naturaleza:** **1D** (sensores), **2D** (imágenes/vídeo), **3D** (radares → profundidad).
2. **Sincronización temporal:** todo debe procesarse a la **misma velocidad**; un **desalineamiento** llevaría a decisiones con datos incorrectos.
3. **Lógica para fallos:** contemplar que no haya resultado satisfactorio (mala segmentación, cambio drástico de luz).
4. **Almacenar** todos los datos (en caso de accidente, analizar **qué vio** el coche y **por qué** actuó).
- El procesamiento **debe hacerse en el coche** (no en la nube) para **tiempos de respuesta muy bajos**.

### Algoritmos aplicables
- **Segmentación:** separar el fondo (césped, cambio de rasante), detectar otros autos.
- **Detección de bordes:** fronteras de la vía, líneas de la carretera (línea continua).
- **Extracción de características:** **Wavelets/Gabor** para texturas distintas al asfalto; **SIFT** para identificar **señales de tráfico**.
- **Corrección de ruido:** p. ej. no confundir una señal de 60 km/h con una de 80 con lluvia.
- Clasificación coloreada: asfalto, personas, señales, vehículos. **Redes neuronales** para clasificar señales.

### Decisión y ética
- La **ética** aún no se ha pronunciado sobre qué debe decidir un coche autónomo. Por ahora, ante una situación anómala, **avisa al conductor** para que tome el control.
- Dilemas abiertos: responsabilidad en accidentes/multas, elegir entre ocupantes y viandantes. El módulo **da soporte** a la decisión humana.

---

## 15.4. Retos y limitaciones de la percepción computacional

- **Falta de generalidad (la mayor limitación):** los algoritmos, por su generalidad teórica, requieren una **especificación muy alta** que les hace perder generalidad → resuelven problemas **muy concretos** (un detector de manos no sirve si cambian las condiciones de captura). **Deep Learning** acerca la meta, pero queda camino.
- **Ejemplo «Muffin or Chihuahua»:** clases muy parecidas confunden al clasificador. Mejoras: añadir información de **textura** (distinguir el muffin del pelo), **no usar SIFT** (confundiría), usar **Wavelets** para potenciar detalles, modelar la **simetría** del perro frente a la asimetría del muffin. El sistema resultante sería **muy específico**.
- **Retos abiertos:**
  - **Sesgos:** un algoritmo que **imite** cómo decide un humano puede heredar su sesgo y no desarrollar todo su potencial.
  - **Ética:** ¿se puede confiar la vida/vigilancia a decisiones de una máquina?
  - **Falta de generalidad:** ¿un algoritmo que entienda la imagen sin múltiples clasificadores y deduzca conceptos nuevos como un humano?
  - **Arte:** ¿pueden estos sistemas **crear** imágenes propias y originales?

---

## Ideas clave

- **Biometría = «lo que eres»**; pilares de seguridad: lo que sabes / lo que tienes / lo que eres.
- **Verificación (1:1)** vs **Identificación (1:N)**; alta previa = **enrollment** (captura → características → BD).
- **Facial:** eigenfaces (PCA); poco invasiva, sensible a iluminación/gafas. **Iris:** muy preciso (alta entropía), Gabor + Hamming, segmentación por textura (infrarrojos). **Huella:** segmentación sencilla, rasgos tipo SIFT. **Firma:** DTW.
- Cualquier rasgo físico o de comportamiento vale (forma de caminar, tecleo, oreja…).
- **Self-driving car:** captura (muchos sensores) → procesamiento **en el coche** y en **tiempo real** (1D/2D/3D, sincronizado, con logging) → decisión (soporte al humano; ética abierta).
- **Mayor limitación:** **falta de generalización** (sistemas muy especializados). Para distinguir clases difíciles, **cambiar la extracción de características** a una que haga las diferencias más obvias.
