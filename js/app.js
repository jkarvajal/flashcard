/* ============================================================================
 * FlashCard — App de estudio con repetición espaciada (SRS)
 * Vanilla JS, sin dependencias. Funciona offline y como PWA.
 * ==========================================================================*/
(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Estado global
  // ---------------------------------------------------------------------------
  var SUBJECTS = [];               // materias registradas (integradas + importadas)
  var PROGRESS = {};               // { cardKey: {ease, interval, reps, lapses, due, last} }
  var SETTINGS = { theme: "auto", newPerSession: 20, maxPerSession: 60, targetRetention: 0.9 };
  var NAV = [];                    // pila de navegación para el botón "volver"
  var deferredPrompt = null;       // evento de instalación PWA

  var LS_PROGRESS = "fc_progress_v1";
  var LS_SETTINGS = "fc_settings_v1";
  var LS_IMPORTED = "fc_imported_v1";

  var DAY = 24 * 60 * 60 * 1000;

  // ---------------------------------------------------------------------------
  // API pública
  // ---------------------------------------------------------------------------
  var FlashCard = {
    _queue: [],
    registerSubject: function (subject) {
      if (!subject || !subject.id) return;
      // evita duplicados por id
      var idx = SUBJECTS.map(function (s) { return s.id; }).indexOf(subject.id);
      if (idx >= 0) SUBJECTS[idx] = subject; else SUBJECTS.push(subject);
    },
    boot: boot
  };
  // procesa lo que se hubiera encolado antes de existir la función
  window.FlashCard = window.FlashCard || {};
  if (window.FlashCard._queue && window.FlashCard._queue.length) {
    window.FlashCard._queue.forEach(FlashCard.registerSubject);
  }
  window.FlashCard = FlashCard;

  // ---------------------------------------------------------------------------
  // Almacenamiento
  // ---------------------------------------------------------------------------
  function load() {
    try { PROGRESS = JSON.parse(localStorage.getItem(LS_PROGRESS)) || {}; } catch (e) { PROGRESS = {}; }
    try {
      var s = JSON.parse(localStorage.getItem(LS_SETTINGS));
      if (s) SETTINGS = Object.assign(SETTINGS, s);
    } catch (e) {}
    try {
      var imported = JSON.parse(localStorage.getItem(LS_IMPORTED)) || [];
      imported.forEach(FlashCard.registerSubject);
    } catch (e) {}
  }
  function saveProgress() {
    try { localStorage.setItem(LS_PROGRESS, JSON.stringify(PROGRESS)); } catch (e) {}
  }
  function saveSettings() {
    try { localStorage.setItem(LS_SETTINGS, JSON.stringify(SETTINGS)); } catch (e) {}
  }
  function saveImported(list) {
    try { localStorage.setItem(LS_IMPORTED, JSON.stringify(list)); } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------------------------
  function el(id) { return document.getElementById(id); }
  function cardKey(subjectId, deckId, cardId) { return subjectId + "::" + deckId + "::" + cardId; }
  function now() { return Date.now(); }
  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Markdown ligero → HTML seguro (negrita, cursiva, código, listas, saltos)
  function md(text) {
    var lines = String(text).split("\n");
    var html = "", inList = false;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var isItem = /^\s*[-*]\s+/.test(line);
      if (isItem) {
        if (!inList) { html += "<ul>"; inList = true; }
        html += "<li>" + inline(line.replace(/^\s*[-*]\s+/, "")) + "</li>";
      } else {
        if (inList) { html += "</ul>"; inList = false; }
        if (line.trim() === "") html += "<br>";
        else html += "<p>" + inline(line) + "</p>";
      }
    }
    if (inList) html += "</ul>";
    return html;
  }
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
    return s;
  }

  // ---------------------------------------------------------------------------
  // Repetición espaciada — FSRS-5 (Free Spaced Repetition Scheduler)
  //   Modela la memoria con Estabilidad (s) y Dificultad (d) y programa cada
  //   repaso para alcanzar la retención objetivo. Es el algoritmo que usa Anki
  //   en sus versiones recientes; predice el olvido mejor que SM-2.
  //   rating de los botones: 0=Otra vez, 1=Difícil, 2=Bien, 3=Fácil
  //   (internamente FSRS usa grade G = rating + 1, es decir 1..4)
  // ---------------------------------------------------------------------------
  // Pesos por defecto de FSRS-5 (19 parámetros, optimizados sobre millones de repasos).
  var FSRS_W = [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046,
                1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315,
                2.9898, 0.51655, 0.6621];
  var FSRS_DECAY = -0.5;
  var FSRS_FACTOR = Math.pow(0.9, 1 / FSRS_DECAY) - 1;   // = 19/81 ≈ 0.234568

  function clampD(d) { return Math.min(10, Math.max(1, d)); }
  function clampS(s) { return Math.max(0.01, s); }

  function initDifficulty(g) { return clampD(FSRS_W[4] - Math.exp(FSRS_W[5] * (g - 1)) + 1); }
  function initStability(g) { return clampS(FSRS_W[g - 1]); }

  // Retrievability: probabilidad de recordar tras 'elapsed' días con estabilidad s.
  function retrievability(elapsed, s) { return Math.pow(1 + FSRS_FACTOR * elapsed / s, FSRS_DECAY); }

  // Intervalo (días) que deja la retención en el objetivo dado la estabilidad s.
  function intervalFromStability(s) {
    var r = (SETTINGS.targetRetention || 0.9);
    var ivl = (s / FSRS_FACTOR) * (Math.pow(r, 1 / FSRS_DECAY) - 1);
    return Math.max(1, Math.round(ivl));
  }

  // Nueva dificultad tras un repaso (amortiguación lineal + reversión a la media).
  function nextDifficulty(d, g) {
    var deltaD = -FSRS_W[6] * (g - 3);
    var dampened = d + deltaD * (10 - d) / 9;
    var reverted = FSRS_W[7] * initDifficulty(4) + (1 - FSRS_W[7]) * dampened;
    return clampD(reverted);
  }

  function newState() { return { s: 0, d: 0, interval: 0, reps: 0, lapses: 0, due: 0, last: 0, state: "new" }; }

  function schedule(st, rating) {
    st = st || newState();
    var g = rating + 1;                  // 1..4
    var t = now();

    // Migración de estados antiguos (SM-2) que no tienen estabilidad.
    if ((st.s === undefined || st.s === 0) && st.last) {
      st.s = clampS(st.interval || initStability(3));
      st.d = clampD(st.d || 5);
    }

    var isNew = !st.last;                // nunca repasada
    if (isNew) {
      st.s = initStability(g);
      st.d = initDifficulty(g);
      if (g === 1) st.lapses += 1;
      st.reps = 1;
    } else {
      var elapsed = Math.max(0, (t - st.last) / DAY);
      var r = retrievability(elapsed, st.s);
      var sNew;
      if (elapsed < 1) {                 // repaso el mismo día → memoria a corto plazo
        sNew = st.s * Math.exp(FSRS_W[17] * (g - 3 + FSRS_W[18]));
      } else if (g === 1) {              // olvido (lapse)
        sNew = FSRS_W[11] * Math.pow(st.d, -FSRS_W[12]) *
               (Math.pow(st.s + 1, FSRS_W[13]) - 1) * Math.exp(FSRS_W[14] * (1 - r));
        sNew = Math.min(sNew, st.s);
        st.lapses += 1;
      } else {                           // acierto (recall)
        var hard = g === 2 ? FSRS_W[15] : 1;
        var easy = g === 4 ? FSRS_W[16] : 1;
        sNew = st.s * (1 + Math.exp(FSRS_W[8]) * (11 - st.d) * Math.pow(st.s, -FSRS_W[9]) *
               (Math.exp(FSRS_W[10] * (1 - r)) - 1) * hard * easy);
      }
      st.d = nextDifficulty(st.d, g);
      st.s = clampS(sNew);
      st.reps += 1;
    }

    st.last = t;
    st.state = "review";
    st.interval = intervalFromStability(st.s);
    st.due = t + st.interval * DAY;
    return st;
  }

  // Previsualización del próximo intervalo (texto para los botones).
  function previewInterval(st, rating) {
    var copy = JSON.parse(JSON.stringify(st || newState()));
    schedule(copy, rating);
    var d = copy.interval;
    if (rating === 0) return "<1d";      // "Otra vez" reaparece en la sesión
    if (d < 1) return "<1d";
    if (d < 30) return d + "d";
    if (d < 365) return Math.round(d / 30) + "mes";
    return (Math.round(d / 36.5) / 10) + "a";
  }

  // ---------------------------------------------------------------------------
  // Consultas de estado sobre mazos
  // ---------------------------------------------------------------------------
  function findSubject(id) { return SUBJECTS.filter(function (s) { return s.id === id; })[0]; }
  function findDeck(subject, deckId) {
    return subject.decks.filter(function (d) { return d.id === deckId; })[0];
  }

  // Devuelve estadísticas de un mazo: nuevas, en repaso, vencidas hoy, total, aprendidas
  function deckStats(subject, deck) {
    var t = now(), nueva = 0, pend = 0, total = deck.cards.length, aprendidas = 0;
    deck.cards.forEach(function (c) {
      var st = PROGRESS[cardKey(subject.id, deck.id, c.id)];
      if (!st || st.reps === 0 && st.last === 0) nueva++;
      else {
        if (st.reps >= 2) aprendidas++;
        if (st.due <= t) pend++;
      }
    });
    return { nueva: nueva, pend: pend, due: nueva + pend, total: total, aprendidas: aprendidas };
  }

  // Resumen de una materia (suma de sus mazos).
  function subjectStats(subject) {
    var decks = subject.decks.length, total = 0, due = 0, aprendidas = 0;
    subject.decks.forEach(function (d) {
      var st = deckStats(subject, d);
      total += st.total; due += st.due; aprendidas += st.aprendidas;
    });
    return { decks: decks, total: total, due: due, aprendidas: aprendidas };
  }

  // Construye la cola de estudio de un mazo (vencidas + nuevas, con límites)
  function buildQueue(subject, deck, mode) {
    var t = now();
    var due = [], nuevas = [];
    deck.cards.forEach(function (c) {
      var key = cardKey(subject.id, deck.id, c.id);
      var st = PROGRESS[key];
      var item = { card: c, key: key };
      if (!st || (st.reps === 0 && st.last === 0)) nuevas.push(item);
      else if (st.due <= t) due.push(item);
    });
    if (mode === "all") {                 // repasar todas, barajadas
      var allc = deck.cards.map(function (c) { return { card: c, key: cardKey(subject.id, deck.id, c.id) }; });
      return shuffle(allc);
    }
    // modo SRS: vencidas primero, luego un límite de nuevas
    shuffle(due); shuffle(nuevas);
    nuevas = nuevas.slice(0, SETTINGS.newPerSession);
    var queue = due.concat(nuevas).slice(0, SETTINGS.maxPerSession);
    return queue;
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  // ---------------------------------------------------------------------------
  // Navegación
  // ---------------------------------------------------------------------------
  function go(renderFn, title) {
    NAV.push({ render: renderFn, title: title });
    render();
  }
  function back() {
    if (NAV.length > 1) { NAV.pop(); render(); }
  }
  function replace(renderFn, title) {
    NAV[NAV.length - 1] = { render: renderFn, title: title };
    render();
  }
  function render() {
    document.onkeydown = null;           // limpia atajos de la vista anterior
    var cur = NAV[NAV.length - 1];
    el("backBtn").classList.toggle("hidden", NAV.length <= 1);
    el("topTitle").textContent = cur.title || "FlashCard";
    var view = el("view");
    view.innerHTML = "";
    cur.render(view);
    view.scrollTop = 0;
  }

  // ---------------------------------------------------------------------------
  // Helpers de búsqueda y autoevaluación
  // ---------------------------------------------------------------------------
  // Normaliza texto para búsqueda: minúsculas y sin acentos.
  function norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  // Recolecta las tarjetas etiquetadas como "test" (de un mazo o de toda la materia).
  function getTestItems(subject, deck) {
    var decks = deck ? [deck] : subject.decks;
    var items = [];
    decks.forEach(function (d) {
      d.cards.forEach(function (c) {
        if (c.tags && c.tags.indexOf("test") >= 0) {
          items.push({ card: c, key: cardKey(subject.id, d.id, c.id), deckTitle: d.title });
        }
      });
    });
    return items;
  }
  function countTest(subject, deck) { return getTestItems(subject, deck).length; }

  // Índice plano de todas las tarjetas, para el buscador global.
  function allCards() {
    var out = [];
    SUBJECTS.forEach(function (s) {
      s.decks.forEach(function (d) {
        d.cards.forEach(function (c) {
          out.push({ subject: s, deck: d, card: c });
        });
      });
    });
    return out;
  }

  // ---------------------------------------------------------------------------
  // Vistas
  // ---------------------------------------------------------------------------
  function renderHome(view) {
    // Resumen global
    var totalDue = 0, totalCards = 0;
    SUBJECTS.forEach(function (s) {
      s.decks.forEach(function (d) {
        var st = deckStats(s, d);
        totalDue += st.due; totalCards += st.total;
      });
    });

    var hero = document.createElement("div");
    hero.className = "hero";
    hero.innerHTML =
      '<div class="hero-stat"><span class="hero-num">' + totalDue + '</span><span class="hero-label">por estudiar hoy</span></div>' +
      '<div class="hero-stat"><span class="hero-num">' + totalCards + '</span><span class="hero-label">tarjetas totales</span></div>';
    view.appendChild(hero);

    // Buscador global
    var searchWrap = document.createElement("div");
    searchWrap.className = "search-wrap";
    searchWrap.innerHTML =
      '<input id="searchInput" class="search-input" type="search" autocomplete="off" ' +
      'placeholder="Buscar en todas las tarjetas…" aria-label="Buscar tarjetas">' +
      '<button id="searchClear" class="search-clear hidden" aria-label="Limpiar">×</button>';
    view.appendChild(searchWrap);

    var toolbar = document.createElement("div");
    toolbar.className = "row-actions";
    toolbar.innerHTML =
      '<button class="btn btn-primary" id="createBtn">✏️ Crear mazo</button>' +
      '<button class="btn btn-ghost" id="importBtn">＋ Importar</button>' +
      '<button class="btn btn-ghost" id="exportBtn">⇩ Exportar</button>';
    view.appendChild(toolbar);

    // Contenedor de resultados de búsqueda (oculto mientras no se busca)
    var results = document.createElement("div");
    results.id = "searchResults";
    results.className = "search-results hidden";
    view.appendChild(results);

    // Contenedor de materias (se oculta al buscar)
    var subjectsWrap = document.createElement("div");
    subjectsWrap.id = "subjectsWrap";
    view.appendChild(subjectsWrap);

    if (SUBJECTS.length === 0) {
      subjectsWrap.appendChild(emptyState("No hay materias todavía.", "Importa un mazo en formato JSON para empezar."));
    }

    // Una tarjeta por materia (grupo); al entrar se ven sus mazos.
    SUBJECTS.forEach(function (subject) {
      var ss = subjectStats(subject);
      var card = document.createElement("button");
      card.className = "subject-card";
      card.innerHTML =
        '<span class="subject-icon" style="background:' + (subject.color || "#0aa2d6") + '22;color:' +
        (subject.color || "#0aa2d6") + '">' + (subject.icon || "📚") + '</span>' +
        '<div class="subject-main">' +
          '<div class="subject-name">' + esc(subject.name) + '</div>' +
          '<div class="subject-desc">' + esc(subject.description || "") + '</div>' +
          '<div class="deck-meta">' +
            '<span class="chip">' + ss.decks + (ss.decks === 1 ? " mazo" : " mazos") + '</span>' +
            '<span class="chip chip-total">' + ss.total + ' tarjetas</span>' +
            (ss.due > 0 ? '<span class="chip chip-due">' + ss.due + ' por estudiar</span>' : '<span class="chip chip-done">al día ✓</span>') +
          '</div>' +
        '</div>' +
        '<span class="deck-go">›</span>';
      card.addEventListener("click", function () { go(function (v) { renderSubject(v, subject); }, subject.name); });
      subjectsWrap.appendChild(card);
    });

    el("importBtn") && el("importBtn").addEventListener("click", importDeck);
    el("exportBtn") && el("exportBtn").addEventListener("click", exportProgress);
    el("createBtn") && el("createBtn").addEventListener("click", function () {
      go(renderCreate, "Crear mazo");
    });

    // Buscador: filtra en vivo sobre todas las tarjetas
    var input = el("searchInput");
    var clearBtn = el("searchClear");
    function doSearch() {
      var q = input.value.trim();
      clearBtn.classList.toggle("hidden", q === "");
      var searching = q.length >= 2;
      hero.classList.toggle("hidden", searching);
      subjectsWrap.classList.toggle("hidden", searching);
      results.classList.toggle("hidden", !searching);
      if (searching) renderSearchResults(results, q);
    }
    input.addEventListener("input", doSearch);
    clearBtn.addEventListener("click", function () { input.value = ""; input.focus(); doSearch(); });
  }

  // Botón-tarjeta de un mazo (reutilizado en la vista de materia).
  function deckCardEl(subject, deck) {
    var st = deckStats(subject, deck);
    var pct = st.total ? Math.round((st.aprendidas / st.total) * 100) : 0;
    var card = document.createElement("button");
    card.className = "deck-card";
    card.innerHTML =
      '<div class="deck-main">' +
        '<div class="deck-title">' + esc(deck.title) + '</div>' +
        '<div class="deck-desc">' + esc(deck.description || "") + '</div>' +
        '<div class="progress"><div class="progress-bar" style="width:' + pct + '%;background:' + (subject.color || "#0aa2d6") + '"></div></div>' +
        '<div class="deck-meta">' +
          '<span class="chip chip-total">' + st.total + ' tarjetas</span>' +
          (st.due > 0 ? '<span class="chip chip-due">' + st.due + ' por estudiar</span>' : '<span class="chip chip-done">al día ✓</span>') +
          '<span class="chip">' + pct + '% aprendido</span>' +
        '</div>' +
      '</div>' +
      '<span class="deck-go">›</span>';
    card.addEventListener("click", function () { go(function (v) { renderDeck(v, subject, deck); }, deck.title); });
    return card;
  }

  // Vista de una materia: su cabecera, acciones y la lista de todos sus mazos.
  function renderSubject(view, subject) {
    var tc = countTest(subject);
    var head = document.createElement("div");
    head.className = "subject-head subject-page-head";
    head.innerHTML =
      '<span class="subject-icon" style="background:' + (subject.color || "#0aa2d6") + '22;color:' +
      (subject.color || "#0aa2d6") + '">' + (subject.icon || "📚") + '</span>' +
      '<div class="subject-head-text"><div class="subject-name">' + esc(subject.name) + '</div>' +
      '<div class="subject-desc">' + esc(subject.description || "") + '</div></div>';
    view.appendChild(head);

    var actions = document.createElement("div");
    actions.className = "row-actions";
    actions.innerHTML =
      '<button class="btn btn-ghost btn-small" id="subjNew">✏️ Nuevo mazo</button>' +
      (tc > 0 ? '<button class="btn btn-exam btn-small" id="subjExam">🎯 Autoevaluación (' + tc + ')</button>' : "");
    view.appendChild(actions);

    if (!subject.decks.length) {
      view.appendChild(emptyState("Esta materia no tiene mazos.", "Crea uno con “Nuevo mazo”."));
    }
    subject.decks.forEach(function (deck) { view.appendChild(deckCardEl(subject, deck)); });

    el("subjNew").addEventListener("click", function () {
      CREATE_DRAFT = newDraft(); CREATE_DRAFT.subjectName = subject.name;
      go(renderCreate, "Crear mazo");
    });
    if (tc > 0) el("subjExam").addEventListener("click", function () { startExam(subject, null, "Test · " + subject.name); });
  }

  // Renderiza los resultados de búsqueda en el contenedor dado.
  function renderSearchResults(container, query) {
    var terms = norm(query).split(/\s+/).filter(Boolean);
    var matches = allCards().filter(function (e) {
      var c = e.card;
      var body = isMcq(c) ? (c.question + " " + (c.options || []).join(" ") + " " + (c.explanation || "")) : (c.front + " " + c.back);
      var hay = norm(body + " " + (c.tags || []).join(" ") + " " + e.deck.title + " " + e.subject.name);
      return terms.every(function (t) { return hay.indexOf(t) >= 0; });
    });
    container.innerHTML = "";
    var head = document.createElement("div");
    head.className = "search-count";
    head.textContent = matches.length + (matches.length === 1 ? " resultado" : " resultados");
    container.appendChild(head);

    if (matches.length === 0) {
      container.appendChild(emptyState("Sin resultados", "Prueba con otras palabras o menos términos."));
      return;
    }
    matches.slice(0, 120).forEach(function (e) {
      var item = document.createElement("div");
      item.className = "browse-card";
      var c = e.card;
      item.innerHTML =
        '<div class="search-crumb">' + esc(e.subject.name) + " · " + esc(e.deck.title) + "</div>" +
        '<div class="browse-q">' + (isMcq(c) ? md(c.question || "") : md(c.front)) + "</div>" +
        '<div class="browse-a">' + (isMcq(c) ? mcqReviewHtml(c) : (imgHtml(c) + md(c.back))) + "</div>";
      item.addEventListener("click", function () { item.classList.toggle("open"); });
      container.appendChild(item);
    });
    if (matches.length > 120) {
      var more = document.createElement("div");
      more.className = "search-count";
      more.textContent = "Mostrando 120 de " + matches.length + ". Afina la búsqueda para ver menos.";
      container.appendChild(more);
    }
  }

  function renderDeck(view, subject, deck) {
    var st = deckStats(subject, deck);
    var pct = st.total ? Math.round((st.aprendidas / st.total) * 100) : 0;
    var testCount = countTest(subject, deck);

    var panel = document.createElement("div");
    panel.className = "deck-detail";
    panel.innerHTML =
      '<p class="deck-detail-desc">' + esc(deck.description || "") + '</p>' +
      '<div class="stat-grid">' +
        statBox(st.due, "Por estudiar", "#e8590c") +
        statBox(st.nueva, "Nuevas", "#1c7ed6") +
        statBox(st.aprendidas, "Aprendidas", "#2f9e44") +
        statBox(st.total, "Total", "#495057") +
      '</div>' +
      '<div class="progress big"><div class="progress-bar" style="width:' + pct + '%;background:' + (subject.color || "#0aa2d6") + '"></div></div>' +
      '<div class="deck-buttons">' +
        '<button class="btn btn-primary" id="studySrs"' + (st.due === 0 ? " disabled" : "") + '>▶ Estudiar' + (st.due ? " (" + st.due + ")" : "") + '</button>' +
        '<button class="btn btn-ghost" id="studyAll">🔀 Repasar todas</button>' +
        '<button class="btn btn-ghost" id="browse">📄 Ver tarjetas</button>' +
      '</div>' +
      (testCount > 0 ? '<button class="btn btn-exam" id="examDeck">🎯 Autoevaluación (' + testCount + ' preguntas de test)</button>' : "") +
      '<button class="btn btn-danger-ghost btn-small" id="resetDeck">↺ Reiniciar progreso del mazo</button>';
    view.appendChild(panel);

    if (testCount > 0) {
      el("examDeck").addEventListener("click", function () {
        startExam(subject, deck, "Test · " + deck.title);
      });
    }

    el("studySrs").addEventListener("click", function () {
      var q = buildQueue(subject, deck, "srs");
      if (q.length) startSession(subject, deck, q, "srs");
    });
    el("studyAll").addEventListener("click", function () {
      var q = buildQueue(subject, deck, "all");
      if (q.length) startSession(subject, deck, q, "all");
    });
    el("browse").addEventListener("click", function () {
      go(function (v) { renderBrowse(v, subject, deck); }, "Tarjetas · " + deck.title);
    });
    el("resetDeck").addEventListener("click", function () {
      if (confirm("¿Reiniciar el progreso de este mazo? Se perderá el historial de repaso de sus tarjetas.")) {
        deck.cards.forEach(function (c) { delete PROGRESS[cardKey(subject.id, deck.id, c.id)]; });
        saveProgress();
        replace(function (v) { renderDeck(v, subject, deck); }, deck.title);
      }
    });
  }

  function renderBrowse(view, subject, deck) {
    deck.cards.forEach(function (c, i) {
      var item = document.createElement("div");
      item.className = "browse-card";
      var st = PROGRESS[cardKey(subject.id, deck.id, c.id)];
      var badge = !st || st.last === 0 ? '<span class="mini-chip new">nueva</span>'
        : st.reps >= 2 ? '<span class="mini-chip ok">aprendida</span>'
        : '<span class="mini-chip rev">en repaso</span>';
      var q = isMcq(c) ? (md(c.question || "") + ' <span class="mini-chip rev">' + (c.multi ? "multi" : "test") + '</span>') : md(c.front);
      item.innerHTML =
        '<div class="browse-q">' + (i + 1) + '. ' + q + ' ' + badge + '</div>' +
        '<div class="browse-a">' + (isMcq(c) ? mcqReviewHtml(c) : (imgHtml(c) + md(c.back))) + '</div>';
      item.addEventListener("click", function () { item.classList.toggle("open"); });
      view.appendChild(item);
    });
  }

  // ---------------------------------------------------------------------------
  // Sesión de estudio
  // ---------------------------------------------------------------------------
  function startSession(subject, deck, queue, mode) {
    var session = { subject: subject, deck: deck, queue: queue, mode: mode, i: 0, done: 0, again: 0, total: queue.length };
    go(function (v) { renderStudy(v, session); }, deck.title);
  }

  function renderStudy(view, session) {
    if (session.i >= session.queue.length) { renderSessionEnd(view, session); return; }
    var item = session.queue[session.i];
    var card = item.card;
    var st = PROGRESS[item.key] || newState();

    var progressPct = Math.round((session.done / session.total) * 100);

    var mcq = isMcq(card);
    var wrap = document.createElement("div");
    wrap.className = "study";
    var head =
      '<div class="study-progress"><div class="study-progress-bar" style="width:' + progressPct + '%"></div></div>' +
      '<div class="study-count">' + Math.min(session.done + 1, session.total) + ' / ' + session.total +
        (session.again ? ' · <span class="again-count">' + session.again + ' repetir</span>' : '') + '</div>';

    if (!mcq) {
      wrap.innerHTML = head +
        '<div class="flashcard" id="flash">' +
          '<div class="flash-face flash-front">' + imgHtml(card) + '<div class="flash-content">' + md(card.front) + '</div>' +
            '<div class="flash-hint">Toca o pulsa Espacio para ver la respuesta</div></div>' +
          '<div class="flash-face flash-back hidden"><div class="flash-label">Respuesta</div>' +
            '<div class="flash-content">' + md(card.back) + '</div>' + tagsHtml(card) +
          '</div>' +
        '</div>' +
        '<div class="rate-bar hidden" id="rateBar">' + ratesHtml(st) + '</div>' +
        '<button class="btn btn-primary reveal-btn" id="revealBtn">Mostrar respuesta</button>';
    } else {
      var opts = card.options.map(function (o, idx) {
        return '<button class="mcq-opt" data-i="' + idx + '"><span class="mcq-box"></span><span class="mcq-text">' + md(String(o)) + '</span></button>';
      }).join("");
      wrap.innerHTML = head +
        '<div class="flashcard mcq-card">' +
          imgHtml(card) +
          '<div class="flash-content mcq-q">' + md(card.question || card.front || "") + '</div>' +
          '<div class="mcq-hint">' + (card.multi ? "Selecciona TODAS las correctas" : "Selecciona una opción") + '</div>' +
          '<div class="mcq-options" id="mcqOpts">' + opts + '</div>' +
          ((card.explanation || card.back) ? '<div class="mcq-explain hidden" id="mcqExplain"><div class="flash-label">Explicación</div><div class="flash-content">' + md(card.explanation || card.back) + '</div></div>' : "") +
          tagsHtml(card) +
        '</div>' +
        '<div class="rate-bar hidden" id="rateBar">' + ratesHtml(st) + '</div>' +
        '<button class="btn btn-primary reveal-btn" id="revealBtn" disabled>Comprobar</button>';
    }
    view.appendChild(wrap);

    var selected = [];
    var checked = false;

    if (mcq) {
      var optEls = wrap.querySelectorAll(".mcq-opt");
      Array.prototype.forEach.call(optEls, function (b) {
        b.addEventListener("click", function () {
          if (checked) return;
          var i = parseInt(b.getAttribute("data-i"), 10);
          if (card.multi) {
            var pos = selected.indexOf(i);
            if (pos >= 0) { selected.splice(pos, 1); b.classList.remove("sel"); }
            else { selected.push(i); b.classList.add("sel"); }
          } else {
            selected = [i];
            Array.prototype.forEach.call(optEls, function (x) { x.classList.remove("sel"); });
            b.classList.add("sel");
          }
          el("revealBtn").disabled = selected.length === 0;
        });
      });
    }

    function reveal() {
      if (!mcq) {
        wrap.querySelector(".flash-back").classList.remove("hidden");
        wrap.querySelector(".flash-front .flash-hint").classList.add("hidden");
      } else {
        if (el("revealBtn").disabled) return;
        checked = true;
        var corr = card.correct || [];
        Array.prototype.forEach.call(wrap.querySelectorAll(".mcq-opt"), function (b) {
          var i = parseInt(b.getAttribute("data-i"), 10);
          var isC = corr.indexOf(i) >= 0, isSel = selected.indexOf(i) >= 0;
          if (isC) b.classList.add("correct");
          if (isSel && !isC) b.classList.add("wrong");
          b.classList.add("done");
        });
        var ex = el("mcqExplain"); if (ex) ex.classList.remove("hidden");
      }
      el("rateBar").classList.remove("hidden");
      el("revealBtn").classList.add("hidden");
    }
    el("revealBtn").addEventListener("click", reveal);
    if (!mcq) {
      el("flash").addEventListener("click", function () {
        if (el("rateBar").classList.contains("hidden")) reveal();
      });
    }

    function rate(r) {
      var state = PROGRESS[item.key] || newState();
      schedule(state, r);
      PROGRESS[item.key] = state;
      saveProgress();
      if (r === 0) {                    // reencolar al final de la sesión
        session.queue.push(item);
        session.again++;
      }
      session.done++;
      session.i++;
      render();
    }
    Array.prototype.forEach.call(wrap.querySelectorAll(".rate-btn"), function (b) {
      b.addEventListener("click", function () { rate(parseInt(b.getAttribute("data-r"), 10)); });
    });

    // atajos de teclado (PC)
    session._key = function (e) {
      if (el("rateBar") && el("rateBar").classList.contains("hidden")) {
        if (mcq) {
          var n = parseInt(e.key, 10);
          if (n >= 1 && n <= card.options.length) { e.preventDefault(); wrap.querySelectorAll(".mcq-opt")[n - 1].click(); }
          else if (e.code === "Enter") { e.preventDefault(); reveal(); }
        } else if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); reveal(); }
      } else {
        if (e.key === "1") rate(0);
        else if (e.key === "2") rate(1);
        else if (e.key === "3" || e.code === "Space") { e.preventDefault(); rate(2); }
        else if (e.key === "4") rate(3);
      }
    };
    document.onkeydown = session._key;
  }

  function renderSessionEnd(view, session) {
    document.onkeydown = null;
    var st = deckStats(session.subject, session.deck);
    var box = document.createElement("div");
    box.className = "session-end";
    box.innerHTML =
      '<div class="celebrate">🎉</div>' +
      '<h2>¡Sesión completada!</h2>' +
      '<p>Repasaste <strong>' + session.total + '</strong> tarjeta' + (session.total === 1 ? "" : "s") +
        (session.again ? ' (' + session.again + ' marcadas para repetir).' : '.') + '</p>' +
      '<div class="stat-grid">' +
        statBox(st.due, "Aún por estudiar", "#e8590c") +
        statBox(st.aprendidas, "Aprendidas", "#2f9e44") +
        statBox(st.total, "Total", "#495057") +
      '</div>' +
      '<div class="deck-buttons">' +
        (st.due > 0 ? '<button class="btn btn-primary" id="again">Seguir estudiando (' + st.due + ')</button>' : '') +
        '<button class="btn btn-ghost" id="toDeck">Volver al mazo</button>' +
      '</div>';
    view.appendChild(box);
    el("again") && el("again").addEventListener("click", function () {
      var q = buildQueue(session.subject, session.deck, "srs");
      if (q.length) replace(function (v) { renderStudy(v, { subject: session.subject, deck: session.deck, queue: q, mode: "srs", i: 0, done: 0, again: 0, total: q.length }); }, session.deck.title);
    });
    el("toDeck").addEventListener("click", back);
  }

  // ---------------------------------------------------------------------------
  // Modo autoevaluación (examen con las preguntas de test)
  //  - Solo incluye tarjetas etiquetadas "test".
  //  - NO modifica el progreso SRS: es una simulación con puntuación.
  // ---------------------------------------------------------------------------
  function startExam(subject, deck, title) {
    var items = getTestItems(subject, deck);
    if (!items.length) return;
    shuffle(items);
    var session = { title: title, queue: items, i: 0, correct: 0, wrong: 0, total: items.length };
    go(function (v) { renderExam(v, session); }, title);
  }

  function renderExam(view, session) {
    if (session.i >= session.queue.length) { renderExamEnd(view, session); return; }
    var card = session.queue[session.i].card;
    var deckTitle = session.queue[session.i].deckTitle;
    var pct = Math.round((session.i / session.total) * 100);

    var mcq = isMcq(card);
    var wrap = document.createElement("div");
    wrap.className = "study";
    var head =
      '<div class="study-progress"><div class="study-progress-bar exam-bar" style="width:' + pct + '%"></div></div>' +
      '<div class="study-count">Pregunta ' + (session.i + 1) + ' / ' + session.total +
        ' · <span class="exam-score">✓ ' + session.correct + '</span></div>' +
      (deckTitle ? '<div class="search-crumb exam-crumb">' + esc(deckTitle) + '</div>' : "");

    if (!mcq) {
      wrap.innerHTML = head +
        '<div class="flashcard" id="flash">' +
          '<div class="flash-face flash-front">' + imgHtml(card) + '<div class="flash-content">' + md(card.front) + '</div>' +
            '<div class="flash-hint">Piensa tu respuesta y pulsa para comprobar</div></div>' +
          '<div class="flash-face flash-back hidden"><div class="flash-label">Respuesta</div>' +
            '<div class="flash-content">' + md(card.back) + '</div></div>' +
        '</div>' +
        '<div class="rate-bar exam-rate hidden" id="rateBar">' +
          '<button class="rate-btn rate-again" data-r="0"><span class="rate-label">✗ Fallé</span></button>' +
          '<button class="rate-btn rate-good" data-r="1"><span class="rate-label">✓ Acerté</span></button>' +
        '</div>' +
        '<button class="btn btn-primary reveal-btn" id="revealBtn">Comprobar respuesta</button>';
    } else {
      var opts = card.options.map(function (o, idx) {
        return '<button class="mcq-opt" data-i="' + idx + '"><span class="mcq-box"></span><span class="mcq-text">' + md(String(o)) + '</span></button>';
      }).join("");
      wrap.innerHTML = head +
        '<div class="flashcard mcq-card">' +
          imgHtml(card) +
          '<div class="flash-content mcq-q">' + md(card.question || card.front || "") + '</div>' +
          '<div class="mcq-hint">' + (card.multi ? "Selecciona TODAS las correctas" : "Selecciona una opción") + '</div>' +
          '<div class="mcq-options" id="mcqOpts">' + opts + '</div>' +
          ((card.explanation || card.back) ? '<div class="mcq-explain hidden" id="mcqExplain"><div class="flash-label">Explicación</div><div class="flash-content">' + md(card.explanation || card.back) + '</div></div>' : "") +
        '</div>' +
        '<button class="btn btn-primary reveal-btn" id="revealBtn" disabled>Comprobar</button>' +
        '<button class="btn btn-primary reveal-btn hidden" id="nextBtn">Siguiente ▶</button>';
    }
    view.appendChild(wrap);

    function answer(ok) {
      if (ok) session.correct++; else session.wrong++;
      session.i++;
      render();
    }

    if (!mcq) {
      var reveal = function () {
        wrap.querySelector(".flash-back").classList.remove("hidden");
        wrap.querySelector(".flash-front .flash-hint").classList.add("hidden");
        el("rateBar").classList.remove("hidden");
        el("revealBtn").classList.add("hidden");
      };
      el("revealBtn").addEventListener("click", reveal);
      el("flash").addEventListener("click", function () { if (el("rateBar").classList.contains("hidden")) reveal(); });
      Array.prototype.forEach.call(wrap.querySelectorAll(".rate-btn"), function (b) {
        b.addEventListener("click", function () { answer(b.getAttribute("data-r") === "1"); });
      });
      session._key = function (e) {
        if (el("rateBar") && el("rateBar").classList.contains("hidden")) {
          if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); reveal(); }
        } else {
          if (e.key === "1") answer(false);
          else if (e.key === "2" || e.code === "Space") { e.preventDefault(); answer(true); }
        }
      };
    } else {
      var selected = [], checkedM = false, wasOk = false;
      var optEls = wrap.querySelectorAll(".mcq-opt");
      Array.prototype.forEach.call(optEls, function (b) {
        b.addEventListener("click", function () {
          if (checkedM) return;
          var i = parseInt(b.getAttribute("data-i"), 10);
          if (card.multi) {
            var pos = selected.indexOf(i);
            if (pos >= 0) { selected.splice(pos, 1); b.classList.remove("sel"); }
            else { selected.push(i); b.classList.add("sel"); }
          } else {
            selected = [i];
            Array.prototype.forEach.call(optEls, function (x) { x.classList.remove("sel"); });
            b.classList.add("sel");
          }
          el("revealBtn").disabled = selected.length === 0;
        });
      });
      var checkM = function () {
        if (el("revealBtn").disabled) return;
        checkedM = true;
        var corr = (card.correct || []).slice().sort().join(",");
        var sel = selected.slice().sort().join(",");
        wasOk = corr === sel;
        Array.prototype.forEach.call(optEls, function (b) {
          var i = parseInt(b.getAttribute("data-i"), 10);
          var isC = (card.correct || []).indexOf(i) >= 0, isSel = selected.indexOf(i) >= 0;
          if (isC) b.classList.add("correct");
          if (isSel && !isC) b.classList.add("wrong");
          b.classList.add("done");
        });
        var ex = el("mcqExplain"); if (ex) ex.classList.remove("hidden");
        el("revealBtn").classList.add("hidden");
        var nb = el("nextBtn");
        nb.textContent = (wasOk ? "✓ Correcto" : "✗ Incorrecto") + " · Siguiente ▶";
        nb.classList.remove("hidden");
        nb.classList.toggle("btn-ok", wasOk);
        nb.classList.toggle("btn-ko", !wasOk);
      };
      el("revealBtn").addEventListener("click", checkM);
      el("nextBtn").addEventListener("click", function () { answer(wasOk); });
      session._key = function (e) {
        if (!checkedM) {
          var n = parseInt(e.key, 10);
          if (n >= 1 && n <= card.options.length) { e.preventDefault(); optEls[n - 1].click(); }
          else if (e.code === "Enter") { e.preventDefault(); checkM(); }
        } else if (e.code === "Enter" || e.code === "Space") { e.preventDefault(); answer(wasOk); }
      };
    }
    document.onkeydown = session._key;
  }

  function renderExamEnd(view, session) {
    document.onkeydown = null;
    var pct = session.total ? Math.round((session.correct / session.total) * 100) : 0;
    var color = pct >= 70 ? "#2f9e44" : pct >= 50 ? "#e8590c" : "#e03131";
    var emoji = pct >= 70 ? "🏆" : pct >= 50 ? "📈" : "📚";
    var msg = pct >= 70 ? "¡Muy bien! Dominas el tema." : pct >= 50 ? "Vas por buen camino, sigue repasando." : "A repasar: aún quedan conceptos por afianzar.";
    var box = document.createElement("div");
    box.className = "session-end";
    box.innerHTML =
      '<div class="celebrate">' + emoji + '</div>' +
      '<h2>Autoevaluación completada</h2>' +
      '<div class="exam-score-big" style="color:' + color + '">' + session.correct + " / " + session.total + '</div>' +
      '<div class="progress big"><div class="progress-bar" style="width:' + pct + '%;background:' + color + '"></div></div>' +
      '<p>' + pct + '% de aciertos. ' + msg + '</p>' +
      '<div class="deck-buttons">' +
        '<button class="btn btn-primary" id="examAgain">🔁 Repetir test</button>' +
        '<button class="btn btn-ghost" id="examBack">Volver</button>' +
      '</div>';
    view.appendChild(box);
    el("examAgain").addEventListener("click", function () {
      var items = session.queue.slice();
      shuffle(items);
      replace(function (v) { renderExam(v, { title: session.title, queue: items, i: 0, correct: 0, wrong: 0, total: items.length }); }, session.title);
    });
    el("examBack").addEventListener("click", back);
  }

  // ---------------------------------------------------------------------------
  // Componentes reutilizables
  // ---------------------------------------------------------------------------
  function statBox(num, label, color) {
    return '<div class="stat-box"><span class="stat-num" style="color:' + color + '">' + num + '</span><span class="stat-label">' + label + '</span></div>';
  }
  function rateBtn(r, label, st) {
    var cls = ["again", "hard", "good", "easy"][r];
    return '<button class="rate-btn rate-' + cls + '" data-r="' + r + '">' +
      '<span class="rate-label">' + label + '</span>' +
      '<span class="rate-int">' + previewInterval(st, r) + '</span></button>';
  }
  function emptyState(title, sub) {
    var d = document.createElement("div");
    d.className = "empty";
    d.innerHTML = '<div class="empty-icon">🗂️</div><div class="empty-title">' + esc(title) + '</div><div class="empty-sub">' + esc(sub) + '</div>';
    return d;
  }

  // ---- Helpers de tipo de tarjeta (básica vs opción múltiple) e imagen ----
  function isMcq(card) { return !!(card && card.type === "mcq" && card.options && card.options.length); }
  function imgHtml(card) { return card && card.image ? '<img class="card-img" src="' + esc(card.image) + '" alt="imagen de la tarjeta">' : ""; }
  function tagsHtml(card) {
    if (!card.tags || !card.tags.length) return "";
    return '<div class="flash-tags">' + card.tags.map(function (t) { return '<span class="tag">#' + esc(t) + '</span>'; }).join("") + "</div>";
  }
  function ratesHtml(st) { return rateBtn(0, "Otra vez", st) + rateBtn(1, "Difícil", st) + rateBtn(2, "Bien", st) + rateBtn(3, "Fácil", st); }
  // Vista de una tarjeta MCQ ya resuelta (para ver/buscar): opciones con la correcta marcada.
  function mcqReviewHtml(card) {
    var opts = card.options.map(function (o, i) {
      var ok = (card.correct || []).indexOf(i) >= 0;
      return '<div class="mcq-opt done ' + (ok ? "correct" : "") + '"><span class="mcq-box"></span><span class="mcq-text">' + md(String(o)) + "</span></div>";
    }).join("");
    return imgHtml(card) + '<div class="mcq-options review">' + opts + "</div>" +
      (card.explanation ? '<div class="mcq-explain"><div class="flash-label">Explicación</div>' + md(card.explanation) + "</div>" : "");
  }

  // ---------------------------------------------------------------------------
  // Importar / exportar
  // ---------------------------------------------------------------------------
  function importDeck() {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.addEventListener("change", function () {
      var file = input.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(reader.result);
          if (!data.id || !data.decks) throw new Error("Formato inválido: falta 'id' o 'decks'.");
          FlashCard.registerSubject(data);
          var stored = [];
          try { stored = JSON.parse(localStorage.getItem(LS_IMPORTED)) || []; } catch (e) {}
          stored = stored.filter(function (s) { return s.id !== data.id; });
          stored.push(data);
          saveImported(stored);
          alert("Materia \"" + (data.name || data.id) + "\" importada correctamente.");
          replace(renderHome, "FlashCard");
        } catch (e) {
          alert("No se pudo importar: " + e.message);
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  function exportProgress() {
    var payload = { exported: new Date().toISOString(), progress: PROGRESS };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "flashcard-progreso-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // ---------------------------------------------------------------------------
  // Creador de mazos (tradicional u opción múltiple, con imágenes)
  // ---------------------------------------------------------------------------
  var CREATE_DRAFT = null;
  function newDraft() { return { subjectName: "", deckTitle: "", deckDesc: "", type: "basic", cards: [] }; }

  function slugify(s) {
    var v = norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
    return v || ("m" + Date.now());
  }
  function saveSubjectLocal(subject) {
    var stored = [];
    try { stored = JSON.parse(localStorage.getItem(LS_IMPORTED)) || []; } catch (e) {}
    var idx = stored.map(function (s) { return s.id; }).indexOf(subject.id);
    if (idx >= 0) stored[idx] = subject; else stored.push(subject);
    saveImported(stored);
    FlashCard.registerSubject(subject);
  }
  // Reduce el tamaño de la imagen antes de guardarla (localStorage es limitado).
  function downscaleImage(file, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 800, w = img.width, h = img.height;
        if (w > max || h > max) { var r = Math.min(max / w, max / h); w = Math.round(w * r); h = Math.round(h * r); }
        try {
          var cv = document.createElement("canvas"); cv.width = w; cv.height = h;
          cv.getContext("2d").drawImage(img, 0, 0, w, h);
          cb(cv.toDataURL("image/jpeg", 0.82));
        } catch (e) { cb(reader.result); }
      };
      img.onerror = function () { cb(reader.result); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function renderCreate(view) {
    if (!CREATE_DRAFT) CREATE_DRAFT = newDraft();
    var d = CREATE_DRAFT;
    var imgData = null;   // imagen de la tarjeta en curso (data URI)

    var wrap = document.createElement("div");
    wrap.className = "creator";
    wrap.innerHTML =
      '<label>Materia</label>' +
      '<input type="text" id="cSubject" placeholder="Ej.: Inglés, Biología…" value="' + esc(d.subjectName) + '">' +
      '<label>Título del mazo</label>' +
      '<input type="text" id="cDeck" placeholder="Ej.: Comparativos, Tema 1…" value="' + esc(d.deckTitle) + '">' +
      '<label>Descripción (opcional)</label>' +
      '<input type="text" id="cDesc" placeholder="De qué trata" value="' + esc(d.deckDesc) + '">' +
      '<label>Tipo de tarjeta a añadir</label>' +
      '<div class="seg" id="cSeg">' +
        '<button data-t="basic" class="' + (d.type === "basic" ? "active" : "") + '">🔁 Tradicional</button>' +
        '<button data-t="mcq" class="' + (d.type === "mcq" ? "active" : "") + '">☑️ Opción múltiple</button>' +
      '</div>' +
      '<div id="cForm"></div>' +
      '<div id="cList"></div>' +
      '<div class="deck-buttons" style="margin-top:16px">' +
        '<button class="btn btn-primary" id="cSave">💾 Guardar mazo (' + d.cards.length + ')</button>' +
        '<button class="btn btn-ghost" id="cCancel">Cancelar</button>' +
      '</div>';
    view.appendChild(wrap);

    // Persistir cabecera en el borrador
    el("cSubject").addEventListener("input", function () { d.subjectName = this.value; });
    el("cDeck").addEventListener("input", function () { d.deckTitle = this.value; });
    el("cDesc").addEventListener("input", function () { d.deckDesc = this.value; });

    Array.prototype.forEach.call(wrap.querySelectorAll("#cSeg button"), function (b) {
      b.addEventListener("click", function () { d.type = b.getAttribute("data-t"); replace(renderCreate, "Crear mazo"); });
    });

    // --- Formulario de la tarjeta en curso ---
    var form = el("cForm");
    var imgRowHtml =
      '<label>Imagen (opcional)</label>' +
      '<input type="file" id="cImg" accept="image/*">' +
      '<img class="img-preview hidden" id="cImgPrev" alt="">';

    if (d.type === "basic") {
      form.innerHTML =
        '<label>Anverso (pregunta)</label><textarea id="cFront" placeholder="Admite **negrita**, `código`, listas con -"></textarea>' +
        '<label>Reverso (respuesta)</label><textarea id="cBack"></textarea>' +
        imgRowHtml +
        '<button class="btn btn-ghost" id="cAdd" style="margin-top:12px">➕ Añadir tarjeta</button>';
    } else {
      form.innerHTML =
        '<label>Pregunta</label><textarea id="cQ" placeholder="Enunciado de la pregunta"></textarea>' +
        imgRowHtml +
        '<label>Opciones <span class="hint">(marca ✓ las correctas; si marcas más de una, será de varias respuestas)</span></label>' +
        '<div id="cOpts"></div>' +
        '<button class="btn btn-ghost btn-small" id="cAddOpt">➕ Añadir opción</button>' +
        '<label>Explicación (opcional)</label><textarea id="cExp" placeholder="Se muestra tras responder"></textarea>' +
        '<button class="btn btn-ghost" id="cAdd" style="margin-top:12px">➕ Añadir pregunta</button>';
    }

    // imagen
    if (el("cImg")) {
      el("cImg").addEventListener("change", function () {
        var f = this.files[0]; if (!f) return;
        downscaleImage(f, function (data) { imgData = data; var p = el("cImgPrev"); p.src = data; p.classList.remove("hidden"); });
      });
    }

    // opciones (MCQ)
    function addOptRow(text, on) {
      var row = document.createElement("div");
      row.className = "opt-row";
      row.innerHTML =
        '<button class="mark ' + (on ? "on" : "") + '" title="Marcar como correcta">✓</button>' +
        '<input type="text" placeholder="Opción" value="' + esc(text || "") + '">' +
        '<button class="del" title="Eliminar">✕</button>';
      row.querySelector(".mark").addEventListener("click", function () { this.classList.toggle("on"); });
      row.querySelector(".del").addEventListener("click", function () { row.remove(); });
      el("cOpts").appendChild(row);
    }
    if (d.type === "mcq") {
      addOptRow("", false); addOptRow("", false); addOptRow("", false); addOptRow("", false);
      el("cAddOpt").addEventListener("click", function () { addOptRow("", false); });
    }

    // añadir tarjeta al borrador
    el("cAdd").addEventListener("click", function () {
      var card = { id: "c" + Date.now() + Math.floor(Math.random() * 1000) };
      if (d.type === "basic") {
        var front = el("cFront").value.trim(), back = el("cBack").value.trim();
        if (!front || !back) { alert("Rellena anverso y reverso."); return; }
        card.front = front; card.back = back;
        if (imgData) card.image = imgData;
      } else {
        var q = el("cQ").value.trim();
        var opts = [], correct = [];
        Array.prototype.forEach.call(el("cOpts").querySelectorAll(".opt-row"), function (row) {
          var t = row.querySelector("input").value.trim();
          if (!t) return;
          if (row.querySelector(".mark").classList.contains("on")) correct.push(opts.length);
          opts.push(t);
        });
        if (!q) { alert("Escribe la pregunta."); return; }
        if (opts.length < 2) { alert("Añade al menos 2 opciones con texto."); return; }
        if (!correct.length) { alert("Marca al menos una opción correcta (✓)."); return; }
        card.type = "mcq"; card.question = q; card.options = opts; card.correct = correct;
        card.multi = correct.length > 1;
        var exp = el("cExp").value.trim(); if (exp) card.explanation = exp;
        if (imgData) card.image = imgData;
      }
      d.cards.push(card);
      replace(renderCreate, "Crear mazo");
    });

    // --- Lista de tarjetas añadidas ---
    var list = el("cList");
    if (d.cards.length) {
      var h = '<label>Tarjetas añadidas (' + d.cards.length + ')</label>';
      d.cards.forEach(function (c, i) {
        var q = isMcq(c) ? c.question : c.front;
        var tag = isMcq(c) ? (c.multi ? "multi" : "test") : "básica";
        h += '<div class="card-chip"><span class="q">' + (i + 1) + ". " + esc(q || "") + (c.image ? " 🖼️" : "") +
          '</span><span class="ctype">' + tag + '</span><button class="del" data-i="' + i + '" style="border:none;background:none;color:#e03131;font-size:18px;cursor:pointer">✕</button></div>';
      });
      list.innerHTML = h;
      Array.prototype.forEach.call(list.querySelectorAll(".del"), function (b) {
        b.addEventListener("click", function () { d.cards.splice(parseInt(b.getAttribute("data-i"), 10), 1); replace(renderCreate, "Crear mazo"); });
      });
    }

    // guardar / cancelar
    el("cSave").addEventListener("click", function () {
      if (!d.subjectName.trim()) { alert("Pon un nombre de materia."); return; }
      if (!d.deckTitle.trim()) { alert("Pon un título de mazo."); return; }
      if (!d.cards.length) { alert("Añade al menos una tarjeta."); return; }
      var subjectId = "user-" + slugify(d.subjectName);
      var stored = [];
      try { stored = JSON.parse(localStorage.getItem(LS_IMPORTED)) || []; } catch (e) {}
      var subject = stored.filter(function (s) { return s.id === subjectId; })[0];
      if (!subject) subject = { id: subjectId, name: d.subjectName.trim(), description: "Creado por mí", color: "#7048e8", icon: "🗂️", decks: [] };
      subject.decks.push({ id: "d" + Date.now(), title: d.deckTitle.trim(), description: d.deckDesc.trim(), cards: d.cards });
      saveSubjectLocal(subject);
      CREATE_DRAFT = null;
      alert("Mazo guardado en la materia \"" + subject.name + "\".");
      NAV = [{ render: renderHome, title: "FlashCard" }];
      render();
    });
    el("cCancel").addEventListener("click", function () {
      if (d.cards.length && !confirm("¿Descartar el mazo en curso?")) return;
      CREATE_DRAFT = null; back();
    });
  }

  // ---------------------------------------------------------------------------
  // Tema claro/oscuro
  // ---------------------------------------------------------------------------
  function applyTheme() {
    var t = SETTINGS.theme;
    if (t === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
  }
  function cycleTheme() {
    SETTINGS.theme = SETTINGS.theme === "auto" ? "light" : SETTINGS.theme === "light" ? "dark" : "auto";
    saveSettings();
    applyTheme();
  }

  // ---------------------------------------------------------------------------
  // PWA install prompt
  // ---------------------------------------------------------------------------
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    el("installBar").classList.remove("hidden");
  });

  // ---------------------------------------------------------------------------
  // Arranque
  // ---------------------------------------------------------------------------
  function boot() {
    load();
    applyTheme();

    el("backBtn").addEventListener("click", back);
    el("themeBtn").addEventListener("click", cycleTheme);
    el("installClose").addEventListener("click", function () { el("installBar").classList.add("hidden"); });
    el("installBtn").addEventListener("click", function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(function () {
          deferredPrompt = null;
          el("installBar").classList.add("hidden");
        });
      }
    });

    NAV = [{ render: renderHome, title: "FlashCard" }];
    render();
  }
})();
