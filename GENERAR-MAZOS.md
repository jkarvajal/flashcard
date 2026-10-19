# 📦 Especificación para generar mazos de estudio (FlashCard)

> **Entrega este archivo a otra IA / sesión / proyecto** y pídele que genere un mazo.
> El resultado debe ser **un único archivo `.json`** que se importa en la app FlashCard
> con el botón **"＋ Importar"** (o **"✏️ Crear mazo"** para hacerlo a mano).

---

## 🧭 Instrucciones para la IA que genera el mazo

Genera un **archivo JSON** (y nada más: solo el JSON, sin explicaciones alrededor) que cumpla
**exactamente** el esquema de abajo. Reglas:

1. Devuelve **JSON válido** (comillas dobles, sin comas finales, sin comentarios).
2. Una **materia** (`subject`) contiene uno o varios **mazos** (`decks`); cada mazo contiene **tarjetas** (`cards`).
3. Cada `id` debe ser **único** dentro de su nivel (usa ids cortos: `c1`, `c2`…).
4. Hay **dos tipos de tarjeta**:
   - **Tradicional**: campos `front` (pregunta/anverso) y `back` (respuesta/reverso).
   - **Opción múltiple** (`"type": "mcq"`): `question`, `options`, `correct`, `multi`.
5. En las de opción múltiple:
   - `options` es una **lista de textos** (2 a 6 opciones).
   - `correct` es una **lista de índices 0-based** de las opciones correctas (p. ej. `[1]` = la 2ª).
   - `multi`: `false` si hay **una sola** respuesta correcta; `true` si hay **varias** (entonces `correct` tiene 2+ índices y el alumno debe marcarlas todas para acertar).
   - `explanation` (opcional): se muestra tras responder.
6. **Imagen opcional** (`image`): una **URL pública** (`https://…`) o un **data URI** (`data:image/png;base64,…`). Sirve tanto en tarjetas tradicionales como de opción múltiple. ⚠️ Si usas data URI, que la imagen sea pequeña (la app las guarda en el dispositivo).
7. El texto admite **markdown ligero**: `**negrita**`, `*cursiva*`, `` `código` `` y listas con `- `.
8. `tags` (opcional): lista de etiquetas en minúsculas para buscar/filtrar (p. ej. `["tema-1","verbos"]`). Pon el tag `"test"` en las preguntas si quieres que aparezcan en el modo **Autoevaluación**.
9. Idioma, cantidad y dificultad: **los indica el usuario** (ver plantilla de petición al final). Si no se dice nada: ~15–20 tarjetas, en el idioma del material de origen, mezcla de dificultad.
10. Para **opción múltiple**: redacta **distractores plausibles** (no obviamente falsos), una sola idea por pregunta, y evita "todas/ninguna de las anteriores" salvo que aporte valor.

---

## 🧱 Esquema JSON (referencia de campos)

```jsonc
{
  "id": "slug-unico-materia",        // obligatorio, sin espacios
  "name": "Nombre visible",          // obligatorio
  "description": "Descripción corta", // opcional
  "color": "#7048e8",                // opcional (color de acento, hex)
  "icon": "📘",                       // opcional (un emoji)
  "decks": [
    {
      "id": "mazo-1",                // obligatorio, único
      "title": "Título del mazo",    // obligatorio
      "description": "De qué trata", // opcional
      "cards": [
        // --- Tarjeta TRADICIONAL ---
        {
          "id": "c1",
          "front": "¿Pregunta?",
          "back": "Respuesta.",
          "tags": ["opcional"]
        },
        // --- Opción múltiple, UNA respuesta correcta ---
        {
          "id": "c2",
          "type": "mcq",
          "question": "¿Cuál es la correcta?",
          "options": ["A", "B", "C", "D"],
          "correct": [2],
          "multi": false,
          "explanation": "Opcional.",
          "tags": ["test"]
        },
        // --- Opción múltiple, VARIAS respuestas correctas ---
        {
          "id": "c3",
          "type": "mcq",
          "question": "¿Cuáles aplican?",
          "options": ["X", "Y", "Z", "W"],
          "correct": [0, 2, 3],
          "multi": true,
          "explanation": "Hay que marcar TODAS."
        },
        // --- Con imagen ---
        {
          "id": "c4",
          "type": "mcq",
          "question": "¿Qué muestra la figura?",
          "image": "https://ejemplo.com/figura.png",
          "options": ["Opción 1", "Opción 2"],
          "correct": [0],
          "multi": false
        }
      ]
    }
  ]
}
```

---

## ✅ Ejemplo completo y válido (para copiar como referencia)

```json
{
  "id": "ingles-basico",
  "name": "Inglés básico",
  "description": "Gramática de nivel inicial",
  "color": "#2f9e44",
  "icon": "🇬🇧",
  "decks": [
    {
      "id": "comparativos",
      "title": "Comparativos",
      "description": "Formación del comparativo",
      "cards": [
        {
          "id": "c1",
          "type": "mcq",
          "question": "Si un adjetivo comparativo tiene **una sílaba**, ¿qué se hace?",
          "options": [
            "Se añade \"-ier\" al final y luego \"than\"",
            "No se cambia el adjetivo; se usa \"more\" antes y \"than\" después",
            "Se añade \"-er\" al final y luego \"than\""
          ],
          "correct": [2],
          "multi": false,
          "explanation": "Ej.: tall → taller than.",
          "tags": ["test", "comparativos"]
        },
        {
          "id": "c2",
          "type": "mcq",
          "question": "¿Cuáles son adjetivos de **una sílaba**?",
          "options": ["tall", "beautiful", "big", "expensive"],
          "correct": [0, 2],
          "multi": true,
          "explanation": "beautiful y expensive tienen 3 sílabas (usan \"more\")."
        },
        {
          "id": "c3",
          "front": "Comparativo de **good**",
          "back": "**better** (irregular)",
          "tags": ["irregulares"]
        }
      ]
    }
  ]
}
```

---

## 📝 Plantilla de petición (lo que TÚ escribes a la otra sesión)

> Copia esto, rellena los `[corchetes]` y adjunta este archivo:

```
Usando el esquema de "GENERAR-MAZOS.md" (adjunto), genérame un mazo de estudio.

- Materia: [p. ej. Biología celular]
- Tema / mazo: [p. ej. La mitosis]
- Tipo de tarjetas: [tradicionales / opción múltiple / mezcla]
- Nº de tarjetas: [p. ej. 20]
- Idioma: [español]
- Fuente/contenido: [pega aquí tus apuntes, PDF, o describe el temario]
- Extra: [p. ej. incluye explicación en cada pregunta; marca con tag "test"]

Devuélveme SOLO el archivo .json válido, listo para importar.
```

---

## 📥 Cómo usar el .json generado

1. Guarda la respuesta como un archivo `.json`.
2. Abre la app FlashCard → botón **"＋ Importar"** → selecciona el archivo.
3. La materia aparece en el inicio y ya puedes estudiarla (con repetición espaciada FSRS) o lanzar una **Autoevaluación**.

> ¿Dudas sobre un campo? Mira `data/PLANTILLA-materia.json` en el proyecto: tiene un ejemplo mínimo de los tres tipos de tarjeta.
