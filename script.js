(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  initMenu();
  initIntro();
  initReveals();
  initOutputTabs();
  initRelations();
  initGraph();
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
      oeuvre: ["Fragment 01", "Point d’entrée du spécimen éditorial. Aucune œuvre réelle n’est représentée."],
      geste: ["Geste", "Une pression répétée transforme la surface et laisse une irrégularité visible."],
      matiere: ["Matière", "Une matière minérale de démonstration, sans provenance réelle attribuée."],
      atelier: ["Atelier", "Le lieu où se rencontrent outils, habitudes, décisions et transmissions."],
      source: ["Source", "Note de démonstration. Dans un dossier réel, l’auteur, la date et le statut seraient indiqués."]
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

  function initContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;
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
