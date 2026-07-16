(function () {
  "use strict";

  const storageKey = "vestiges:theme:v1";
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  const readPreference = () => {
    try {
      const value = localStorage.getItem(storageKey);
      return value === "light" || value === "dark" ? value : null;
    } catch (_error) {
      return null;
    }
  };

  const savePreference = (value) => {
    try { localStorage.setItem(storageKey, value); } catch (_error) { /* Optional enhancement. */ }
  };

  const effectiveTheme = () => document.documentElement.dataset.theme || (systemDark.matches ? "dark" : "light");
  const applyPreference = (value) => {
    if (value) document.documentElement.dataset.theme = value;
    else delete document.documentElement.dataset.theme;
  };

  applyPreference(readPreference());

  const icon = (target) => target === "light"
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"></path></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.2A8.4 8.4 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z"></path></svg>';

  const updateButton = (button) => {
    const current = effectiveTheme();
    const target = current === "dark" ? "light" : "dark";
    const label = target === "dark" ? "sombre" : "clair";
    button.innerHTML = icon(target);
    button.setAttribute("aria-label", `Activer le mode ${label}`);
    button.setAttribute("title", `Activer le mode ${label}`);
    button.setAttribute("aria-pressed", String(current === "dark"));
  };

  const mountToggle = () => {
    const actions = document.querySelector(".header-actions");
    if (!actions || actions.querySelector("[data-theme-toggle]")) return;

    const button = document.createElement("button");
    button.className = "theme-toggle";
    button.type = "button";
    button.dataset.themeToggle = "";
    updateButton(button);
    button.addEventListener("click", () => {
      const next = effectiveTheme() === "dark" ? "light" : "dark";
      applyPreference(next);
      savePreference(next);
      updateButton(button);
    });

    actions.insertBefore(button, actions.querySelector("[data-menu-toggle]"));
    systemDark.addEventListener("change", () => {
      if (!readPreference()) updateButton(button);
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountToggle, { once: true });
  else mountToggle();
}());
