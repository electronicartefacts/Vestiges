(function () {
  "use strict";

  const config = window.VESTIGES_SITE_CONFIG || {};
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  initHeader();
  initReveal();
  initKineticType();
  initGraph();
  initResearchForm();
  initStableAnchor();

  function initStableAnchor() {
    if (!window.location.hash || !("fonts" in document)) return;
    document.fonts.ready.then(() => {
      const target = document.querySelector(window.location.hash);
      if (target) target.scrollIntoView({ block: "start", behavior: "auto" });
    });
  }

  function initHeader() {
    const header = document.querySelector("[data-header]");
    if (!header) return;
    const update = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function initReveal() {
    const elements = document.querySelectorAll(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6%" });

    elements.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index % 4, 3) * 60}ms`;
      observer.observe(element);
    });
  }

  function initKineticType() {
    const title = document.querySelector("[data-kinetic]");
    if (!title || reduceMotion) return;

    const text = title.textContent.trim();
    const segmenter = "Segmenter" in Intl
      ? new Intl.Segmenter("fr", { granularity: "grapheme" })
      : null;
    const graphemes = segmenter
      ? Array.from(segmenter.segment(text), (part) => part.segment)
      : Array.from(text);

    title.textContent = "";
    graphemes.forEach((glyph) => {
      if (/\s/.test(glyph)) {
        title.append(document.createTextNode(glyph));
        return;
      }
      const span = document.createElement("span");
      span.className = "glyph";
      span.textContent = glyph;
      title.append(span);
    });

    const glyphs = Array.from(title.querySelectorAll(".glyph"));
    let frame = 0;

    const reset = () => {
      glyphs.forEach((glyph) => {
        glyph.style.setProperty("--glyph-weight", "310");
        glyph.style.setProperty("--glyph-shift", "0");
      });
    };

    title.addEventListener("pointermove", (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        glyphs.forEach((glyph) => {
          const rect = glyph.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
          const influence = Math.max(0, 1 - distance / 190);
          const softened = influence * influence * (3 - 2 * influence);
          glyph.style.setProperty("--glyph-weight", String(Math.round(310 + softened * 360)));
          glyph.style.setProperty("--glyph-shift", `${(-softened * 0.035).toFixed(3)}em`);
        });
      });
    });

    title.addEventListener("pointerleave", reset);
  }

  function initGraph() {
    const stage = document.querySelector("[data-graph]");
    if (!stage) return;
    const nodes = Array.from(stage.querySelectorAll("[data-node]"));
    const edges = Array.from(stage.querySelectorAll("[data-edge]"));
    const ledgerRows = Array.from(document.querySelectorAll("[data-relation-node]"));
    const caption = stage.querySelector("[data-graph-caption] strong");
    const descriptions = {
      work: "Une œuvre et les contextes qui la rendent intelligible.",
      material: "Une matière reliée à l’œuvre et au lieu où elle est travaillée.",
      gesture: "Un geste relié à l’œuvre et aux conditions de sa transmission.",
      studio: "L’atelier comme lieu de pratique, de décision et de mémoire.",
      place: "Un lieu relié aux ressources, aux pratiques et aux circulations.",
      transmission: "Une transmission faite de gestes, de récits et de situations."
    };

    const activate = (id) => {
      const related = new Set([id]);
      edges.forEach((edge) => {
        const ids = edge.dataset.edge.split(" ");
        const active = ids.includes(id);
        edge.classList.toggle("is-active", active);
        edge.classList.toggle("is-muted", !active);
        if (active) ids.forEach((edgeId) => related.add(edgeId));
      });
      nodes.forEach((node) => {
        node.classList.toggle("is-active", node.dataset.node === id);
        node.classList.toggle("is-related", related.has(node.dataset.node));
      });
      ledgerRows.forEach((row) => {
        row.classList.toggle("is-active", id === "work" || row.dataset.relationNode === id);
      });
      stage.classList.add("has-active");
      if (caption) caption.textContent = descriptions[id] || descriptions.work;
    };

    const reset = () => {
      stage.classList.remove("has-active");
      nodes.forEach((node) => node.classList.remove("is-active", "is-related"));
      edges.forEach((edge) => edge.classList.remove("is-active", "is-muted"));
      ledgerRows.forEach((row) => row.classList.remove("is-active"));
      if (caption) caption.textContent = descriptions.work;
    };

    nodes.forEach((node) => {
      node.addEventListener("pointerenter", () => activate(node.dataset.node));
      node.addEventListener("focus", () => activate(node.dataset.node));
      node.addEventListener("click", () => activate(node.dataset.node));
      node.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activate(node.dataset.node);
      });
    });
    stage.addEventListener("pointerleave", reset);
  }

  function initResearchForm() {
    const form = document.querySelector("#research-form");
    if (!form) return;

    const startedAt = new Date().toISOString();
    const steps = Array.from(form.querySelectorAll("[data-step]"));
    const progress = Array.from(form.querySelectorAll("[data-progress]"));
    const previousButton = form.querySelector("[data-previous]");
    const nextButton = form.querySelector("[data-next]");
    const submitButton = form.querySelector("[data-submit]");
    const error = form.querySelector("[data-form-error]");
    const status = document.querySelector("[data-collection-status]");
    const message = form.querySelector("textarea[name='message']");
    const counter = form.querySelector("[data-character-count]");
    let currentStep = 1;

    const isOpen = Boolean(config.collectionEnabled && config.intakeEndpoint);
    document.documentElement.dataset.collection = isOpen ? "open" : "closed";
    status.textContent = isOpen
      ? "Collecte ouverte — les informations sont transmises de manière sécurisée à Electronic Artefacts."
      : "Prototype public — parcours testable, transmission volontairement désactivée pendant la configuration de l’infrastructure.";

    const showError = (text) => {
      error.textContent = text;
      error.hidden = !text;
    };

    const getProfile = () => form.querySelector("input[name='form_type']:checked")?.value || "";

    const syncBranches = () => {
      const profile = getProfile();
      form.querySelectorAll("[data-branch]").forEach((branch) => {
        const active = branch.dataset.branch === profile;
        branch.hidden = !active;
        branch.querySelectorAll("input, select, textarea").forEach((control) => {
          control.disabled = !active;
          control.required = active && control.hasAttribute("data-required");
        });
      });
    };

    document.querySelectorAll("[data-profile-target]").forEach((link) => {
      link.addEventListener("click", () => {
        const target = form.querySelector(`input[name="form_type"][value="${link.dataset.profileTarget}"]`);
        if (!target) return;
        target.checked = true;
        syncBranches();
      });
    });

    const updateStep = () => {
      steps.forEach((step) => {
        const active = Number(step.dataset.step) === currentStep;
        step.hidden = !active;
        step.classList.toggle("is-active", active);
      });
      progress.forEach((item) => {
        const position = Number(item.dataset.progress);
        item.classList.toggle("is-current", position === currentStep);
        item.classList.toggle("is-complete", position < currentStep);
      });
      previousButton.hidden = currentStep === 1;
      nextButton.hidden = currentStep === steps.length;
      submitButton.hidden = currentStep !== steps.length;
      if (currentStep === steps.length) buildReview();
      showError("");
      steps[currentStep - 1].querySelector("h3")?.focus?.({ preventScroll: true });
    };

    const validateStep = () => {
      const activeStep = steps[currentStep - 1];
      const controls = Array.from(activeStep.querySelectorAll("input, select, textarea"))
        .filter((control) => !control.disabled && control.type !== "hidden");
      const invalid = controls.find((control) => !control.checkValidity());
      controls.forEach((control) => control.setAttribute("aria-invalid", String(!control.checkValidity())));
      if (!invalid) return true;
      showError("Vérifiez le champ indiqué avant de continuer.");
      invalid.focus();
      return false;
    };

    const buildReview = () => {
      const list = form.querySelector("[data-review-list]");
      const data = new FormData(form);
      const labels = {
        PRACTITIONER: "Je pratique ou je crée",
        RESEARCHER: "Je transmets ou je recherche",
        INSTITUTION: "Je représente une organisation",
        OTHER: "Autre situation"
      };
      const rows = [
        ["Regard", labels[getProfile()] || "—"],
        ["Nom d’usage", data.get("display_name") || "—"],
        ["Adresse de réponse", data.get("email") || "—"],
        ["Territoire", data.get("territory") || "Non renseigné"],
        ["Lien", data.get("professional_url") || "Non renseigné"]
      ];

      const branchValue = data.get("practice_name") || data.get("field") || data.get("organization_name") || data.get("role_description");
      if (branchValue) rows.push(["Contexte", branchValue]);
      if (data.get("message")) rows.push(["Message", data.get("message")]);

      list.replaceChildren(...rows.map(([label, value]) => {
        const wrapper = document.createElement("div");
        wrapper.className = "review-row";
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        term.textContent = label;
        description.textContent = String(value);
        wrapper.append(term, description);
        return wrapper;
      }));
    };

    const purposeFor = (data, profile) => {
      const keys = {
        PRACTITIONER: "practitioner_purpose",
        RESEARCHER: "researcher_purpose",
        INSTITUTION: "institution_purpose"
      };
      return data.get(keys[profile]) || "PROFESSIONAL_EXCHANGE";
    };

    const buildPayload = () => {
      const formData = new FormData(form);
      const profile = getProfile();
      const common = {
        display_name: formData.get("display_name"),
        email: formData.get("email"),
        territory: formData.get("territory") || "",
        professional_url: formData.get("professional_url") || "",
        purpose: purposeFor(formData, profile),
        message: formData.get("message") || ""
      };
      if (profile === "PRACTITIONER") {
        common.practice_name = formData.get("practice_name");
        common.practice_domain = formData.get("practice_domain");
      }
      if (profile === "RESEARCHER") common.field = formData.get("field");
      if (profile === "INSTITUTION") {
        common.organization_name = formData.get("organization_name");
        common.role = formData.get("role");
        common.organization_type = formData.get("organization_type");
      }
      if (profile === "OTHER") common.role_description = formData.get("role_description");

      return {
        schema_version: config.contractVersion || "vestiges.intake.v1",
        form_type: profile,
        form_version: formData.get("form_version"),
        notice_version: formData.get("notice_version"),
        locale: "fr-FR",
        started_at: startedAt,
        website: formData.get("website") || "",
        data: common,
        notice_acknowledged: formData.get("notice_acknowledged") === "on"
      };
    };

    form.addEventListener("change", (event) => {
      if (event.target.name === "form_type") syncBranches();
      event.target.removeAttribute("aria-invalid");
    });

    nextButton.addEventListener("click", () => {
      syncBranches();
      if (!validateStep()) return;
      currentStep = Math.min(steps.length, currentStep + 1);
      updateStep();
      form.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });

    previousButton.addEventListener("click", () => {
      currentStep = Math.max(1, currentStep - 1);
      updateStep();
    });

    if (message && counter) {
      message.addEventListener("input", () => {
        counter.textContent = `${message.value.length.toLocaleString("fr-FR")} / 800`;
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      syncBranches();
      if (!validateStep()) return;

      if (!isOpen) {
        showError("La transmission est volontairement désactivée pendant la configuration de l’infrastructure. Vous pouvez examiner le parcours, mais aucune information n’a été envoyée ni enregistrée.");
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Transmission…";
      try {
        const response = await fetch(config.intakeEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload())
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.status !== "ACCEPTED") throw new Error("SUBMISSION_REJECTED");
        form.replaceChildren(Object.assign(document.createElement("div"), {
          className: "form-step",
          innerHTML: "<div class='step-heading'><span>Proposition transmise</span><h3>Merci pour votre regard.</h3><p>Votre proposition a été transmise pour examen. Aucun profil n’a été créé et rien ne sera publié.</p></div>"
        }));
      } catch (_error) {
        showError("La proposition n’a pas été transmise. Réessayez plus tard ou écrivez à contact@vestiges.world.");
        submitButton.disabled = false;
        submitButton.textContent = "Transmettre la proposition";
      }
    });

    syncBranches();
    updateStep();
  }
})();
