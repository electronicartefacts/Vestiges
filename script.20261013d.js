(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  initMenu();
  initIntro();
  initReveals();
  initEditorialRhythm();
  initKineticType();
  initExploration();
  initPortalCarousel();
  initEncyclopediaWorkspace();
  initGraph();
  initForgeViewer();
  initJourneySignals();
  initContactForm();

  function emitJourneySignal(name, detail = {}) {
    const signal = Object.freeze({
      name,
      path: window.location.pathname,
      ...detail
    });
    if (new URLSearchParams(window.location.search).get("qa") === "1") {
      if (!Array.isArray(window.VESTIGES_QA_EVENTS)) window.VESTIGES_QA_EVENTS = [];
      window.VESTIGES_QA_EVENTS.push(signal);
    }
    window.dispatchEvent(new CustomEvent("vestiges:journey", { detail: signal }));
  }

  function initJourneySignals() {
    const parameters = new URLSearchParams(window.location.search);
    const source = parameters.get("src") || "";
    const invitation = parameters.get("inv") || "";
    const route = parameters.get("parcours") || "";
    const guided = window.location.pathname === "/participer/" && (
      ["direct", "joey", "recommendation", "scouting", "programme"].includes(source)
      || /^[a-z0-9_-]{1,48}$/i.test(invitation)
      || ["artistes", "artisans", "transmission", "institutions", "organisations", "acheteurs", "autre"].includes(route)
    );
    emitJourneySignal("page_ready", {
      context: guided ? "guided" : "standard"
    });
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (href.startsWith("/participer/")) emitJourneySignal("participation_link", { destination: "participer" });
      if (href.startsWith("mailto:")) emitJourneySignal("direct_email_link", { destination: "email" });
    });
  }

  function initMenu() {
    const button = document.querySelector("[data-menu-toggle]");
    const navigation = document.querySelector("[data-main-nav]");
    if (!button || !navigation) return;
    if (!navigation.hasAttribute("aria-label")) navigation.setAttribute("aria-label", "Navigation principale");

    const close = ({ returnFocus = false } = {}) => {
      button.setAttribute("aria-expanded", "false");
      button.textContent = "Menu";
      navigation.classList.remove("is-open");
      if (returnFocus) button.focus();
    };

    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      button.textContent = open ? "Fermer" : "Menu";
      navigation.classList.toggle("is-open", open);
    });
    navigation.addEventListener("click", () => close());
    document.addEventListener("pointerdown", (event) => {
      if (button.getAttribute("aria-expanded") !== "true") return;
      if (navigation.contains(event.target) || button.contains(event.target)) return;
      close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") close({ returnFocus: true });
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", (event) => {
      if (event.matches) close();
    });
  }

  function initIntro() {
    const intro = document.querySelector("[data-brand-intro]");
    const replayButtons = document.querySelectorAll("[data-replay-intro]");
    if (!intro) return;

    const storageKey = "vestiges:intro:v2";
    const words = Array.from(intro.querySelectorAll("[data-intro-word]"));
    const skip = intro.querySelector("[data-intro-skip]");
    const enter = intro.querySelector("[data-intro-enter]");
    const progress = intro.querySelector("[data-intro-progress]");
    const count = intro.querySelector("[data-intro-count]");
    const background = Array.from(document.body.children).filter((element) => element !== intro && element.tagName !== "SCRIPT");
    let timers = [];
    let lastFocus = null;

    const setBackgroundInert = (value) => {
      background.forEach((element) => { element.inert = value; });
    };

    const focusAfterIntro = (restoreFocus) => {
      const target = restoreFocus && lastFocus instanceof HTMLElement ? lastFocus : document.querySelector("#main");
      if (!(target instanceof HTMLElement)) return;
      const temporaryTabIndex = !target.hasAttribute("tabindex");
      if (temporaryTabIndex) target.tabIndex = -1;
      target.focus({ preventScroll: true });
      if (temporaryTabIndex) target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
    };

    const forceReplay = new URLSearchParams(window.location.search).get("intro") === "1";
    const skipForJourney = ["src", "inv", "parcours"].some((key) => new URLSearchParams(window.location.search).has(key));
    const hasVisited = () => {
      try { return localStorage.getItem(storageKey) === "seen"; } catch (_error) { return false; }
    };

    const remember = () => {
      try { localStorage.setItem(storageKey, "seen"); } catch (_error) { /* Optional enhancement. */ }
    };

    const clearTimers = () => {
      timers.forEach(window.clearTimeout);
      timers = [];
    };

    const finish = ({ restoreFocus = false } = {}) => {
      clearTimers();
      remember();
      intro.classList.add("is-leaving");
      document.body.classList.remove("intro-open");
      window.setTimeout(() => {
        intro.hidden = true;
        intro.classList.remove("is-leaving");
        words.forEach((word) => word.classList.remove("is-active", "is-past"));
        setBackgroundInert(false);
        focusAfterIntro(restoreFocus);
        if (forceReplay && window.history.replaceState) window.history.replaceState({}, "", window.location.pathname + window.location.hash);
      }, reduceMotion.matches ? 10 : 450);
    };

    const play = ({ replay = false } = {}) => {
      clearTimers();
      lastFocus = replay ? document.activeElement : null;
      intro.hidden = false;
      setBackgroundInert(true);
      document.body.classList.add("intro-open");
      words.forEach((word) => word.classList.remove("is-active", "is-past"));
      intro.dataset.progressStep = "0";
      if (count) count.textContent = `01 / ${String(words.length).padStart(2, "0")}`;

      if (reduceMotion.matches) {
        enter?.focus();
        return;
      }

      skip?.focus();
      const beat = 420;
      words.forEach((word, index) => {
        timers.push(window.setTimeout(() => {
          words.forEach((item, itemIndex) => {
            item.classList.toggle("is-active", itemIndex === index);
            item.classList.toggle("is-past", itemIndex < index);
          });
          intro.dataset.progressStep = String(index + 1);
          if (count) count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(words.length).padStart(2, "0")}`;
        }, 160 + index * beat));
      });
      timers.push(window.setTimeout(() => finish({ restoreFocus: replay }), 160 + words.length * beat + 400));
    };

    skip?.addEventListener("click", () => finish());
    enter?.addEventListener("click", () => finish());
    intro.addEventListener("keydown", (event) => {
      if (event.key === "Escape") finish();
      if (event.key !== "Tab") return;
      const focusable = [skip, enter].filter((element) => element instanceof HTMLElement && !element.hidden && element.getClientRects().length);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (focusable.length === 1 || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    });
    replayButtons.forEach((button) => button.addEventListener("click", () => play({ replay: true })));

    if ((hasVisited() || skipForJourney) && !forceReplay) {
      intro.hidden = true;
      setBackgroundInert(false);
    } else {
      play();
    }
  }

  function initReveals() {
    const elements = Array.from(document.querySelectorAll(".reveal"));
    if (!elements.length) return;
    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: .08 });
    elements.forEach((element) => observer.observe(element));
  }

  function initEditorialRhythm() {
    if (typeof Intl.Segmenter !== "function") return;

    const wordSegmenter = new Intl.Segmenter("fr", { granularity: "word" });
    const paragraphs = Array.from(document.querySelectorAll("main p")).filter((paragraph) => {
      if (paragraph.closest("[data-brand-intro], [data-exploration], [data-home-photo-preview]")) return false;
      if (paragraph.matches(".eyebrow, .section-index, .meta, .status-label, .object-truth, .visually-hidden")) return false;
      if (paragraph.children.length || paragraph.textContent.trim().length < 80) return false;
      return Array.from(wordSegmenter.segment(paragraph.textContent.trim())).some((part) => part.isWordLike);
    });
    if (!paragraphs.length) return;

    const records = paragraphs.map((paragraph) => ({ paragraph, source: paragraph.textContent.trim() }));

    let frame = 0;
    const finalLineWordCount = (paragraph) => {
      const range = document.createRange();
      const textNode = paragraph.firstChild;
      if (!(textNode instanceof Text)) return 0;
      const text = textNode.data;
      const words = Array.from(wordSegmenter.segment(text)).filter((part) => part.isWordLike);
      const positions = words.map((word) => {
        range.setStart(textNode, word.index);
        range.setEnd(textNode, word.index + word.segment.length);
        const rect = range.getBoundingClientRect();
        return { word, top: rect.top };
      });
      range.detach();
      if (!positions.length) return 0;
      const lastTop = positions.at(-1).top;
      return positions.filter((item) => Math.abs(item.top - lastTop) < 1).length;
    };

    const bindTailWords = (text, count) => {
      const words = Array.from(wordSegmenter.segment(text)).filter((part) => part.isWordLike);
      const tail = words.slice(-count);
      let composed = text;
      for (let index = tail.length - 1; index > 0; index -= 1) {
        const previous = tail[index - 1];
        const current = tail[index];
        const gap = composed.slice(previous.index + previous.segment.length, current.index);
        if (/^\s+$/u.test(gap)) composed = `${composed.slice(0, previous.index + previous.segment.length)}\u00a0${composed.slice(current.index)}`;
      }
      return composed;
    };

    const compose = () => {
      frame = 0;
      records.forEach(({ paragraph, source }) => {
        paragraph.textContent = source;
        const tailLength = finalLineWordCount(paragraph) <= 2 ? 3 : 2;
        paragraph.textContent = bindTailWords(source, tailLength);
      });
    };

    const schedule = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(compose);
    };
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
    records.forEach(({ paragraph }) => observer?.observe(paragraph));
    window.addEventListener("resize", schedule, { passive: true });
    document.fonts?.ready.then(schedule).catch(() => {});
    schedule();
  }

  function initKineticType() {
    if (reduceMotion.matches) return;

    const headings = Array.from(document.querySelectorAll("main h1, main h2, main h3"))
      .filter((heading) => !heading.closest("[data-exploration]") && !heading.querySelector("input, button, a") && heading.textContent.trim());
    if (!headings.length) return;

    const segment = (value) => {
      if (typeof Intl.Segmenter === "function") {
        return Array.from(new Intl.Segmenter("fr", { granularity: "grapheme" }).segment(value), (item) => item.segment);
      }
      return Array.from(value);
    };
    const states = [];
    const activeStates = new Set();
    let frame = 0;
    let lastRenderTime = 0;

    const requestFrame = (state) => {
      if (reduceMotion.matches || document.hidden) return;
      activeStates.add(state);
      state.element.classList.add("is-kinetic-active");
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    const render = (time) => {
      frame = 0;
      if (reduceMotion.matches || document.hidden) return;
      const frameDelta = lastRenderTime ? Math.min(32, Math.max(0, time - lastRenderTime)) : 16.667;
      lastRenderTime = time;
      const weightEase = 1 - Math.exp(-frameDelta / 220);
      const pointerEase = 1 - Math.exp(-frameDelta / 110);
      activeStates.forEach((state) => {
        const length = state.glyphs.length;
        let center = -999;
        let amplitude = 0;
        let radius = Math.max(5, Math.min(9, length * .14));
        let keepAlive = false;

        if (state.tapStarted) {
          const progress = Math.min(1, (time - state.tapStarted) / 920);
          center = state.tapIndex;
          amplitude = Math.sin(progress * Math.PI) * 32;
          radius = 5 + progress * 3;
          keepAlive = progress < 1;
          if (!keepAlive) state.tapStarted = 0;
        } else if (state.hovered) {
          state.pointerIndex += (state.pointerTargetIndex - state.pointerIndex) * pointerEase;
          state.pointerStrength += (state.pointerTargetStrength - state.pointerStrength) * pointerEase;
          center = state.pointerIndex;
          amplitude = 30 * state.pointerStrength;
        } else if (state.revealStarted) {
          const progress = Math.min(1, (time - state.revealStarted) / 1250);
          center = -4 + progress * (length + 8);
          amplitude = Math.sin(progress * Math.PI) * 24;
          keepAlive = progress < 1;
          if (!keepAlive) state.revealStarted = 0;
        }

        let unsettled = false;
        state.glyphs.forEach((glyph, index) => {
          const distance = (index - center) / radius;
          const influence = amplitude * Math.exp(-.5 * distance * distance);
          const target = Math.min(620, state.base + influence);
          const current = state.weights[index] + (target - state.weights[index]) * weightEase;
          state.weights[index] = current;
          const level = String(Math.max(250, Math.min(620, Math.round(current / 2) * 2)));
          if (glyph.dataset.kineticLevel !== level) glyph.dataset.kineticLevel = level;
          if (Math.abs(current - target) > .5) unsettled = true;
        });

        if (!keepAlive && !unsettled) {
          if (!state.hovered) {
            state.glyphs.forEach((glyph, index) => {
              state.weights[index] = state.base;
              const level = String(Math.max(250, Math.min(620, Math.round(state.base / 2) * 2)));
              if (glyph.dataset.kineticLevel !== level) glyph.dataset.kineticLevel = level;
            });
          }
          activeStates.delete(state);
          state.element.classList.remove("is-kinetic-active");
        }
      });
      if (activeStates.size) frame = window.requestAnimationFrame(render);
    };

    headings.forEach((heading) => {
      const label = heading.textContent.replace(/\s+/g, " ").trim();
      const computedWeight = Number.parseFloat(window.getComputedStyle(heading).fontWeight);
      const base = Number.isFinite(computedWeight) ? Math.max(250, Math.min(620, computedWeight)) : 360;
      const fragment = document.createDocumentFragment();
      const glyphs = [];

      label.split(/(\s+)/).filter(Boolean).forEach((token) => {
        if (/^\s+$/.test(token)) {
          const space = document.createElement("span");
          space.className = "kinetic-space";
          space.setAttribute("aria-hidden", "true");
          space.textContent = " ";
          fragment.append(space);
          return;
        }
        const word = document.createElement("span");
        word.className = "kinetic-word";
        word.setAttribute("aria-hidden", "true");
        segment(token).forEach((character) => {
          const glyph = document.createElement("span");
          glyph.className = "kinetic-glyph";
          glyph.textContent = character;
          glyph.dataset.kineticLevel = String(Math.max(250, Math.min(620, Math.round(base / 2) * 2)));
          word.append(glyph);
          glyphs.push(glyph);
        });
        fragment.append(word);
      });

      heading.replaceChildren(fragment);
      heading.classList.add("kinetic-type");
      heading.setAttribute("aria-label", label);
      const state = {
        element: heading,
        glyphs,
        weights: glyphs.map(() => base),
        base,
        hovered: false,
        pointerIndex: 0,
        pointerTargetIndex: 0,
        pointerStrength: 1,
        pointerTargetStrength: 1,
        tapIndex: 0,
        tapStarted: 0,
        revealStarted: 0
      };
      states.push(state);

      const updatePointerTarget = (event, initialize = false) => {
        const bounds = heading.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / Math.max(1, bounds.width)));
        const verticalDistance = Math.abs(event.clientY - (bounds.top + bounds.height / 2));
        const pointerIndex = ratio * Math.max(0, glyphs.length - 1);
        const pointerStrength = Math.max(.3, 1 - verticalDistance / Math.max(90, bounds.height));
        state.pointerTargetIndex = pointerIndex;
        state.pointerTargetStrength = pointerStrength;
        if (initialize) {
          state.pointerIndex = pointerIndex;
          state.pointerStrength = pointerStrength;
        }
      };

      heading.addEventListener("pointerenter", (event) => {
        updatePointerTarget(event, true);
        state.hovered = true;
        requestFrame(state);
      });
      heading.addEventListener("pointermove", (event) => {
        updatePointerTarget(event);
        state.hovered = true;
        requestFrame(state);
      });
      heading.addEventListener("pointerleave", () => {
        state.hovered = false;
        requestFrame(state);
      });
      heading.addEventListener("pointerdown", (event) => {
        const bounds = heading.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / Math.max(1, bounds.width)));
        state.tapIndex = ratio * Math.max(0, glyphs.length - 1);
        state.tapStarted = window.performance.now();
        requestFrame(state);
      });
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const state = states.find((item) => item.element === entry.target);
          if (state) {
            state.revealStarted = window.performance.now();
            requestFrame(state);
          }
          observer.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -12%", threshold: .25 });
      states.forEach((state) => observer.observe(state.element));
    }

    const settleType = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      lastRenderTime = 0;
      activeStates.clear();
      states.forEach((state) => {
        state.hovered = false;
        state.tapStarted = 0;
        state.revealStarted = 0;
        state.element.classList.remove("is-kinetic-active");
        state.glyphs.forEach((glyph, index) => {
          state.weights[index] = state.base;
          glyph.dataset.kineticLevel = String(Math.max(250, Math.min(620, Math.round(state.base / 2) * 2)));
        });
      });
    };
    reduceMotion.addEventListener("change", () => {
      if (reduceMotion.matches) settleType();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) settleType();
    });

  }

  function initPortalCarousel() {
    const track = document.querySelector("[data-portal-track]");
    const controls = document.querySelector("[data-portal-controls]");
    if (!track || !controls) return;
    const cards = [...track.querySelectorAll(".portal-card")];
    const dots = [...controls.querySelectorAll("[data-portal-index]")];
    const position = controls.querySelector("[data-portal-position]");
    const previous = controls.querySelector('[data-portal-step="-1"]');
    const next = controls.querySelector('[data-portal-step="1"]');
    const mobile = window.matchMedia("(max-width: 680px)");
    let index = 0;
    let frame = 0;
    function update() {
      frame = 0;
      const bounds = track.getBoundingClientRect();
      index = cards.reduce((best, card, candidate) => Math.abs(card.getBoundingClientRect().left - bounds.left) < Math.abs(cards[best].getBoundingClientRect().left - bounds.left) ? candidate : best, 0);
      dots.forEach((dot, candidate) => {
        if (candidate === index) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      position.textContent = `${String(index + 1).padStart(2, "0")} / 04`;
      previous.disabled = index === 0;
      next.disabled = index === cards.length - 1;
    }
    function show(candidate) {
      const card = cards[Math.max(0, Math.min(cards.length - 1, candidate))];
      const left = track.scrollLeft + card.getBoundingClientRect().left - track.getBoundingClientRect().left;
      track.scrollTo({ left, behavior: reduceMotion.matches ? "instant" : "smooth" });
    }
    dots.forEach((dot, candidate) => dot.addEventListener("click", () => show(candidate)));
    controls.querySelectorAll("[data-portal-step]").forEach(button => button.addEventListener("click", () => show(index + Number(button.dataset.portalStep))));
    track.addEventListener("scroll", () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
    // Moving keyboard focus to a card reveals it without moving the page vertically.
    track.addEventListener("focusin", event => {
      const candidate = cards.indexOf(event.target.closest(".portal-card"));
      if (mobile.matches && candidate >= 0) show(candidate);
    });
    track.addEventListener("keydown", event => {
      if (!mobile.matches || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const candidate = Math.max(0, Math.min(cards.length - 1, index + (event.key === "ArrowRight" ? 1 : -1)));
      cards[candidate].focus({ preventScroll: true });
      show(candidate);
    });
    function sync() {
      controls.hidden = !mobile.matches;
      if (!mobile.matches) track.scrollTo({ left: 0, behavior: "instant" });
      update();
    }
    mobile.addEventListener("change", sync);
    window.addEventListener("resize", sync, { passive: true });
    sync();
  }

  function initExploration() {
    const root = document.querySelector("[data-exploration]");
    if (root?.closest("[data-premium-encyclopedia]")) return;
    const items = window.VESTIGES_EXPLORATION_ITEMS;
    if (!root || !Array.isArray(items) || !items.length) return;

    const field = root.querySelector("[data-exploration-field]");
    const list = root.querySelector("[data-exploration-items]");
    const relationLayer = root.querySelector("[data-exploration-relations]");
    const type = root.querySelector("[data-exploration-type]");
    const name = root.querySelector("[data-exploration-name]");
    const description = root.querySelector("[data-exploration-description]");
    const relation = root.querySelector("[data-exploration-relation]");
    if (!field || !list) return;

    const byId = new Map(items.map((item) => [item.id, item]));
    const buttons = new Map();
    let selectedId = items[0].id;

    if (!root.classList.contains("home-graph-section")) {
      const connectionDegree = (item) => item.relatedIds.length + items.filter((candidate) => candidate.relatedIds.includes(item.id)).length;

      items.forEach((item, index) => {
        const degree = connectionDegree(item);
        const button = document.createElement("button");
        button.type = "button";
        button.className = `exploration-item exploration-item--${index + 1}`;
        button.dataset.explorationId = item.id;
        button.dataset.connectionDegree = String(degree);
        button.setAttribute("aria-pressed", String(index === 0));
        button.setAttribute("aria-description", `${degree} éléments associés. Appuyez sur Entrée pour les afficher.`);
        button.innerHTML = `<span>${item.type}</span><strong>${item.title}</strong>`;
        button.addEventListener("pointerenter", () => select(item.id, false));
        button.addEventListener("focus", () => select(item.id, false));
        button.addEventListener("click", () => select(item.id, true));
        buttons.set(item.id, button);
        list.append(button);
      });

      const drawRelations = (item) => {
        if (!relationLayer) return;
        const source = buttons.get(item.id);
        if (!source) return;
        const bounds = field.getBoundingClientRect();
        const origin = source.getBoundingClientRect();
        const lines = item.relatedIds.map((relatedId) => {
          const target = buttons.get(relatedId);
          if (!target) return "";
          const end = target.getBoundingClientRect();
          const x1 = origin.left - bounds.left + origin.width / 2;
          const y1 = origin.top - bounds.top + origin.height / 2;
          const x2 = end.left - bounds.left + end.width / 2;
          const y2 = end.top - bounds.top + end.height / 2;
          return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>`;
        }).join("");
        relationLayer.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
        relationLayer.innerHTML = lines;
      };

      const select = (id, pinned) => {
        const item = byId.get(id);
        if (!item) return;
        if (pinned) selectedId = id;
        type.textContent = `${item.type} · exemple`;
        name.textContent = item.title;
        description.textContent = item.shortDescription;
        relation.textContent = `${item.relatedIds.length} élément${item.relatedIds.length === 1 ? "" : "s"} associé${item.relatedIds.length === 1 ? "" : "s"} dans cet exemple`;
        root.dataset.selected = item.id;
        window.dispatchEvent(new CustomEvent("vestiges:subject-change", { detail: { id: item.id } }));
        buttons.forEach((button, buttonId) => {
          const connected = buttonId === item.id || item.relatedIds.includes(buttonId);
          button.classList.toggle("is-connected", connected);
          button.setAttribute("aria-pressed", String(buttonId === selectedId));
        });
        drawRelations(item);
      };

      const fitNodeLabels = () => {
        buttons.forEach((button) => {
          const label = button.querySelector("strong");
          if (!label) return;
          button.classList.remove("is-compact", "is-tight", "is-micro");
          const safeWidth = button.clientWidth * .7;
          const exceedsAvailableWidth = () => label.getBoundingClientRect().width > safeWidth;
          if (exceedsAvailableWidth()) button.classList.add("is-compact");
          if (exceedsAvailableWidth()) button.classList.add("is-tight");
          if (exceedsAvailableWidth()) button.classList.add("is-micro");
        });
      };

      list.addEventListener("keydown", (event) => {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) return;
        const current = items.findIndex((item) => item.id === document.activeElement?.dataset.explorationId);
        if (current < 0) return;
        event.preventDefault();
        const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
        const next = (current + direction + items.length) % items.length;
        buttons.get(items[next].id)?.focus();
      });
      window.addEventListener("resize", () => drawRelations(byId.get(selectedId)), { passive: true });
      if (typeof ResizeObserver === "function") new ResizeObserver(fitNodeLabels).observe(field);
      select(selectedId, true);
      fitNodeLabels();
      window.addEventListener("vestiges:select-subject", (event) => select(event.detail?.id, true));
      return;
    }

    const relatedList = root.querySelector("[data-exploration-related-list]");
    const textList = root.querySelector("[data-exploration-text-list]");
    const edges = [];
    const edgeKeys = new Set();
    const alternativeButtons = new Map();
    let focusedId = selectedId;
    let hoverResetTimer = 0;
    let drawQueued = false;
    let relationPaths = [];
    const selectionLabel = root.querySelector("[data-home-graph-selection]");
    let detailId = null;

    const visibleRelatedIds = (item) => item.relatedIds.filter((id) => byId.has(id));
    const relationSummary = (item) => {
      const visible = visibleRelatedIds(item).length;
      const outside = item.relatedIds.length - visible;
      const plural = visible !== 1;
      const label = `${visible} élément${plural ? "s" : ""} associé${plural ? "s" : ""} dans cet exemple`;
      return outside ? `${label} · d’autres liens ne sont pas affichés` : label;
    };

    items.forEach((item) => {
      for (const relatedId of item.relatedIds) {
        if (!byId.has(relatedId)) continue;
        const key = [item.id, relatedId].sort().join("|");
        if (edgeKeys.has(key)) continue;
        edgeKeys.add(key);
        edges.push({ a: item.id, b: relatedId });
      }
    });

    const makeButton = (item, className, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = className;
      button.dataset.explorationId = item.id;
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-description", `${relationSummary(item)}. Appuyez sur Entrée pour garder cet élément sélectionné.`);
      if (typeof index === "number") button.classList.add(`exploration-item--${index + 1}`);

      const itemType = document.createElement("span");
      itemType.textContent = item.type;
      const title = document.createElement("strong");
      title.textContent = item.title;
      button.append(itemType, title);
      button.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "mouse") return;
        window.clearTimeout(hoverResetTimer);
        hoverResetTimer = 0;
        preview(item.id);
      });
      button.addEventListener("pointerleave", (event) => {
        if (event.pointerType !== "mouse") return;
        if (button.matches(":focus") || (event.relatedTarget && field.contains(event.relatedTarget))) return;
        scheduleHoverReset();
      });
      button.addEventListener("focus", () => {
        if (button.matches(":focus-visible")) preview(item.id);
      });
      button.addEventListener("click", () => select(item.id));
      return button;
    };

    items.forEach((item, index) => {
      const button = makeButton(item, "exploration-item home-atlas-node", index);
      buttons.set(item.id, button);
      list.append(button);

      if (textList) {
        const row = document.createElement("li");
        const alternativeButton = makeButton(item, "home-graph-text-entry");
        alternativeButton.replaceChildren(document.createTextNode(item.title));
        const count = document.createElement("small");
        count.textContent = relationSummary(item);
        alternativeButton.append(count);
        alternativeButtons.set(item.id, alternativeButton);
        row.append(alternativeButton);
        textList.append(row);
      }
    });

    function drawRelations() {
      drawQueued = false;
      if (!relationLayer) return;
      const bounds = field.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      relationLayer.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
      if (relationPaths.length !== edges.length) {
        relationPaths = edges.map((edge) => {
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.dataset.from = edge.a;
          path.dataset.to = edge.b;
          relationLayer.append(path);
          return path;
        });
      }

      // Read each node once on layout changes; selection only changes path classes.
      const positions = new Map([...buttons].map(([id, button]) => [id, button.getBoundingClientRect()]));
      edges.forEach((edge, index) => {
        const path = relationPaths[index];
        const origin = positions.get(edge.a);
        const target = positions.get(edge.b);
        if (!origin || !target) return;
        const x1 = origin.left - bounds.left + origin.width / 2;
        const y1 = origin.top - bounds.top + origin.height / 2;
        const x2 = target.left - bounds.left + target.width / 2;
        const y2 = target.top - bounds.top + target.height / 2;
        path.setAttribute("d", `M ${x1} ${y1} L ${x2} ${y2}`);
        path.classList.toggle("is-related", edge.a === focusedId || edge.b === focusedId);
      });
    }

    function queueDraw() {
      if (drawQueued) return;
      drawQueued = true;
      window.requestAnimationFrame(drawRelations);
    }

    function updateDetails(item) {
      if (selectionLabel) selectionLabel.textContent = `${item.title} · ${visibleRelatedIds(item).length} liens`;
      if (detailId === item.id) return;
      if (type) type.textContent = `Exemple · ${item.type}`;
      if (name) name.textContent = item.title;
      if (description) description.textContent = item.shortDescription;
      if (relation) relation.textContent = relationSummary(item);
      if (!relatedList || relatedList.contains(document.activeElement)) return;

      const relatedItems = visibleRelatedIds(item).map((relatedId) => {
        const related = byId.get(relatedId);
        const listItem = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "home-graph-related__button";
        button.dataset.explorationId = related.id;
        button.setAttribute("aria-description", "Afficher cet élément sur la carte.");
        const title = document.createElement("span");
        title.textContent = related.title;
        const kind = document.createElement("small");
        kind.textContent = related.type;
        button.append(title, kind);
        button.addEventListener("click", () => {
          buttons.get(related.id)?.focus({ preventScroll: true });
          select(related.id);
        });
        listItem.append(button);
        return listItem;
      });
      relatedList.replaceChildren(...relatedItems);
      detailId = item.id;
    }

    function applyFocus(id) {
      focusedId = id;
      const connectedIds = new Set([id]);
      edges.forEach((edge) => {
        if (edge.a === id) connectedIds.add(edge.b);
        if (edge.b === id) connectedIds.add(edge.a);
      });
      buttons.forEach((button, buttonId) => {
        const connected = connectedIds.has(buttonId);
        button.classList.toggle("is-related", connected && buttonId !== id);
        button.classList.toggle("is-selected", buttonId === selectedId);
        button.setAttribute("aria-pressed", String(buttonId === selectedId));
      });
      alternativeButtons.forEach((button, buttonId) => button.setAttribute("aria-pressed", String(buttonId === selectedId)));
      root.dataset.selected = id;
      relationPaths.forEach((path) => path.classList.toggle("is-related", path.dataset.from === id || path.dataset.to === id));
    }

    function preview(id) {
      const item = byId.get(id);
      if (!item) return;
      applyFocus(id);
      updateDetails(item);
      window.dispatchEvent(new CustomEvent("vestiges:subject-change", { detail: { id: item.id } }));
    }

    function scheduleHoverReset() {
      if (root.contains(document.activeElement) && document.activeElement.matches("button, summary")) return;
      window.clearTimeout(hoverResetTimer);
      hoverResetTimer = window.setTimeout(() => {
        hoverResetTimer = 0;
        if (root.querySelector("button:hover, button:focus, summary:focus")) return;
        preview(selectedId);
      }, 180);
    }

    function select(id) {
      if (!byId.has(id)) return;
      window.clearTimeout(hoverResetTimer);
      hoverResetTimer = 0;
      selectedId = id;
      preview(id);
    }

    list.addEventListener("keydown", (event) => {
      if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) return;
      const current = items.findIndex((item) => item.id === document.activeElement?.dataset.explorationId);
      if (current < 0) return;
      event.preventDefault();
      const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
      const next = (current + direction + items.length) % items.length;
      buttons.get(items[next].id)?.focus();
    });
    root.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") scheduleHoverReset();
    });
    root.addEventListener("focusout", (event) => {
      if (!root.contains(event.relatedTarget)) scheduleHoverReset();
    });
    window.addEventListener("resize", queueDraw, { passive: true });
    if (typeof ResizeObserver === "function") new ResizeObserver(queueDraw).observe(field);
    select(selectedId);
    queueDraw();
    document.fonts?.ready.then(queueDraw);
    window.addEventListener("vestiges:select-subject", (event) => select(event.detail?.id));
  }

  function initEncyclopediaWorkspace() {
    const workspace = document.querySelector("[data-encyclopedia-workspace]");
    const items = window.VESTIGES_EXPLORATION_ITEMS;
    if (!workspace || workspace.hasAttribute("data-premium-encyclopedia") || !Array.isArray(items) || !items.length) return;

    const query = workspace.querySelector("[data-knowledge-query]");
    const suggestions = workspace.querySelector("#knowledge-suggestions");
    const activeSubject = workspace.querySelector("[data-active-subject]");
    const buttons = [...workspace.querySelectorAll("[data-view-button]")];
    const panels = [...workspace.querySelectorAll("[data-view-panel]")];
    const mosaic = workspace.querySelector("[data-mosaic-board]");
    let activeId = items[0].id;
    let specimenViewerModule;

    const byId = new Map(items.map((item) => [item.id, item]));
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.title;
      option.label = `${item.type} · exemple`;
      suggestions?.append(option);
    });

    const showView = (name) => {
      buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.viewButton === name)));
      panels.forEach((panel) => { panel.hidden = panel.dataset.viewPanel !== name; });
      workspace.dataset.activeView = name;
      if (name === "graph") requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
      if (name === "mosaic") {
        const stage = mosaic?.querySelector("[data-specimen-3d]");
        const loadButton = stage?.querySelector("[data-load-specimen]");
        if (stage && loadButton && loadButton.dataset.viewerButtonBound !== "true") {
          loadButton.dataset.viewerButtonBound = "true";
          loadButton.addEventListener("click", async () => {
            if (stage.dataset.mounted === "true") return;
            stage.dataset.mounted = "true";
            loadButton.disabled = true;
            loadButton.textContent = "Préparation du modèle 3D…";
            const message = stage.querySelector(".specimen-3d-loading");
            try {
              specimenViewerModule ||= import("/mosaic-specimen-viewer.20261013a.js");
              const { mountSpecimenVolume } = await specimenViewerModule;
              mountSpecimenVolume(stage);
            } catch (_error) {
              stage.dataset.mounted = "false";
              loadButton.disabled = false;
              loadButton.textContent = "Réessayer l’affichage 3D";
              if (message) message.textContent = "Vue interactive indisponible ; le dossier reste lisible.";
              stage.classList.add("is-viewer-fallback");
            }
          });
        }
      }
    };
    buttons.forEach((button) => button.addEventListener("click", () => showView(button.dataset.viewButton)));
    const activateViewFromHash = () => {
      if (window.location.hash === "#graphe") {
        showView("graph");
        workspace.querySelector("#graphe")?.scrollIntoView({ block: "start" });
      }
    };
    window.addEventListener("hashchange", activateViewFromHash);

    const updateSubject = (id) => {
      const item = byId.get(id);
      if (!item) return;
      activeId = id;
      if (activeSubject) activeSubject.textContent = item.title;
      if (query && document.activeElement !== query) query.value = item.title;
      workspace.querySelectorAll("[data-subject-title]").forEach((element) => { element.textContent = item.title; });
      workspace.querySelectorAll("[data-subject-type]").forEach((element) => { element.textContent = `${item.type} · exemple`; });
      workspace.querySelectorAll("[data-subject-description], [data-widget-active-description]").forEach((element) => { element.textContent = item.shortDescription; });
      workspace.querySelectorAll("[data-widget-active-title]").forEach((element) => { element.textContent = item.title; });
      workspace.querySelectorAll("[data-context-subject]").forEach((element) => { element.textContent = item.title; });
      const mosaicRelation = item.relatedIds.map((relatedId) => byId.get(relatedId)).find(Boolean);
      workspace.querySelectorAll("[data-widget-related-title]").forEach((element) => { element.textContent = mosaicRelation?.title || "Autre information"; });
      workspace.querySelectorAll("[data-widget-related-description]").forEach((element) => { element.textContent = mosaicRelation?.shortDescription || "D’autres informations seront ajoutées plus tard."; });
      workspace.querySelectorAll("[data-mosaic-related]").forEach((element) => {
        if (!mosaicRelation) return;
        element.dataset.subjectLink = mosaicRelation.id;
        element.textContent = `Voir aussi : ${mosaicRelation.title} ↗`;
      });

      const relationContainer = workspace.querySelector("[data-related-links]");
      if (relationContainer) {
        relationContainer.replaceChildren();
        item.relatedIds.map((relatedId) => byId.get(relatedId)).filter(Boolean).forEach((related) => {
          const link = document.createElement("button");
          link.type = "button";
          link.dataset.subjectLink = related.id;
          link.textContent = related.title;
          const kind = document.createElement("span");
          kind.textContent = `${related.type} ↗`;
          link.append(kind);
          relationContainer.append(link);
        });
      }
    };

    workspace.addEventListener("click", (event) => {
      const subjectLink = event.target.closest("[data-subject-link]");
      if (subjectLink) {
        const id = subjectLink.dataset.subjectLink;
        if (byId.has(id)) window.dispatchEvent(new CustomEvent("vestiges:select-subject", { detail: { id } }));
        return;
      }
      const proxy = event.target.closest("[data-view-button-proxy]");
      if (proxy) showView(proxy.dataset.viewButtonProxy);
    });

    const mosaicStatus = workspace.querySelector("[data-mosaic-status]");
    const announceMosaic = (message) => { if (mosaicStatus) mosaicStatus.textContent = message; };
    const gridTrackCount = () => window.matchMedia("(max-width: 680px)").matches ? 24 : 48;
    let knownGridTrackCount = 48;

    const mosaicWidgets = () => [...(mosaic?.querySelectorAll("[data-widget]") || [])];
    const renderMosaicRows = () => {
      if (!mosaic) return;
      const widgets = mosaicWidgets();
      const tracks = gridTrackCount();
      mosaic.replaceChildren();
      for (let index = 0; index < widgets.length;) {
        const row = document.createElement("div");
        row.className = "mosaic-row";
        row.dataset.mosaicRow = "";
        const firstWidth = Math.max(1, Number(widgets[index].dataset.cols) || tracks / 2);
        const pair = firstWidth >= tracks ? [widgets[index]] : widgets.slice(index, index + 2);
        const desired = pair.map((widget) => Math.max(1, Number(widget.dataset.cols) || tracks / 2));
        const total = desired.reduce((sum, cols) => sum + cols, 0);
        const normalized = pair.length === 1 ? [tracks] : [
          Math.max(1, Math.round(desired[0] * tracks / total)),
          tracks - Math.max(1, Math.round(desired[0] * tracks / total))
        ];
        const rowHeight = Math.max(8, ...pair.map((widget) => Number(widget.dataset.rows) || 8));
        pair.forEach((widget, pairIndex) => {
          widget.dataset.cols = String(normalized[pairIndex]);
          widget.dataset.rows = String(rowHeight);
          row.append(widget);
        });
        mosaic.append(row);
        index += pair.length;
      }
    };
    const reorderWidget = (widget, target) => {
      if (!mosaic || !target || widget === target) return;
      const widgets = mosaicWidgets();
      const from = widgets.indexOf(widget);
      const to = widgets.indexOf(target);
      if (from < 0 || to < 0) return;
      [widgets[from], widgets[to]] = [widgets[to], widgets[from]];
      widgets.forEach((item) => mosaic.append(item));
      renderMosaicRows();
    };

    const dropTargetAt = (x, y, movingWidget) => {
      const candidates = mosaicWidgets().filter((widget) => widget !== movingWidget);
      if (!candidates.length) return null;
      const positioned = candidates.map((widget) => {
        const rect = widget.getBoundingClientRect();
        const dx = Math.max(rect.left - x, 0, x - rect.right);
        const dy = Math.max(rect.top - y, 0, y - rect.bottom);
        return { widget, rect, distance: Math.hypot(dx, dy) };
      });
      const hovered = positioned.find(({ rect }) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
      if (hovered) return hovered;
      const nearest = positioned.sort((a, b) => a.distance - b.distance)[0];
      return nearest.distance <= 32 ? nearest : null;
    };

    const installMosaicInteractions = () => {
      if (!mosaic) return;
      const resizeEdges = ["n", "e", "s", "w", "ne", "nw", "se", "sw"];
      mosaic.querySelectorAll("[data-widget]").forEach((widget, index) => {
        widget.tabIndex = 0;
        widget.setAttribute("aria-roledescription", "bloc déplaçable");
        widget.setAttribute("aria-label", `${widget.querySelector(".widget-top span")?.textContent || `Fenêtre ${index + 1}`} — maintenir une zone non interactive pour déplacer`);
        resizeEdges.forEach((edge) => {
          const handle = document.createElement("span");
          handle.className = `widget-resize-handle widget-resize-handle--${edge}`;
          handle.dataset.resizeHandle = edge;
          handle.setAttribute("aria-hidden", "true");
          widget.append(handle);
        });

        let gesture = null;
        let holdTimer = 0;

        const finishGesture = (cancelled = false) => {
          if (!gesture) return;
          const pointerId = gesture.pointerId;
          window.clearTimeout(holdTimer);
          if (gesture.kind === "move" && !cancelled && gesture.didMove) {
            announceMosaic(`Fenêtre déposée : ${widget.querySelector(".widget-top span")?.textContent || "élément"}.`);
          }
          widget.classList.remove("is-resizing", "is-dragging", "is-selected", "is-pressing");
          delete widget.dataset.dragX;
          delete widget.dataset.dragY;
          if (widget.dataset.keyboardMoving !== "true") widget.removeAttribute("aria-description");
          widget.querySelectorAll(".widget-resize-handle.is-active").forEach((handle) => handle.classList.remove("is-active"));
          widget.removeAttribute("data-resize-active");
          widget.removeAttribute("data-resize-edge");
          if (widget.dataset.keyboardMoving !== "true") widget.removeAttribute("aria-description");
          gesture = null;
          try { if (widget.hasPointerCapture(pointerId)) widget.releasePointerCapture(pointerId); } catch (_error) { /* Le pointeur peut déjà être relâché. */ }
        };

        widget.addEventListener("pointerleave", () => {
          if (!gesture) {
            widget.removeAttribute("data-resize-edge");
          }
        });
        widget.addEventListener("pointermove", (event) => {
          if (gesture?.pointerId === event.pointerId) {
            gesture.lastX = event.clientX;
            gesture.lastY = event.clientY;
            if (gesture.kind === "pending-move" && Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > 12) {
              finishGesture(true);
              return;
            }
            if (gesture.kind === "resize") {
              const tracks = gridTrackCount();
              const boardStyle = getComputedStyle(mosaic);
              const firstColumn = parseFloat(boardStyle.gridTemplateColumns.split(" ")[0]) || mosaic.clientWidth / tracks;
              const columnPitch = firstColumn + parseFloat(boardStyle.columnGap || "0");
              const rowPitch = (parseFloat(boardStyle.gridAutoRows) || 8) + parseFloat(boardStyle.rowGap || "0");
              const edge = gesture.edge;
              const colsDelta = Math.round((event.clientX - gesture.startX) / columnPitch) * ((edge.includes("e") ? 1 : 0) - (edge.includes("w") ? 1 : 0));
              const rowsDelta = Math.round((event.clientY - gesture.startY) / rowPitch) * ((edge.includes("s") ? 1 : 0) - (edge.includes("n") ? 1 : 0));
              const minCols = tracks === 24 ? 7 : 5;
              const row = widget.closest("[data-mosaic-row]");
              const neighbor = [...(row?.querySelectorAll("[data-widget]") || [])].find((item) => item !== widget);
              const requestedCols = Math.max(minCols, Math.min(tracks - (neighbor ? minCols : 0), gesture.startCols + colsDelta));
              widget.dataset.cols = String(requestedCols);
              if (neighbor) neighbor.dataset.cols = String(tracks - requestedCols);
              const rowHeight = String(Math.max(8, Math.min(60, gesture.startRows + rowsDelta)));
              row?.querySelectorAll("[data-widget]").forEach((item) => { item.dataset.rows = rowHeight; });
            } else if (gesture.kind === "move") {
              const deltaX = event.clientX - gesture.startX;
              const deltaY = event.clientY - gesture.startY;
              widget.dataset.dragX = String(deltaX);
              widget.dataset.dragY = String(deltaY);
              const target = dropTargetAt(event.clientX, event.clientY, widget);
              if (target && Math.hypot(deltaX, deltaY) > 16) {
                gesture.didMove = true;
                if (gesture.lastTarget !== target.widget) {
                  reorderWidget(widget, target.widget);
                  gesture.lastTarget = target.widget;
                  gesture.startX = event.clientX;
                  gesture.startY = event.clientY;
                  widget.dataset.dragX = "0";
                  widget.dataset.dragY = "0";
                }
              }
            }
            return;
          }
          const handle = event.target.closest("[data-resize-handle]");
          if (handle) widget.dataset.resizeEdge = handle.dataset.resizeHandle;
          else widget.removeAttribute("data-resize-edge");
        });
        widget.addEventListener("pointerdown", (event) => {
          const resizeHandle = event.target.closest("[data-resize-handle]");
          if (resizeHandle) {
            event.preventDefault();
            const startCols = Number(widget.dataset.cols);
            const startRows = Number(widget.dataset.rows);
            gesture = { kind: "resize", edge: resizeHandle.dataset.resizeHandle, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY, startCols, startRows };
            widget.dataset.resizeActive = gesture.edge.split("").join(" ");
            resizeHandle.classList.add("is-active");
            widget.classList.add("is-resizing");
            widget.setPointerCapture(event.pointerId);
            return;
          }
          if (event.target.closest('a, button, input, select, textarea, summary, canvas, [contenteditable="true"], [data-mosaic-no-drag], [data-resize-handle]')) return;
          event.preventDefault();
          gesture = { kind: "pending-move", pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY };
          widget.classList.add("is-pressing");
          widget.setPointerCapture(event.pointerId);
          holdTimer = window.setTimeout(() => {
            if (gesture?.kind !== "pending-move") return;
            gesture.kind = "move";
            gesture.didMove = false;
            widget.classList.remove("is-pressing");
            widget.classList.add("is-selected", "is-dragging");
            widget.setAttribute("aria-description", "Sélectionnée pour être déplacée. Glissez-la sur une autre fenêtre ou appuyez sur Échap.");
            announceMosaic("Fenêtre sélectionnée. Glissez-la sur une autre pour échanger leur place, puis relâchez.");
          }, 320);
        });
        widget.addEventListener("pointerup", (event) => {
          if (gesture?.pointerId === event.pointerId) { gesture.lastX = event.clientX; gesture.lastY = event.clientY; }
          finishGesture();
        });
        widget.addEventListener("pointercancel", () => finishGesture(true));
        widget.addEventListener("lostpointercapture", () => { if (gesture) finishGesture(true); });
        widget.addEventListener("keydown", (event) => {
          if (event.target !== widget) return;
          if ([" ", "Enter"].includes(event.key)) {
            event.preventDefault();
            const moving = widget.dataset.keyboardMoving !== "true";
            widget.dataset.keyboardMoving = String(moving);
            if (moving) widget.setAttribute("aria-description", "Déplacement clavier activé. Utilisez les flèches ; Maj plus flèche redimensionne ; Échap termine.");
            else widget.removeAttribute("aria-description");
            widget.classList.toggle("is-keyboard-moving", moving);
            announceMosaic(moving ? "Déplacement clavier activé. Utilisez les flèches ; Maj plus flèche redimensionne. Échap termine." : "Déplacement clavier terminé.");
            return;
          }
          if (event.key === "Escape" && widget.dataset.keyboardMoving === "true") {
            widget.dataset.keyboardMoving = "false";
            widget.removeAttribute("aria-description");
            widget.classList.remove("is-keyboard-moving");
            announceMosaic("Déplacement clavier terminé.");
            return;
          }
          if (widget.dataset.keyboardMoving !== "true" || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
          event.preventDefault();
          if (event.shiftKey) {
            const colsAxis = ["ArrowLeft", "ArrowRight"].includes(event.key);
            const key = colsAxis ? "cols" : "rows";
            const delta = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1;
            const maximum = key === "cols" ? gridTrackCount() : 60;
            const minimum = key === "cols" ? gridTrackCount() === 24 ? 7 : 5 : 8;
            const nextSize = Math.max(minimum, Math.min(maximum, Number(widget.dataset[key]) + delta));
            if (key === "rows") {
              widget.closest("[data-mosaic-row]")?.querySelectorAll("[data-widget]").forEach((item) => { item.dataset.rows = String(nextSize); });
            } else {
              const row = widget.closest("[data-mosaic-row]");
              const neighbor = [...(row?.querySelectorAll("[data-widget]") || [])].find((item) => item !== widget);
              const adjustedSize = Math.min(nextSize, maximum - (neighbor ? minimum : 0));
              widget.dataset.cols = String(adjustedSize);
              if (neighbor) neighbor.dataset.cols = String(maximum - adjustedSize);
            }
            announceMosaic(`Fenêtre redimensionnée : ${widget.dataset.cols} colonnes par ${widget.dataset.rows} rangées.`);
          } else {
            const widgets = mosaicWidgets();
            const currentIndex = widgets.indexOf(widget);
            const delta = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1;
            const target = widgets[currentIndex + delta];
            if (target) reorderWidget(widget, target);
            announceMosaic("Ordre des fenêtres modifié.");
          }
        });
      });
    };

    const syncMosaicTracks = () => {
      if (!mosaic) return;
      const nextTrackCount = gridTrackCount();
      if (nextTrackCount !== knownGridTrackCount) {
        mosaic.querySelectorAll("[data-widget]").forEach((widget) => {
          widget.dataset.cols = String(Math.max(3, Math.round(Number(widget.dataset.cols) * nextTrackCount / knownGridTrackCount)));
        });
        knownGridTrackCount = nextTrackCount;
        renderMosaicRows();
      }
    };

    query?.addEventListener("input", () => {
      const value = query.value.trim().toLocaleLowerCase("fr");
      if (!value) return;
      const match = items.find((item) => `${item.title} ${item.type} ${item.shortDescription}`.toLocaleLowerCase("fr").includes(value));
      if (match) window.dispatchEvent(new CustomEvent("vestiges:select-subject", { detail: { id: match.id } }));
    });
    workspace.querySelector("[data-knowledge-search]")?.addEventListener("submit", (event) => event.preventDefault());
    window.addEventListener("vestiges:subject-change", (event) => updateSubject(event.detail?.id));
    renderMosaicRows();
    installMosaicInteractions();
    window.addEventListener("resize", syncMosaicTracks, { passive: true });
    updateSubject(activeId);
    syncMosaicTracks();
    showView(window.location.hash === "#graphe" ? "graph" : "editorial");
  }

  function initGraph() {
    const graph = document.querySelector("[data-graph]");
    if (!graph) return;
    const nodes = Array.from(graph.querySelectorAll("[data-graph-node]"));
    const title = graph.querySelector("[data-graph-title]");
    const description = graph.querySelector("[data-graph-description]");
    const status = graph.querySelector("[data-graph-status]");
    const records = {
      oeuvre: ["Bois flotté 01", "Cet exemple montre un fragment de bois. Son origine et son histoire ne sont pas établies.", "Objet d’exemple"],
      norvege: ["Norvège", "Les informations disponibles indiquent la Norvège ; le lieu précis et la date restent inconnus.", "Information déclarée"],
      artiste: ["Auteur non identifié", "Aucune personne n’a été identifiée pour cet objet.", "Information inconnue"],
      capture: ["Vidéo", "La vidéo montre l’objet sous plusieurs angles et a servi à créer le modèle 3D.", "Source de la démonstration"],
      matiere: ["Bois", "La matière est observée directement. L’essence, l’âge et le lieu de croissance ne sont pas encore identifiés.", "Observation directe"],
      forge: ["Reconstruction 3D", "La vidéo a été utilisée pour créer une représentation numérique de l’objet.", "Étape de démonstration"],
      modele: ["Modèle 3D", "Une représentation numérique du fragment. Ses dimensions et son origine restent incertaines.", "Démonstration"]
    };
    nodes.forEach((node) => {
      node.addEventListener("click", () => {
        nodes.forEach((item) => item.setAttribute("aria-pressed", String(item === node)));
        const [nextTitle, nextDescription, nextStatus] = records[node.dataset.graphNode] || records.oeuvre;
        if (title) title.textContent = nextTitle;
        if (description) description.textContent = nextDescription;
        if (status) status.textContent = nextStatus;
      });
    });
  }

  function initForgeViewer() {
    const viewers = document.querySelectorAll("[data-forge-viewer]");
    viewers.forEach((viewer) => {
      const button = viewer.querySelector("[data-load-model]");
      if (!button) return;
      let loading = false;
      const load = async () => {
        if (loading || viewer.dataset.viewerMounted === "true") return;
        loading = true;
        viewer.classList.add("is-model-loading");
        button.disabled = true;
        button.textContent = "Préparation de la vue 3D…";
        try {
          const { mountForgeViewer } = await import("/forge-viewer.20261013a.js");
          mountForgeViewer(viewer);
          button.hidden = true;
        } catch (_error) {
          loading = false;
          viewer.classList.remove("is-model-loading");
          button.disabled = false;
          button.textContent = "Réessayer d’ouvrir l’objet 3D";
          const status = viewer.querySelector("[data-viewer-status]");
          if (status) status.textContent = "La vue 3D n’a pas pu démarrer. Le dossier reste disponible.";
        }
      };
      button.addEventListener("click", load);

    });
  }

  function initContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;
    const routeLinks = Array.from(document.querySelectorAll("[data-route-choice]"));
    const steps = Array.from(form.querySelectorAll("[data-form-step]"));
    const progress = Array.from(form.querySelectorAll("[data-form-progress] span"));
    const previous = form.querySelector("[data-form-previous]");
    const next = form.querySelector("[data-form-next]");
    const submit = form.querySelector("[data-form-submit]");
    const error = form.querySelector("[data-form-error]");
    const review = form.querySelector("[data-form-review]");
    const progressMeter = form.querySelector("[data-form-progress]");
    const invitationContext = document.querySelector("[data-invitation-context]");
    const invitationCopy = document.querySelector("[data-invitation-copy]");
    const invitationRelevance = document.querySelector("[data-invitation-relevance]");
    const guidedAction = document.querySelector("[data-guided-action]");
    const directAction = document.querySelector("[data-direct-action]");
    const routePrefill = form.querySelector("[data-route-prefill]");
    let current = 0;

    const parameters = new URLSearchParams(window.location.search);
    const routeBySlug = {
      artistes: "Artisan·es et ateliers",
      artisans: "Artisan·es et ateliers",
      transmission: "Recherche et transmission",
      institutions: "Lieux culturels, associations et institutions",
      organisations: "Lieux culturels, associations et institutions",
      acheteurs: "Découvrir une pièce",
      autre: "Autre raison de nous écrire"
    };
    const routeChoices = form.querySelector(".choice-grid");
    if (routeChoices) {
      const buyerLabel = document.createElement("label");
      buyerLabel.className = "choice";
      const buyerInput = document.createElement("input");
      buyerInput.type = "radio";
      buyerInput.name = "route";
      buyerInput.value = routeBySlug.acheteurs;
      buyerInput.required = true;
      const buyerDescription = document.createElement("span");
      const buyerTitle = document.createElement("strong");
      buyerTitle.textContent = "Découvrir une pièce";
      buyerDescription.append(buyerTitle, document.createElement("br"), document.createTextNode("La boutique n’est pas ouverte. Ce message ne vaut ni commande, ni réservation, ni inscription à une liste."));
      buyerLabel.append(buyerInput, buyerDescription);
      routeChoices.append(buyerLabel);
      const otherLabel = document.createElement("label");
      otherLabel.className = "choice";
      const otherInput = document.createElement("input");
      otherInput.type = "radio";
      otherInput.name = "route";
      otherInput.value = routeBySlug.autre;
      otherInput.required = true;
      const otherDescription = document.createElement("span");
      const otherTitle = document.createElement("strong");
      otherTitle.textContent = "Autre raison de nous écrire";
      otherDescription.append(otherTitle, document.createElement("br"), document.createTextNode("Expliquez simplement ce qui vous amène."));
      otherLabel.append(otherInput, otherDescription);
      routeChoices.append(otherLabel);
    }
    const sourceBySlug = {
      direct: "Invitation de l’équipe Vestiges",
      joey: "Invitation de l’équipe Vestiges",
      recommendation: "Lien transmis par une personne",
      scouting: "Invitation de l’équipe Vestiges",
      programme: "Informations sur les premiers dossiers"
    };
    const safeToken = (value, maximum = 48) => {
      const candidate = String(value || "").slice(0, maximum);
      return /^[a-z0-9_-]+$/i.test(candidate) ? candidate : "";
    };
    const sourceSlug = safeToken(parameters.get("src"));
    const invitationId = safeToken(parameters.get("inv"));
    const requestedRoute = routeBySlug[parameters.get("parcours")];
    const originLabel = sourceBySlug[sourceSlug] || (invitationId ? "Lien d’invitation Vestiges" : "Accès direct au site");
    const invitedSources = new Set(["direct", "joey", "recommendation", "scouting"]);
    const invitedArrival = Boolean(invitationId || invitedSources.has(sourceSlug));
    const guidedArrival = Boolean(invitedArrival || requestedRoute || sourceSlug === "programme");
    const relevanceByRoute = {
      "Artisan·es et ateliers": "Le lien propose ce parcours. Vous pouvez le modifier avant d’écrire.",
      "Recherche et transmission": "Le lien propose ce parcours. Vous pouvez le modifier avant d’écrire.",
      "Lieux culturels, associations et institutions": "Le lien propose ce parcours. Vous pouvez le modifier avant d’écrire.",
      "Découvrir une pièce": "Vous souhaitez découvrir une pièce. La boutique n’est pas ouverte. Ce message ne vaut ni commande, ni réservation, ni inscription à une liste.",
      "Autre raison de nous écrire": "Votre demande ne correspond pas exactement aux choix proposés. Vous pouvez expliquer votre propre point de départ."
    };

    document.body.dataset.journeyContext = guidedArrival ? "guided" : "direct";
    if (invitedArrival && guidedAction && directAction) {
      guidedAction.classList.remove("button", "button-dark", "button-arrow");
      guidedAction.classList.add("text-link");
      directAction.classList.remove("text-link");
      directAction.classList.add("button", "button-dark");
    }

    if ((sourceSlug || invitationId) && invitationContext) {
      invitationContext.hidden = !invitedArrival;
      if (invitedArrival && invitationCopy) invitationCopy.textContent = sourceBySlug[sourceSlug] || "Votre lien a été préparé pour prolonger une invitation Vestiges sans exposer votre identité dans l’adresse de la page.";
      if (invitedArrival && invitationRelevance) invitationRelevance.textContent = relevanceByRoute[requestedRoute] || "Le lien indique seulement le parcours proposé. Il ne contient ni votre nom ni une intention supposée.";
    }
    if (requestedRoute) {
      const route = Array.from(form.elements.route || []).find((input) => input.value === requestedRoute);
      if (route) route.checked = true;
      if (routePrefill) routePrefill.hidden = false;
    }

    const showError = (message) => {
      if (!error) return;
      error.textContent = message;
      error.focus();
    };
    const clearError = () => { if (error) error.textContent = ""; };
    const displayValue = (data, name, fallback = "Non renseigné") => String(data.get(name) || "").trim() || fallback;
    const reviewRows = () => {
      const data = new FormData(form);
      return [
        ["Comment avez-vous connu Vestiges ?", originLabel],
        ["Votre point de départ", displayValue(data, "route")],
        ["Ce qui vous amène", displayValue(data, "context")],
        ["Ce que vous souhaitez aborder", displayValue(data, "outcome")],
        ["Suite souhaitée", displayValue(data, "nextStep")],
        ["Limite à respecter", displayValue(data, "boundaries")],
        ["Lien utile", displayValue(data, "link")],
        ["Nom d’usage", displayValue(data, "name")],
        ["Adresse e-mail", displayValue(data, "email")]
      ];
    };
    const renderReview = () => {
      if (!review) return;
      const fragment = document.createDocumentFragment();
      reviewRows().forEach(([label, value]) => {
        const group = document.createElement("div");
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        term.textContent = label;
        description.textContent = value;
        group.append(term, description);
        fragment.append(group);
      });
      review.replaceChildren(fragment);
    };
    const update = () => {
      steps.forEach((step, index) => { step.hidden = index !== current; });
      progress.forEach((item, index) => item.classList.toggle("is-active", index <= current));
      progressMeter?.setAttribute("aria-valuenow", String(current + 1));
      progressMeter?.setAttribute("aria-valuetext", `Étape ${current + 1} sur ${steps.length}`);
      if (previous) previous.hidden = current === 0;
      if (next) next.hidden = current === steps.length - 1;
      if (submit) submit.hidden = current !== steps.length - 1;
      if (current === steps.length - 1) renderReview();
      steps[current]?.querySelector("input, select, textarea")?.focus({ preventScroll: true });
      emitJourneySignal(current === steps.length - 1 ? "contact_review" : "contact_step", {
        context: guidedArrival ? "guided" : "direct",
        step: current + 1,
        total: steps.length
      });
    };
    const validate = () => {
      clearError();
      const controls = Array.from(steps[current].querySelectorAll("input, select, textarea")).filter((control) => !control.disabled);
      const invalid = controls.find((control) => !control.checkValidity());
      controls.forEach((control) => control.setAttribute("aria-invalid", String(!control.checkValidity())));
      if (!invalid) return true;
      const label = invalid.closest("fieldset")?.querySelector("legend")?.textContent.trim()
        || form.querySelector(`label[for="${invalid.id}"]`)?.textContent.trim()
        || "le champ indiqué";
      showError(`Vérifiez « ${label.replace(/\s*\*$/, "")} » avant de continuer.`);
      emitJourneySignal("contact_error", { field: invalid.name || invalid.id || "unknown", step: current + 1 });
      invalid.reportValidity();
      invalid.focus();
      return false;
    };

    next?.addEventListener("click", () => {
      if (!validate()) return;
      current = Math.min(current + 1, steps.length - 1);
      update();
    });
    previous?.addEventListener("click", () => {
      clearError();
      current = Math.max(current - 1, 0);
      update();
    });
    form.addEventListener("input", (event) => {
      event.target.removeAttribute("aria-invalid");
      clearError();
    });
    routeLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const value = link.dataset.routeChoice;
        const route = Array.from(form.elements.route || []).find((input) => input.value === value);
        if (route) {
          route.checked = true;
          route.dispatchEvent(new Event("input", { bubbles: true }));
        }
        if (routePrefill) routePrefill.hidden = false;
        document.querySelector("#conversation")?.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth" });
        window.setTimeout(() => form.querySelector("#context")?.focus({ preventScroll: true }), reduceMotion.matches ? 0 : 420);
      });
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validate()) return;
      const data = new FormData(form);
      if (data.get("website")) return;

      const route = displayValue(data, "route", "Échange autour de Vestiges");
      const subject = `Vestiges — premier contact · ${route}`;
      const lines = [
        "PREMIER CONTACT",
        "",
        `Comment avez-vous connu Vestiges ? : ${originLabel}`,
        `Point de départ : ${route}`,
        "",
        `Ce qui m’amène : ${displayValue(data, "context")}`,
        `Ce que je souhaite aborder : ${displayValue(data, "outcome")}`,
        `Suite souhaitée : ${displayValue(data, "nextStep")}`,
        `Limite à respecter : ${displayValue(data, "boundaries")}`,
        `Lien utile : ${displayValue(data, "link")}`,
        "",
        `Nom ou nom d’usage : ${displayValue(data, "name")}`,
        `Adresse e-mail où me répondre : ${displayValue(data, "email")}`,
        "",
        "Je choisis moi-même d’envoyer ce message depuis ma messagerie. Il ne vaut ni accord pour publier mes informations, ni inscription à une liste de diffusion."
      ];
      const mailto = `mailto:contact@vestiges.world?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
      const copyText = [`À : contact@vestiges.world`, `Objet : ${subject}`, "", ...lines].join("\n");
      const confirmation = document.createElement("section");
      confirmation.className = "form-step";
      confirmation.tabIndex = -1;
      confirmation.setAttribute("role", "status");
      confirmation.innerHTML = "<p class='eyebrow'>Message préparé</p><h3>Votre message est prêt.</h3><p>Votre messagerie peut s’ouvrir automatiquement. Relisez le message avant de décider de l’envoyer. Vestiges ne le recevra qu’après votre envoi.</p><div class='prepared-message-actions'><a class='button button-dark' data-open-prepared-mail>Ouvrir ma messagerie</a><button class='button' type='button' data-copy-prepared-message>Copier le message complet</button></div><p class='form-note' data-copy-status aria-live='polite'>Si aucune application ne s’ouvre, copiez le message puis écrivez à <a href='mailto:contact@vestiges.world'>contact@vestiges.world</a>.</p><div class='prepared-next-steps'><p class='meta'>Après l’envoi</p><ol><li>L’équipe Vestiges examine personnellement votre message.</li><li>La réponse peut contenir une question, proposer un échange ou expliquer pourquoi nous ne pouvons pas donner suite.</li><li>Un échange, la préparation d’une présentation et sa publication sont trois étapes distinctes ; vous pouvez accepter ou refuser chacune.</li></ol></div>";
      form.replaceChildren(confirmation);
      const openPreparedMail = confirmation.querySelector("[data-open-prepared-mail]");
      const copyPreparedMessage = confirmation.querySelector("[data-copy-prepared-message]");
      const copyStatus = confirmation.querySelector("[data-copy-status]");
      if (openPreparedMail) openPreparedMail.href = mailto;
      copyPreparedMessage?.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(copyText);
          if (copyStatus) copyStatus.textContent = "Message copié. Collez-le dans un e-mail adressé à contact@vestiges.world.";
          emitJourneySignal("message_copied", { destination: "email" });
        } catch (_error) {
          if (copyStatus) copyStatus.textContent = "La copie automatique n’est pas disponible. Écrivez directement à contact@vestiges.world.";
          emitJourneySignal("message_copy_failed", { destination: "email" });
        }
      });
      confirmation.focus({ preventScroll: true });
      emitJourneySignal("message_prepared", { context: guidedArrival ? "guided" : "direct" });
      window.location.href = mailto;
    });
    update();
  }
})();
