(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  initMenu();
  initIntro();
  initReveals();
  initEditorialRhythm();
  initKineticType();
  initGraph();
  initForgeViewer();
  initContactForm();

  function initMenu() {
    const button = document.querySelector("[data-menu-toggle]");
    const navigation = document.querySelector("[data-main-nav]");
    if (!button || !navigation) return;
    if (!navigation.hasAttribute("aria-label")) navigation.setAttribute("aria-label", "Navigation principale");

    const primaryAction = document.querySelector(".header-actions a[href^='/participer/']");
    if (primaryAction && !navigation.querySelector(".mobile-nav-cta")) {
      const mobileAction = primaryAction.cloneNode(true);
      mobileAction.className = "mobile-nav-cta";
      navigation.append(mobileAction);
    }

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
      }, reduceMotion.matches ? 10 : 650);
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
      const beat = 480;
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
      timers.push(window.setTimeout(() => finish({ restoreFocus: replay }), 160 + words.length * beat + 650));
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

    if (hasVisited() && !forceReplay) {
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

    const sentenceSegmenter = new Intl.Segmenter("fr", { granularity: "sentence" });
    const paragraphs = Array.from(document.querySelectorAll("main p")).filter((paragraph) => {
      if (paragraph.closest("[data-brand-intro]")) return false;
      if (paragraph.matches(".eyebrow, .section-index, .meta, .status-label, .object-truth, .visually-hidden")) return false;
      if (paragraph.children.length || paragraph.textContent.trim().length < 80) return false;
      return Array.from(sentenceSegmenter.segment(paragraph.textContent.trim())).length > 1;
    });
    if (!paragraphs.length) return;

    const records = paragraphs.map((paragraph) => {
      const text = paragraph.textContent.trim();
      const sentences = Array.from(sentenceSegmenter.segment(text), (part) => part.segment.trim()).filter(Boolean);
      const fragment = document.createDocumentFragment();
      const breaks = [];
      const sentenceNodes = [];

      sentences.forEach((sentence, sentenceIndex) => {
        if (sentenceIndex) {
          const lineBreak = document.createElement("br");
          lineBreak.className = "editorial-sentence-break";
          lineBreak.hidden = true;
          lineBreak.setAttribute("aria-hidden", "true");
          breaks.push(lineBreak);
          fragment.append(lineBreak);
        }

        const sentenceNode = document.createElement("span");
        sentenceNode.className = "editorial-sentence";
        sentenceNode.append(`${sentenceIndex ? " " : ""}${sentence}`);
        sentenceNodes.push(sentenceNode);
        fragment.append(sentenceNode);
      });

      paragraph.replaceChildren(fragment);
      return { paragraph, breaks, sentenceNodes };
    });

    let frame = 0;
    const countFirstLineWords = (sentence) => {
      const range = document.createRange();
      const textNode = sentence.firstChild;
      if (!(textNode instanceof Text)) return Infinity;
      const text = textNode.data;
      const words = [...text.matchAll(/\S+/gu)];
      let firstTop;
      let count = 0;
      let wraps = false;

      words.forEach((word) => {
        range.setStart(textNode, word.index);
        range.setEnd(textNode, word.index + word[0].length);
        const rect = range.getBoundingClientRect();
        if (firstTop === undefined) firstTop = rect.top;
        if (Math.abs(rect.top - firstTop) < 1) count += 1;
        else wraps = true;
      });
      range.detach();
      return wraps ? count : Infinity;
    };

    const balance = () => {
      frame = 0;
      records.forEach(({ breaks }) => breaks.forEach((lineBreak) => { lineBreak.hidden = true; }));
      records.forEach(({ breaks, sentenceNodes }) => {
        sentenceNodes.slice(1).forEach((sentence, index) => {
          if (countFirstLineWords(sentence) <= 4) breaks[index].hidden = false;
        });
      });
    };

    const schedule = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(balance);
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
      .filter((heading) => !heading.querySelector("input, button, a") && heading.textContent.trim());
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

    const requestFrame = (state) => {
      activeStates.add(state);
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    const render = (time) => {
      frame = 0;
      activeStates.forEach((state) => {
        const length = state.glyphs.length;
        let center = -999;
        let amplitude = 0;
        let radius = Math.max(2.2, Math.min(6.5, length * .09));
        let keepAlive = false;

        if (state.hovered) {
          center = state.pointerIndex;
          amplitude = 470 * state.pointerStrength;
          keepAlive = true;
        } else if (state.tapStarted) {
          const progress = Math.min(1, (time - state.tapStarted) / 760);
          center = state.tapIndex;
          amplitude = Math.sin(progress * Math.PI) * 430;
          radius = 2.2 + progress * 5;
          keepAlive = progress < 1;
          if (!keepAlive) state.tapStarted = 0;
        } else if (state.revealStarted) {
          const progress = Math.min(1, (time - state.revealStarted) / 1250);
          center = -4 + progress * (length + 8);
          amplitude = Math.sin(progress * Math.PI) * 330;
          radius = Math.max(3, length * .11);
          keepAlive = progress < 1;
          if (!keepAlive) state.revealStarted = 0;
        } else if (state.ambient) {
          center = ((Math.sin(time * .00042) + 1) / 2) * Math.max(0, length - 1);
          amplitude = 115;
          radius = Math.max(4, length * .08);
          keepAlive = document.visibilityState === "visible";
        }

        let unsettled = false;
        state.glyphs.forEach((glyph, index) => {
          const distance = (index - center) / radius;
          const influence = amplitude * Math.exp(-.5 * distance * distance);
          const target = Math.min(820, state.base + influence);
          const current = state.weights[index] + (target - state.weights[index]) * .16;
          state.weights[index] = current;
          glyph.dataset.kineticLevel = String(Math.max(0, Math.min(8, Math.round((current - 340) / 60))));
          if (Math.abs(current - target) > .35) unsettled = true;
        });

        if (!keepAlive && !unsettled) {
          state.glyphs.forEach((glyph, index) => {
            state.weights[index] = state.base;
            glyph.dataset.kineticLevel = "0";
          });
          activeStates.delete(state);
        }
      });
      if (activeStates.size) frame = window.requestAnimationFrame(render);
    };

    headings.forEach((heading, headingIndex) => {
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
          glyph.dataset.kineticLevel = "0";
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
        pointerStrength: 1,
        tapIndex: 0,
        tapStarted: 0,
        revealStarted: 0,
        ambient: heading.tagName === "H1"
      };
      states.push(state);

      heading.addEventListener("pointerenter", () => {
        state.hovered = true;
        requestFrame(state);
      });
      heading.addEventListener("pointermove", (event) => {
        const bounds = heading.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / Math.max(1, bounds.width)));
        const verticalDistance = Math.abs(event.clientY - (bounds.top + bounds.height / 2));
        state.pointerIndex = ratio * Math.max(0, glyphs.length - 1);
        state.pointerStrength = Math.max(.35, 1 - verticalDistance / Math.max(90, bounds.height));
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

    states.filter((state) => state.ambient).forEach(requestFrame);
  }

  function initGraph() {
    const graph = document.querySelector("[data-graph]");
    if (!graph) return;
    const nodes = Array.from(graph.querySelectorAll("[data-graph-node]"));
    const title = graph.querySelector("[data-graph-title]");
    const description = graph.querySelector("[data-graph-description]");
    const status = graph.querySelector("[data-graph-status]");
    const records = {
      oeuvre: ["Bois flotté 01", "Le point de départ relie une matière, une provenance déclarée, des inconnues et une chaîne de production numérique.", "Objet documenté"],
      norvege: ["Norvège", "Le pays de découverte est déclaré. Le littoral, les coordonnées et la date de collecte restent à documenter.", "Provenance déclarée"],
      artiste: ["Artiste inconnu", "Aucune attribution artistique n’accompagne le fragment. Cette absence est conservée comme une donnée, pas comblée par une hypothèse.", "Information inconnue"],
      capture: ["Capture vidéo", "Une séquence orbitale autour du bois fournit les points de vue nécessaires à la reconstruction.", "Source attribuée"],
      matiere: ["Bois", "La matière est observée directement. L’essence, l’âge et le lieu de croissance ne sont pas encore identifiés.", "Observation directe"],
      forge: ["FORGE", "La technologie d’Electronic Artefacts convertit la vidéo en maillage 3D texturé tout en conservant la provenance numérique.", "Traitement attribué"],
      modele: ["GLB · texture 8K", "Le double numérique associe 404 304 faces à un atlas de texture 8192 × 8192 pixels.", "Production vérifiée"]
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
          const { mountForgeViewer } = await import("/forge-viewer.20260716g.js");
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

      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const constrained = connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || "");
      if (!constrained && "IntersectionObserver" in window) {
        const observer = new IntersectionObserver(([entry]) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          load();
        }, { rootMargin: "240px 0px", threshold: 0.01 });
        observer.observe(viewer);
      }
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
    const invitationContext = document.querySelector("[data-invitation-context]");
    const invitationCopy = document.querySelector("[data-invitation-copy]");
    const routePrefill = form.querySelector("[data-route-prefill]");
    let current = 0;

    const parameters = new URLSearchParams(window.location.search);
    const routeBySlug = {
      artistes: "Artistes et ateliers",
      transmission: "Recherche et transmission",
      institutions: "Institutions et territoires",
      organisations: "Institutions et territoires"
    };
    const sourceBySlug = {
      direct: "Invitation directe de Vestiges",
      joey: "Invitation directe de Joey pour Vestiges",
      recommendation: "Invitation transmise par recommandation",
      scouting: "Invitation issue d’un repérage professionnel",
      programme: "Parcours du Programme fondateur Vestiges"
    };
    const safeToken = (value, maximum = 48) => {
      const candidate = String(value || "").slice(0, maximum);
      return /^[a-z0-9_-]+$/i.test(candidate) ? candidate : "";
    };
    const sourceSlug = safeToken(parameters.get("src"));
    const invitationId = safeToken(parameters.get("inv"));
    const requestedRoute = routeBySlug[parameters.get("parcours")];
    const originLabel = sourceBySlug[sourceSlug] || (invitationId ? "Lien d’invitation Vestiges" : "Accès direct au site");
    const originReference = invitationId ? `Référence opaque : ${invitationId}` : "Aucune référence d’invitation";

    if ((sourceSlug || invitationId) && invitationContext) {
      invitationContext.hidden = false;
      if (invitationCopy) invitationCopy.textContent = sourceBySlug[sourceSlug] || "Votre lien a été préparé pour prolonger une invitation Vestiges sans exposer votre identité dans l’adresse de la page.";
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
        ["Provenance", `${originLabel} · ${originReference}`],
        ["Parcours", displayValue(data, "route")],
        ["Pratique, recherche ou terrain", displayValue(data, "practice")],
        ["Situation", displayValue(data, "situation")],
        ["Résultat recherché", displayValue(data, "outcome")],
        ["Suite souhaitée", displayValue(data, "nextStep")],
        ["Limite à respecter", displayValue(data, "boundaries")],
        ["Territoire", displayValue(data, "territory")],
        ["Lien", displayValue(data, "link")],
        ["Nom d’usage", displayValue(data, "name")],
        ["Adresse de réponse", displayValue(data, "email")]
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
      if (previous) previous.hidden = current === 0;
      if (next) next.hidden = current === steps.length - 1;
      if (submit) submit.hidden = current !== steps.length - 1;
      if (current === steps.length - 1) renderReview();
      steps[current]?.querySelector("input, select, textarea")?.focus({ preventScroll: true });
    };
    const validate = () => {
      clearError();
      const controls = Array.from(steps[current].querySelectorAll("input, select, textarea")).filter((control) => !control.disabled);
      const invalid = controls.find((control) => !control.checkValidity());
      controls.forEach((control) => control.setAttribute("aria-invalid", String(!control.checkValidity())));
      if (!invalid) return true;
      showError("Vérifiez le champ indiqué avant de continuer.");
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
        window.setTimeout(() => form.querySelector("#practice")?.focus({ preventScroll: true }), reduceMotion.matches ? 0 : 420);
      });
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validate()) return;
      const data = new FormData(form);
      if (data.get("website")) return;

      const route = displayValue(data, "route", "Échange autour de Vestiges");
      const subject = `Vestiges — échange · ${route}`;
      const lines = [
        "DEMANDE DE PREMIER ÉCHANGE",
        "",
        `Provenance : ${originLabel}`,
        originReference,
        `Parcours : ${route}`,
        "",
        `Pratique, recherche ou terrain : ${displayValue(data, "practice")}`,
        `Situation concrète : ${displayValue(data, "situation")}`,
        `Résultat recherché : ${displayValue(data, "outcome")}`,
        `Suite souhaitée : ${displayValue(data, "nextStep")}`,
        `Limite à respecter : ${displayValue(data, "boundaries")}`,
        `Territoire : ${displayValue(data, "territory")}`,
        `Lien utile : ${displayValue(data, "link")}`,
        "",
        `Nom ou nom d’usage : ${displayValue(data, "name")}`,
        `Adresse de réponse : ${displayValue(data, "email")}`,
        "",
        "Ce message a été relu puis envoyé depuis la messagerie de la personne. Il ne constitue ni une autorisation de publication, ni une inscription à une newsletter."
      ];
      const mailto = `mailto:contact@vestiges.world?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
      window.location.href = mailto;

      const confirmation = document.createElement("section");
      confirmation.className = "form-step";
      confirmation.tabIndex = -1;
      confirmation.setAttribute("role", "status");
      confirmation.innerHTML = "<p class='eyebrow'>Message préparé</p><h3>Votre messagerie doit maintenant s’ouvrir.</h3><p>Relisez puis envoyez le message depuis votre application. Vestiges n’a rien reçu tant que vous ne l’avez pas envoyé.</p><p><a class='text-link' href='mailto:contact@vestiges.world'>Écrire directement à contact@vestiges.world</a></p>";
      form.replaceChildren(confirmation);
      confirmation.focus({ preventScroll: true });
    });
    update();
  }
})();
