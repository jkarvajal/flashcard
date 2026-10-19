# FlashCard 📇 — App de estudio (PC + Android)

App de flashcards con **repetición espaciada (SRS)** para estudiar temáticas de cualquier materia.
Funciona **sin conexión**, se puede **instalar** como app en Windows y Android, y no necesita
servidores externos ni bases de datos: todo el progreso se guarda en tu propio dispositivo.

Incluye como ejemplo la materia **Visión Artificial** (Máster en IA – UNIR) con los Temas 1 a 6.

---

## 🚀 Cómo ejecutarla

### En el PC (2 opciones)

**Opción A — Abrir directamente (rápido):**
Haz doble clic en `index.html`. Se abre en tu navegador y funciona.
> Nota: abriéndolo así (`file://`) *no* se activa la instalación como PWA ni el modo offline avanzado,
> pero el estudio y el progreso funcionan igual.

**Opción B — Servidor local (recomendado, activa PWA + offline):**
Haz doble clic en `serve.bat` (o ejecuta en una terminal):

```bash
python serve.py
```

Luego abre **http://localhost:8000**. Desde el icono de la barra de direcciones podrás
**instalar** FlashCard como aplicación de escritorio.

### En Android (3 opciones)

1. **Misma wifi que el PC (lo más fácil para probar):**
   - En el PC ejecuta `python serve.py`.
   - Averigua la IP local del PC (`ipconfig` en Windows → *Dirección IPv4*, p. ej. `192.168.1.50`).
   - En el móvil (misma wifi) abre `http://192.168.1.50:8000` en Chrome.
   - Menú de Chrome → **Añadir a pantalla de inicio / Instalar app**.

2. **Copiando los archivos al móvil:** copia toda la carpeta `FlashCard` al teléfono y abre
   `index.html` con Chrome (funciona, pero sin instalación PWA).

3. **Publicándola gratis (mejor experiencia, offline real):** sube la carpeta a
   **GitHub Pages**, **Netlify** o **Cloudflare Pages** (son gratuitos). Obtendrás una URL `https://...`
   que puedes abrir en el móvil e **instalar** como app nativa con soporte offline completo.
   Es la opción recomendada para uso diario en el teléfono.

---

## 🧠 Cómo se estudia

- **Estudiar:** repasa las tarjetas *vencidas* + algunas *nuevas* usando **FSRS** (*Free Spaced Repetition Scheduler*), el algoritmo de repetición espaciada que usa Anki en sus versiones recientes. Modela tu memoria con dos variables por tarjeta —**estabilidad** (cuánto dura el recuerdo) y **dificultad**— y programa cada repaso para que llegues a él con ~90 % de probabilidad de acordarte (**retención objetivo**, configurable). Predice el olvido mejor que los algoritmos clásicos tipo SM-2.
- Ves la pregunta → tocas la tarjeta (o `Espacio`) → se muestra la respuesta → te autoevalúas (el número bajo cada botón es *cuándo* volverás a verla):

  | Botón | Atajo | Efecto |
  |-------|-------|--------|
  | **Otra vez** | `1` | No la sabías; reaparece en esta sesión y su estabilidad baja |
  | **Difícil**  | `2` | La sabías con esfuerzo; intervalo corto |
  | **Bien**     | `3` / `Espacio` | La sabías; intervalo normal |
  | **Fácil**    | `4` | Muy fácil; intervalo largo |

- **🎯 Autoevaluación:** modo examen solo con las **preguntas de test** (de un tema o de toda la materia). Te autocalificas *Acerté/Fallé* y obtienes una **puntuación final**. No afecta al calendario de repasos (es una simulación).
- **🔍 Buscador:** caja en el inicio que filtra todas las tarjetas (insensible a acentos y mayúsculas) por pregunta, respuesta, etiqueta o tema.
- **Repasar todas:** modo libre, baraja todas las tarjetas del mazo.
- **Ver tarjetas:** lista todas las preguntas/respuestas del mazo.
- El progreso (estabilidad, dificultad y cuándo toca repasar cada tarjeta) se guarda automáticamente en el navegador.

---

## ➕ Cómo añadir tus propias materias

Tienes **dos formas**:

### 1) Importar desde la app (sin tocar código)
- Copia el archivo `data/PLANTILLA-materia.json`, rellénalo con tus temas y tarjetas.
- En la app, pulsa **＋ Importar mazo** y selecciona tu `.json`.
- La materia queda guardada en el dispositivo.

### 2) Integrarla en el proyecto (aparece siempre, y se cachea offline)
- Crea un archivo `data/mi-materia.js` copiando el formato de `data/vision-artificial.js`.
- Añade su `<script src="data/mi-materia.js"></script>` en `index.html` (junto al de Visión Artificial).
- (Opcional) añádelo a la lista `CORE` de `sw.js` para que se guarde offline, y sube la versión del cache.

**Formato de una tarjeta** (el texto admite markdown ligero):

```json
{ "id": "c1", "front": "¿Pregunta?", "back": "Respuesta con **negrita** y `fórmula`", "tags": ["tema"] }
```

---

## 🗂️ Estructura del proyecto

```
FlashCard/
├── index.html                 App (punto de entrada)
├── manifest.webmanifest       Configuración PWA (instalación)
├── sw.js                      Service Worker (offline)
├── serve.py / serve.bat       Servidor local para PC
├── css/styles.css             Estilos (tema claro/oscuro, responsive)
├── js/app.js                  Lógica: estudio, SRS, progreso, navegación
├── data/
│   ├── vision-artificial.js   Materia de ejemplo (Temas 1-6)
│   └── PLANTILLA-materia.json  Plantilla para nuevas materias
├── icons/                     Iconos de la app
└── referencias/               Apuntes en Markdown (fuente de las tarjetas)
    └── vision-artificial/     tema-1-2.md … tema-6.md
```

## 🔒 Privacidad
Todo es local: no se envía nada a Internet. El progreso vive en el `localStorage` de tu navegador.
Usa **Exportar progreso** para guardar una copia de seguridad en JSON.
