(function () {
  "use strict";

  var storageKey = "agely-theme";
  var allowedThemes = {
    system: true,
    light: true,
    dark: true
  };

  function normalizedTheme(value) {
    return allowedThemes[value] ? value : "system";
  }

  function systemTheme() {
    if (!window.matchMedia) { return "light"; }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function resolvedTheme(theme) {
    return theme === "system" ? systemTheme() : theme;
  }

  try {
    var theme = normalizedTheme(window.localStorage.getItem(storageKey));
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.resolvedTheme = resolvedTheme(theme);
  } catch (_) {
    document.documentElement.dataset.theme = "system";
    document.documentElement.dataset.resolvedTheme = systemTheme();
  }
}());
