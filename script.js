(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  initMenu();
  initIntro();
  initReveals();
  initKineticType();
  initOutputTabs();
  initRelations();
  initGraph();
  initForgeViewer();
  initContactForm();

  function initMenu() {
    const button = document.querySelector("[data-menu-toggle]");
    const navigation = document.querySelector("[data-main-nav]");
    if (!button || !navigation) return;

    const close = () => {
      button.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
    };

    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      navigation.classList.toggle("is-open", open);
    });
    navigation.addEventListener("click", close);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
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
    let timers = [];
    let lastFocus = null;

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
        if (restoreFocus && lastFocus instanceof HTMLElement) lastFocus.focus();
        if (forceReplay && window.history.replaceState) window.history.replaceState({}, "", window.location.pathname + window.location.hash);
      }, reduceMotion.matches ? 10 : 650);
    };

    const play = ({ replay = false } = {}) => {
      clearTimers();
      lastFocus = replay ? document.activeElement : null;
      intro.hidden = false;
      document.body.classList.add("intro-open");
      words.forEach((word) => word.classList.remove("is-active", "is-past"));
      intro.style.setProperty("--intro-progress", "0%");
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
          intro.style.setProperty("--intro-progress", `${((index + 1) / words.length) * 100}%`);
          if (count) count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(words.length).padStart(2, "0")}`;
        }, 160 + index * beat));
      });
      timers.push(window.setTimeout(() => finish({ restoreFocus: replay }), 160 + words.length * beat + 650));
    };

    skip?.addEventListener("click", () => finish());
    enter?.addEventListener("click", () => finish());
    intro.addEventListener("keydown", (event) => {
      if (event.key === "Escape") finish();
    });
    replayButtons.forEach((button) => button.addEventListener("click", () => play({ replay: true })));

    if (hasVisited() && !forceReplay) {
      intro.hidden = true;
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
          glyph.style.setProperty("--glyph-weight", current.toFixed(1));
          glyph.style.setProperty("--glyph-lift", `${(-influence / 230).toFixed(2)}px`);
          if (Math.abs(current - target) > .35) unsettled = true;
        });

        if (!keepAlive && !unsettled) {
          state.glyphs.forEach((glyph, index) => {
            state.weights[index] = state.base;
            glyph.style.setProperty("--glyph-weight", String(state.base));
            glyph.style.setProperty("--glyph-lift", "0px");
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
          glyph.style.setProperty("--glyph-weight", String(base));
          glyph.style.setProperty("--glyph-lift", "0px");
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

  function initOutputTabs() {
    document.querySelectorAll("[data-output-tabs]").forEach((group) => {
      const tabs = Array.from(group.querySelectorAll("[role='tab']"));
      const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls"))).filter(Boolean);
      const activate = (tab) => {
        tabs.forEach((item) => {
          const active = item === tab;
          item.setAttribute("aria-selected", String(active));
          item.tabIndex = active ? 0 : -1;
        });
        panels.forEach((panel) => { panel.hidden = panel.id !== tab.getAttribute("aria-controls"); });
      };
      tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => activate(tab));
        tab.addEventListener("keydown", (event) => {
          if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
          event.preventDefault();
          const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
          const next = tabs[(index + direction + tabs.length) % tabs.length];
          activate(next);
          next.focus();
        });
      });
    });
  }

  function initRelations() {
    const demo = document.querySelector("[data-relation-demo]");
    if (!demo) return;
    const buttons = Array.from(demo.querySelectorAll("[data-relation-node]"));
    const detail = demo.querySelector("[data-relation-detail]");
    const copy = {
      oeuvre: "Le fragment présenté est une forme éditoriale de démonstration, pas une œuvre réelle.",
      matiere: "La matière ne sert pas de décor : elle devient un élément documenté, situé et relié au geste."
    };
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        if (detail) detail.textContent = copy[button.dataset.relationNode] || "";
      });
    });
  }

  function initGraph() {
    const graph = document.querySelector("[data-graph]");
    if (!graph) return;
    const nodes = Array.from(graph.querySelectorAll("[data-graph-node]"));
    const title = graph.querySelector("[data-graph-title]");
    const description = graph.querySelector("[data-graph-description]");
    const records = {
      oeuvre: ["Bois flotté 01", "Premier objet documenté par Vestiges : un sujet naturel trouvé, sans artiste attribué."],
      capture: ["Capture vidéo", "Une séquence orbitale autour du bois fournit les points de vue nécessaires à la reconstruction."],
      matiere: ["Matière", "Bois transformé par l’eau, le temps et le déplacement. Son origine précise n’est pas documentée."],
      forge: ["FORGE", "La technologie de reconstruction d’Electronic Artefacts convertit la vidéo en maillage 3D texturé."],
      modele: ["Modèle 8K", "Un maillage de 404 304 faces associé à un atlas de texture 8192 × 8192 pixels."]
    };
    nodes.forEach((node) => {
      node.addEventListener("click", () => {
        nodes.forEach((item) => item.setAttribute("aria-pressed", String(item === node)));
        const [nextTitle, nextDescription] = records[node.dataset.graphNode] || records.oeuvre;
        if (title) title.textContent = nextTitle;
        if (description) description.textContent = nextDescription;
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
          const { mountForgeViewer } = await import("/forge-viewer.js");
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
    let current = 0;

    const showError = (message) => {
      if (!error) return;
      error.textContent = message;
      error.focus();
    };
    const clearError = () => { if (error) error.textContent = ""; };
    const update = () => {
      steps.forEach((step, index) => { step.hidden = index !== current; });
      progress.forEach((item, index) => item.classList.toggle("is-active", index <= current));
      if (previous) previous.hidden = current === 0;
      if (next) next.hidden = current === steps.length - 1;
      if (submit) submit.hidden = current !== steps.length - 1;
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
        document.querySelector("#conversation")?.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth" });
        window.setTimeout(() => form.querySelector("#intention")?.focus({ preventScroll: true }), reduceMotion.matches ? 0 : 420);
      });
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validate()) return;
      const data = new FormData(form);
      if (data.get("website")) return;

      const route = String(data.get("route") || "Échange autour de Vestiges");
      const subject = `Vestiges — ${route}`;
      const lines = [
        `Intention : ${data.get("intention") || ""}`,
        `Pratique, sujet ou terrain : ${data.get("practice") || ""}`,
        `Lien utile : ${data.get("link") || "Non renseigné"}`,
        "",
        `Nom ou nom d’usage : ${data.get("name") || ""}`,
        `Adresse de réponse : ${data.get("email") || ""}`
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
