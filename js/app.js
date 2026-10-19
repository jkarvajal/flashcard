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
      '<button class="btn btn-ghost" id="importBtn">＋ Importar mazo</button>' +
      '<button class="btn btn-ghost" id="exportBtn">⇩ Exportar progreso</button>';
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

    SUBJECTS.forEach(function (subject) {
      var section = document.createElement("section");
      section.className = "subject-block";
      var head = document.createElement("div");
      head.className = "subject-head";
      var tc = countTest(subject);
      head.innerHTML =
        '<span class="subject-icon" style="background:' + (subject.color || "#0aa2d6") + '22;color:' +
        (subject.color || "#0aa2d6") + '">' + (subject.icon || "📚") + '</span>' +
        '<div class="subject-head-text"><div class="subject-name">' + esc(subject.name) + '</div>' +
        '<div class="subject-desc">' + esc(subject.description || "") + '</div></div>' +
        (tc > 0 ? '<button class="btn btn-ghost btn-small subject-exam">🎯 Test (' + tc + ')</button>' : '');
      if (tc > 0) {
        head.querySelector(".subject-exam").addEventListener("click", function () {
          startExam(subject, null, "Test · " + subject.name);
        });
      }
      section.appendChild(head);

      subject.decks.forEach(function (deck) {
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
        card.addEventListener("click", function () {
          go(function (v) { renderDeck(v, subject, deck); }, deck.title);
        });
        section.appendChild(card);
      });
      subjectsWrap.appendChild(section);
    });

    el("importBtn") && el("importBtn").addEventListener("click", importDeck);
    el("exportBtn") && el("exportBtn").addEventListener("click", exportProgress);

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

  // Renderiza los resultados de búsqueda en el contenedor dado.
  function renderSearchResults(container, query) {
    var terms = norm(query).split(/\s+/).filter(Boolean);
    var matches = allCards().filter(function (e) {
      var hay = norm(e.card.front + " " + e.card.back + " " + (e.card.tags || []).join(" ") + " " + e.deck.title + " " + e.subject.name);
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
      item.innerHTML =
        '<div class="search-crumb">' + esc(e.subject.name) + " · " + esc(e.deck.title) + "</div>" +
        '<div class="browse-q">' + md(e.card.front) + "</div>" +
        '<div class="browse-a">' + md(e.card.back) + "</div>";
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
      item.innerHTML =
        '<div class="browse-q">' + (i + 1) + '. ' + md(c.front) + ' ' + badge + '</div>' +
        '<div class="browse-a">' + md(c.back) + '</div>';
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

    var wrap = document.createElement("div");
    wrap.className = "study";
    wrap.innerHTML =
      '<div class="study-progress"><div class="study-progress-bar" style="width:' + progressPct + '%"></div></div>' +
      '<div class="study-count">' + Math.min(session.done + 1, session.total) + ' / ' + session.total +
        (session.again ? ' · <span class="again-count">' + session.again + ' repetir</span>' : '') + '</div>' +
      '<div class="flashcard" id="flash">' +
        '<div class="flash-face flash-front"><div class="flash-content">' + md(card.front) + '</div>' +
          '<div class="flash-hint">Toca o pulsa Espacio para ver la respuesta</div></div>' +
        '<div class="flash-face flash-back hidden"><div class="flash-label">Respuesta</div>' +
          '<div class="flash-content">' + md(card.back) + '</div>' +
          (card.tags && card.tags.length ? '<div class="flash-tags">' + card.tags.map(function (t) { return '<span class="tag">#' + esc(t) + '</span>'; }).join("") + '</div>' : '') +
        '</div>' +
      '</div>' +
      '<div class="rate-bar hidden" id="rateBar">' +
        rateBtn(0, "Otra vez", st) + rateBtn(1, "Difícil", st) + rateBtn(2, "Bien", st) + rateBtn(3, "Fácil", st) +
      '</div>' +
      '<button class="btn btn-primary reveal-btn" id="revealBtn">Mostrar respuesta</button>';
    view.appendChild(wrap);

    function reveal() {
      wrap.querySelector(".flash-back").classList.remove("hidden");
      wrap.querySelector(".flash-front .flash-hint").classList.add("hidden");
      el("rateBar").classList.remove("hidden");
      el("revealBtn").classList.add("hidden");
    }
    el("revealBtn").addEventListener("click", reveal);
    el("flash").addEventListener("click", function () {
      if (el("rateBar").classList.contains("hidden")) reveal();
    });

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
        if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); reveal(); }
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

    var wrap = document.createElement("div");
    wrap.className = "study";
    wrap.innerHTML =
      '<div class="study-progress"><div class="study-progress-bar exam-bar" style="width:' + pct + '%"></div></div>' +
      '<div class="study-count">Pregunta ' + (session.i + 1) + ' / ' + session.total +
        ' · <span class="exam-score">✓ ' + session.correct + '</span></div>' +
      (deckTitle ? '<div class="search-crumb exam-crumb">' + esc(deckTitle) + '</div>' : "") +
      '<div class="flashcard" id="flash">' +
        '<div class="flash-face flash-front"><div class="flash-content">' + md(card.front) + '</div>' +
          '<div class="flash-hint">Piensa tu respuesta y pulsa para comprobar</div></div>' +
        '<div class="flash-face flash-back hidden"><div class="flash-label">Respuesta</div>' +
          '<div class="flash-content">' + md(card.back) + '</div></div>' +
      '</div>' +
      '<div class="rate-bar exam-rate hidden" id="rateBar">' +
        '<button class="rate-btn rate-again" data-r="0"><span class="rate-label">✗ Fallé</span></button>' +
        '<button class="rate-btn rate-good" data-r="1"><span class="rate-label">✓ Acerté</span></button>' +
      '</div>' +
      '<button class="btn btn-primary reveal-btn" id="revealBtn">Comprobar respuesta</button>';
    view.appendChild(wrap);

    function reveal() {
      wrap.querySelector(".flash-back").classList.remove("hidden");
      wrap.querySelector(".flash-front .flash-hint").classList.add("hidden");
      el("rateBar").classList.remove("hidden");
      el("revealBtn").classList.add("hidden");
    }
    el("revealBtn").addEventListener("click", reveal);
    el("flash").addEventListener("click", function () {
      if (el("rateBar").classList.contains("hidden")) reveal();
    });

    function answer(ok) {
      if (ok) session.correct++; else session.wrong++;
      session.i++;
      render();
    }
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
