/* Café Pilates — drobná vylepšení stránek. Obsah je čitelný i bez JavaScriptu. */
(function () {
  "use strict";

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return (root || document).querySelectorAll(sel); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* --- Mobilní menu ----------------------------------------------------- */
  var toggle = $(".nav-toggle");
  var nav = document.getElementById("hlavni-menu");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Otevřít menu" : "Zavřít menu");
      nav.classList.toggle("is-open", !open);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      }
    });
  }

  /* --- Rozvrh (živá data z rezervačního systému) ------------------------ */
  // <div class="timetable" data-rozvrh data-api="https://…" data-site="klíč"></div>
  // Lekce, volná místa a ceny se načítají z rezervačního systému. Tlačítko
  // Rezervovat vede přímo na danou lekci v rezervačním systému.
  var DNY_ZKR = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
  var DNY_NAZEV = ["Neděle", "Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota"];
  var PROFILY = window.LEKTORKY_PROFILY || {};

  // Typ lekce se pozná z názvu; podle typu se lekce barevně odliší a dá se podle něj filtrovat.
  var TYPY = [
    { id: "pilates", nazev: "Pilates", test: /pilates level|spine corrector|sm systém/i },
    { id: "barre", nazev: "Barre", test: /barre/i },
    { id: "joga", nazev: "Jóga", test: /jóga/i },
    { id: "bodystyling", nazev: "Bodystyling", test: /bodystyling/i },
    { id: "reformer", nazev: "Reformer", test: /reformer/i },
    { id: "chair", nazev: "Chair", test: /chair/i },
    { id: "jine", nazev: "Další", test: null }
  ];

  function typyLekce(l) {
    var t = TYPY.filter(function (t) { return t.test && t.test.test(l.classType); }).map(function (t) { return t.id; });
    return t.length ? t : ["jine"];
  }
  function lekciText(n) { return n >= 1 && n <= 4 ? "lekce" : "lekcí"; }
  function mistaText(n) {
    if (n === 1) return "1 volné místo";
    if (n >= 2 && n <= 4) return n + " volná místa";
    return n + " volných míst";
  }
  function cena(kc) { return String(kc).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " Kč"; }
  function dvoj(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { return d.getFullYear() + "-" + dvoj(d.getMonth() + 1) + "-" + dvoj(d.getDate()); }
  function plusDny(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
  function kratceDatum(d) { return d.getDate() + ". " + (d.getMonth() + 1) + "."; }
  function lektorka(jmeno) {
    var id = PROFILY[jmeno];
    return id ? '<a href="instruktorky.html#' + esc(id) + '">' + esc(jmeno) + "</a>" : esc(jmeno);
  }

  each($$("[data-rozvrh]"), function (box) {
    var api = (box.getAttribute("data-api") || "").replace(/\/$/, "");
    var site = box.getAttribute("data-site") || "";
    var poradiSalu = (box.getAttribute("data-saly") || "").split(",").map(function (x) { return x.trim(); });
    var dnes = plusDny(new Date(), 0);
    var stav = { tyden: 0, den: 0, sal: "vse", typ: "vse" };
    var data = null;       // poslední načtená odpověď pro zobrazený týden
    var nacteno = 0;       // kdy (ms), kvůli obnově po návratu na stránku
    var pozadavek = 0;     // pořadí požadavků – starší odpověď nepřepíše novější

    box.innerHTML =
      '<div class="tt-week">' +
        '<button type="button" class="tt-week__btn" data-tyden="-1" aria-label="Předchozí týden">‹</button>' +
        '<span class="tt-week__label"></span>' +
        '<button type="button" class="tt-week__btn" data-tyden="1" aria-label="Další týden">›</button>' +
      "</div>" +
      '<div class="tt-days" role="group" aria-label="Den"></div>' +
      '<div class="tt-bar">' +
        '<div class="tt-seg" role="group" aria-label="Sál"></div>' +
        '<div class="tt-types" role="group" aria-label="Typ lekce"></div>' +
      "</div>" +
      '<div class="tt-cols" aria-live="polite"><p class="tt-empty">Načítám rozvrh…</p></div>';
    var elWeekLabel = $(".tt-week__label", box);
    var elPrev = $('[data-tyden="-1"]', box);
    var elDays = $(".tt-days", box);
    var elSeg = $(".tt-seg", box);
    var elTypes = $(".tt-types", box);
    var elCols = $(".tt-cols", box);

    function zacatekTydne() { return plusDny(dnes, 7 * stav.tyden); }

    function nacti(tiche) {
      var id = ++pozadavek;
      var od = zacatekTydne();
      if (!tiche) {
        data = null;
        vykresli();
      }
      var url = api + "/api/public/rozvrh?site=" + encodeURIComponent(site) + "&from=" + ymd(od) + "&days=7";
      fetch(url)
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (json) {
          if (id !== pozadavek) return;
          data = json;
          nacteno = Date.now();
          vykresli();
        })
        .catch(function () {
          if (id !== pozadavek || (tiche && data)) return;
          elCols.className = "tt-cols tt-cols--one";
          elCols.innerHTML = '<p class="tt-empty">Rozvrh se teď nepodařilo načíst. Zkuste stránku obnovit, ' +
            'nebo se podívejte přímo do <a href="' + esc(api) + '/calendar">rezervačního systému</a>.</p>';
        });
    }

    function vyhovuje(l) {
      return (stav.sal === "vse" || l.gymId === stav.sal) &&
        (stav.typ === "vse" || typyLekce(l).indexOf(stav.typ) !== -1);
    }

    function radek(l) {
      var kdo = lektorka(l.instructor) +
        (l.regularInstructor ? ' <span class="tt-sub">(záskok, obvykle ' + esc(l.regularInstructor) + ")</span>" : "");
      var plno = l.free <= 0;
      var meta = l.started ? "" :
        '<span class="tt-meta"><span class="tt-free' + (plno ? " tt-free--full" : l.free <= 2 ? " tt-free--low" : "") + '">' +
          (plno ? "obsazeno" : mistaText(l.free)) + "</span> · " + cena(l.priceCzk) + "</span>";
      var akce = l.started
        ? '<span class="tt-done">Proběhla</span>'
        : plno
          ? '<a class="tt-book tt-book--wait" href="' + esc(l.bookUrl) + '">Čekací listina</a>'
          : '<a class="tt-book" href="' + esc(l.bookUrl) + '">Rezervovat</a>';
      return '<li class="tt-row tt-c-' + typyLekce(l)[0] + (l.started ? " is-past" : "") + '">' +
        "<time>" + esc(l.time) + "</time>" +
        '<div class="tt-main"><span class="tt-name">' + esc(l.classType) + "</span>" +
        '<span class="tt-who">' + kdo + "</span>" + meta + "</div>" + akce + "</li>";
    }

    function vykresli() {
      var od = zacatekTydne();
      var dny = [0, 1, 2, 3, 4, 5, 6].map(function (i) { return plusDny(od, i); });
      var lekce = data ? data.sessions : [];
      var saly = data ? data.gyms.slice() : [];
      // Pořadí sálů podle data-saly (názvy oddělené čárkou); neuvedené sály až za nimi.
      saly.sort(function (a, b) {
        function poradi(g) { var i = poradiSalu.indexOf(g.name); return i === -1 ? 99 : i; }
        return poradi(a) - poradi(b);
      });

      elWeekLabel.textContent = stav.tyden === 0
        ? "Tento týden · " + kratceDatum(dny[0]) + " – " + kratceDatum(dny[6])
        : kratceDatum(dny[0]) + " – " + kratceDatum(dny[6]);
      elPrev.disabled = stav.tyden === 0;

      elDays.innerHTML = dny.map(function (d, i) {
        var den = ymd(d);
        var n = lekce.filter(function (l) { return l.date === den && vyhovuje(l); }).length;
        var jeDnes = stav.tyden === 0 && i === 0;
        var jmeno = jeDnes ? "Dnes" : stav.tyden === 0 && i === 1 ? "Zítra" : DNY_NAZEV[d.getDay()];
        return '<button type="button" class="tt-day' + (jeDnes ? " is-today" : "") + '" data-den="' + i +
          '" aria-pressed="' + (i === stav.den) + '" aria-label="' + DNY_NAZEV[d.getDay()] + " " + kratceDatum(d) + (data ? ", " + n + " " + lekciText(n) : "") + '">' +
          '<b class="tt-day__short">' + DNY_ZKR[d.getDay()] + "</b>" +
          '<b class="tt-day__full">' + jmeno + "</b>" +
          '<small><span class="tt-day__date">' + kratceDatum(d) + "</span>" +
          (data ? '<span class="tt-day__l"> · ' + n + " " + lekciText(n) + "</span>" : "") + "</small>" +
          "</button>";
      }).join("");

      elSeg.innerHTML = saly.length > 1
        ? [["vse", saly.length === 2 ? "Oba sály" : "Všechny sály"]].concat(saly.map(function (g) { return [g.id, g.name]; }))
            .map(function (o) {
              return '<button type="button" data-sal="' + esc(o[0]) + '" aria-pressed="' + (stav.sal === o[0]) + '">' + esc(o[1]) + "</button>";
            }).join("")
        : "";

      var pritomne = TYPY.filter(function (t) {
        return lekce.some(function (l) { return typyLekce(l).indexOf(t.id) !== -1; });
      });
      elTypes.innerHTML = pritomne.length > 1
        ? ['<button type="button" class="chip" data-typ="vse" aria-pressed="' + (stav.typ === "vse") + '">Všechny lekce</button>']
            .concat(pritomne.map(function (t) {
              return '<button type="button" class="chip tt-chip tt-c-' + t.id + '" data-typ="' + t.id + '" aria-pressed="' + (stav.typ === t.id) + '">' + t.nazev + "</button>";
            })).join("")
        : "";

      if (!data) {
        elCols.className = "tt-cols tt-cols--one";
        elCols.innerHTML = '<p class="tt-empty">Načítám rozvrh…</p>';
        return;
      }

      var vybraneSaly = stav.sal === "vse" ? saly : saly.filter(function (g) { return g.id === stav.sal; });
      // sál, kde se vybraný typ lekce za celý týden vůbec nekoná, nezobrazovat
      if (stav.typ !== "vse") {
        var sTypem = vybraneSaly.filter(function (g) {
          return lekce.some(function (l) { return l.gymId === g.id && typyLekce(l).indexOf(stav.typ) !== -1; });
        });
        if (sTypem.length) vybraneSaly = sTypem;
      }
      var den = dny[stav.den];
      var denText = DNY_NAZEV[den.getDay()] + " " + kratceDatum(den);
      elCols.className = "tt-cols" + (vybraneSaly.length === 1 ? " tt-cols--one" : "");
      elCols.innerHTML = vybraneSaly.map(function (g) {
        var dnesni = lekce.filter(function (l) { return l.date === ymd(den) && l.gymId === g.id && vyhovuje(l); });
        var obsah = dnesni.length
          ? '<ol class="tt-list">' + dnesni.map(radek).join("") + "</ol>"
          : '<p class="tt-empty">' + denText + ": podle vybraného filtru tu žádná lekce není.</p>";
        return '<section class="tt-col"><h3>' + esc(g.name) + "<small>" + denText + "</small></h3>" + obsah + "</section>";
      }).join("");
    }

    box.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || !box.contains(b) || b.disabled) return;
      if (b.hasAttribute("data-tyden")) {
        stav.tyden = Math.max(0, stav.tyden + parseInt(b.getAttribute("data-tyden"), 10));
        stav.den = 0;
        nacti(false);
        return;
      }
      if (b.hasAttribute("data-den")) stav.den = parseInt(b.getAttribute("data-den"), 10);
      else if (b.hasAttribute("data-sal")) stav.sal = b.getAttribute("data-sal");
      else if (b.hasAttribute("data-typ")) stav.typ = b.getAttribute("data-typ");
      else return;
      vykresli();
    });

    // Po návratu na stránku (třeba z rezervace v jiné záložce) obnovit volná místa.
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && Date.now() - nacteno > 60000) nacti(true);
    });

    nacti(false);
  });

  /* --- Instruktorky: filtr podle typu lekce ----------------------------- */
  var filters = $(".filters--js");
  if (filters) {
    var chips = $$(".chip", filters);
    var people = $$("[data-tags]");
    var more = $(".more");
    var count = $(".filters__count", filters);
    var empty = $(".empty-note");

    var plural = function (n) {
      if (n === 1) return "1 lektorka";
      if (n >= 2 && n <= 4) return n + " lektorky";
      return n + " lektorek";
    };

    var apply = function (tag) {
      var shown = 0;
      var shownInMore = 0;
      each(people, function (p) {
        var match = tag === "vse" || p.getAttribute("data-tags").split(" ").indexOf(tag) !== -1;
        p.hidden = !match;
        if (match) {
          shown++;
          if (more && more.contains(p)) shownInMore++;
        }
      });
      each(chips, function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-filter") === tag)); });
      if (more && tag !== "vse") more.open = shownInMore > 0;
      if (count) count.textContent = tag === "vse" ? "" : plural(shown);
      if (empty) empty.hidden = shown !== 0;
    };

    each(chips, function (c) {
      c.addEventListener("click", function () { apply(c.getAttribute("data-filter")); });
    });

    // odkaz typu instruktorky.html?typ=barre rovnou vyfiltruje
    var typ = (location.search.match(/[?&]typ=([a-z]+)/) || [])[1];
    if (typ && $('[data-filter="' + typ + '"]', filters)) apply(typ);
  }

  // Odkaz na lektorku, která je schovaná v rozbalovací části, ji rovnou ukáže
  var openTarget = function () {
    if (!location.hash) return;
    var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    var details = el && el.closest("details");
    if (details && !details.open) {
      details.open = true;
      el.scrollIntoView();
    }
  };
  window.addEventListener("hashchange", openTarget);
  openTarget();

  // Po načtení písem a obrázků se stránka může posunout – kotvu (#…) dorovnáme
  window.addEventListener("load", function () {
    if (!location.hash || window.scrollY === 0) return;
    var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) el.scrollIntoView();
  });

  /* --- Menu: zvýraznění aktuální kategorie ------------------------------ */
  var menuLinks = $$(".menu-nav a[href^='#']");
  if (menuLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    each(menuLinks, function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        each(menuLinks, function (a) { a.classList.remove("is-active"); });
        var a = byId[e.target.id];
        if (a) {
          a.classList.add("is-active");
          a.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    each($$(".menu-section"), function (s) { io.observe(s); });
  }

  /* --- Galerie s náhledy ------------------------------------------------ */
  var galleries = $$(".gallery");
  if (galleries.length && typeof HTMLDialogElement === "function") {
    var dlg = document.createElement("dialog");
    dlg.className = "lightbox";
    dlg.innerHTML =
      '<img class="lightbox__img" alt="">' +
      '<button class="lightbox__close" type="button" aria-label="Zavřít">✕</button>' +
      '<button class="lightbox__prev" type="button" aria-label="Předchozí fotografie">←</button>' +
      '<button class="lightbox__next" type="button" aria-label="Další fotografie">→</button>';
    document.body.appendChild(dlg);
    var img = $(".lightbox__img", dlg);
    var items = [];
    var index = 0;

    var show = function (i) {
      index = (i + items.length) % items.length;
      var a = items[index];
      img.src = a.getAttribute("href");
      img.alt = ($("img", a) || {}).alt || "";
    };

    each(galleries, function (g) {
      var links = $$("a", g);
      each(links, function (a, i) {
        a.addEventListener("click", function (e) {
          e.preventDefault();
          items = links;
          show(i);
          dlg.showModal();
        });
      });
    });
    $(".lightbox__close", dlg).addEventListener("click", function () { dlg.close(); });
    $(".lightbox__prev", dlg).addEventListener("click", function () { show(index - 1); });
    $(".lightbox__next", dlg).addEventListener("click", function () { show(index + 1); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target === img) dlg.close(); });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });
  }

  /* --- Mapa se načte až po kliknutí (bez cookies Googlu předem) --------- */
  each($$("[data-map-src]"), function (btn) {
    btn.addEventListener("click", function () {
      var box = btn.closest(".map-box");
      var frame = document.createElement("iframe");
      frame.src = btn.getAttribute("data-map-src");
      frame.title = "Mapa – KD Letňanka";
      frame.loading = "lazy";
      box.innerHTML = "";
      box.appendChild(frame);
      box.classList.add("is-loaded");
    });
  });
})();
