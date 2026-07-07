(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  var themeStorageKey = "agely-theme";
  var allowedThemes = {
    system: true,
    light: true,
    dark: true
  };

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function normalizedTheme(value) {
    return allowedThemes[value] ? value : "system";
  }

  function systemTheme() {
    return colorSchemeQuery.matches ? "dark" : "light";
  }

  function currentTheme() {
    return normalizedTheme(document.documentElement.dataset.theme);
  }

  function currentResolvedTheme() {
    return document.documentElement.dataset.resolvedTheme || (currentTheme() === "system" ? systemTheme() : currentTheme());
  }

  function resolveTheme(theme) {
    return theme === "system" ? systemTheme() : theme;
  }

  function persistTheme(theme) {
    try {
      window.localStorage.setItem(themeStorageKey, theme);
    } catch (_) {
      // Private browsing or locked-down environments may reject storage.
    }
  }

  function updateThemePictures() {
    var theme = currentTheme();
    var media = "(prefers-color-scheme: dark)";

    if (theme === "dark") {
      media = "all";
    } else if (theme === "light") {
      media = "not all";
    }

    document.querySelectorAll("source[data-theme-dark-source]").forEach(function (source) {
      if (source.getAttribute("media") !== media) {
        source.setAttribute("media", media);
      }
    });
  }

  function syncThemeControls() {
    var theme = currentTheme();

    document.querySelectorAll("[data-theme-option]").forEach(function (control) {
      var isSelected = control.dataset.themeOption === theme;

      if (control.getAttribute("role") === "menuitemradio") {
        control.setAttribute("aria-checked", String(isSelected));
      } else {
        control.setAttribute("aria-pressed", String(isSelected));
      }
    });
  }

  function announceThemeChange(theme) {
    window.dispatchEvent(new CustomEvent("agelythemechange", {
      detail: {
        theme: theme,
        resolvedTheme: currentResolvedTheme()
      }
    }));
  }

  function applyTheme(theme, options) {
    var nextTheme = normalizedTheme(theme);

    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.dataset.resolvedTheme = resolveTheme(nextTheme);

    if (options && options.persist) {
      persistTheme(nextTheme);
    }

    syncThemeControls();
    updateThemePictures();

    if (!options || options.dispatch !== false) {
      announceThemeChange(nextTheme);
    }
  }

  function bindThemeMenus() {
    function closeThemeMenus(exceptMenu) {
      document.querySelectorAll("[data-theme-menu]").forEach(function (menu) {
        if (menu === exceptMenu) { return; }

        var button = menu.querySelector("[data-theme-menu-button]");
        var popover = menu.querySelector("[data-theme-popover]");
        if (!button || !popover) { return; }

        button.setAttribute("aria-expanded", "false");
        popover.hidden = true;
      });
    }

    document.querySelectorAll("[data-theme-menu]").forEach(function (menu) {
      var button = menu.querySelector("[data-theme-menu-button]");
      var popover = menu.querySelector("[data-theme-popover]");
      if (!button || !popover) { return; }

      button.addEventListener("click", function (event) {
        event.stopPropagation();
        var shouldOpen = popover.hidden;
        closeThemeMenus(menu);
        popover.hidden = !shouldOpen;
        button.setAttribute("aria-expanded", String(shouldOpen));
      });
    });

    document.addEventListener("click", function (event) {
      if (event.target.closest("[data-theme-menu]")) { return; }
      closeThemeMenus();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") { return; }
      closeThemeMenus();
    });
  }

  function bindCompactMenu() {
    var button = document.querySelector("[data-site-menu-toggle]");
    if (!button) { return; }

    var menu = document.getElementById(button.getAttribute("aria-controls"));
    if (!menu) { return; }

    function closeMenu() {
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
    }

    button.addEventListener("click", function (event) {
      event.stopPropagation();
      var shouldOpen = menu.hidden;
      menu.hidden = !shouldOpen;
      button.setAttribute("aria-expanded", String(shouldOpen));
    });

    document.addEventListener("click", function (event) {
      if (menu.hidden) { return; }
      if (event.target.closest("[data-site-menu]") || event.target.closest("[data-site-menu-toggle]")) { return; }
      closeMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") { return; }
      closeMenu();
    });
  }

  function bindThemeOptions() {
    document.querySelectorAll("[data-theme-option]").forEach(function (control) {
      control.addEventListener("click", function () {
        applyTheme(control.dataset.themeOption, { persist: true });

        var parentThemeMenu = control.closest("[data-theme-menu]");
        if (parentThemeMenu) {
          var button = parentThemeMenu.querySelector("[data-theme-menu-button]");
          var popover = parentThemeMenu.querySelector("[data-theme-popover]");
          if (button && popover) {
            button.setAttribute("aria-expanded", "false");
            popover.hidden = true;
          }
        }
      });
    });
  }

  function bindAppearanceControls() {
    applyTheme(currentTheme(), { dispatch: false });
    bindThemeMenus();
    bindCompactMenu();
    bindThemeOptions();

    function handleSystemThemeChange() {
      if (currentTheme() === "system") {
        applyTheme("system");
      }
    }

    if (colorSchemeQuery.addEventListener) {
      colorSchemeQuery.addEventListener("change", handleSystemThemeChange);
    } else if (colorSchemeQuery.addListener) {
      colorSchemeQuery.addListener(handleSystemThemeChange);
    }
  }

  /*
   * Continuous, self-recovering video loops.
   *
   * Design goals (shared by every marketing video on the site):
   * - The video plays as an uninterrupted native loop; there is no scripted
   *   fade-out phase, so the loop never intentionally goes blank.
   * - A still-frame <picture> is layered underneath each video in the HTML.
   *   The video only fades in while it is actually rendering frames, so any
   *   failure (stalled network, blocked autoplay, tab switch, theme swap)
   *   reveals the matching still frame instead of an empty panel.
   * - A watchdog nudges paused/stuck playback and, as a last resort, reloads
   *   the file, so a wedged video recovers without a page refresh.
   *
   * Per-video capture quirks are configured with data attributes rather than
   * code changes: data-loop-start / data-loop-end (seconds) trim dead frames
   * from either end of the file until the capture can be re-exported.
   */
  function bindControlledVideoLoops() {
    document.querySelectorAll("video[data-controlled-loop]").forEach(function (video) {
      var loopStartSeconds = parseFloat(video.dataset.loopStart || "0") || 0;
      var loopEndSeconds = parseFloat(video.dataset.loopEnd || "") || Infinity;
      var hasStarted = false;
      var lastPlayheadTime = -1;
      var stalledTicks = 0;

      video.loop = true;
      video.autoplay = false;
      video.muted = true;
      video.playsInline = true;

      function preferredAsset(lightValue, darkValue) {
        if (currentResolvedTheme() === "dark") {
          return darkValue || lightValue || "";
        }

        return lightValue || darkValue || "";
      }

      function applyPreferredVideoAsset() {
        var source = video.querySelector("source");
        var preferredSource = preferredAsset(video.dataset.lightSrc, video.dataset.darkSrc);
        var preferredPoster = preferredAsset(video.dataset.lightPoster, video.dataset.darkPoster);

        if (source && preferredSource && source.getAttribute("src") !== preferredSource) {
          source.setAttribute("src", preferredSource);
        } else if (!source && preferredSource && video.getAttribute("src") !== preferredSource) {
          video.setAttribute("src", preferredSource);
        }

        if (preferredPoster && video.getAttribute("poster") !== preferredPoster) {
          video.setAttribute("poster", preferredPoster);
        }
      }

      function setVisible(isVisible) {
        video.classList.toggle("is-loop-visible", isVisible);
      }

      function seekToLoopStart() {
        if (loopStartSeconds <= 0) { return; }

        function seek() {
          try {
            video.currentTime = loopStartSeconds;
          } catch (_) {
            // Seeking can throw while the element has no usable data; the
            // timeupdate handler below snaps playback into the window instead.
          }
        }

        if (video.readyState >= 1) {
          seek();
        } else {
          video.addEventListener("loadedmetadata", seek, { once: true });
        }
      }

      function tryPlay() {
        if (!hasStarted || document.hidden || reduceMotionQuery.matches) { return; }

        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {
            // Autoplay was blocked; the still frame stays visible and the
            // watchdog retries later.
            setVisible(false);
          });
        }
      }

      // Fade the video in only while frames are actually advancing. Every
      // stopped state reveals the still-frame fallback underneath.
      video.addEventListener("playing", function () { setVisible(true); });
      ["pause", "waiting", "stalled", "error", "emptied"].forEach(function (eventName) {
        video.addEventListener(eventName, function () { setVisible(false); });
      });

      // Keep the playhead inside the trimmed window. Native looping restarts
      // at 0:00, so snap back to the loop start whenever playback drifts out.
      video.addEventListener("timeupdate", function () {
        if (video.currentTime >= loopEndSeconds || video.currentTime < loopStartSeconds) {
          video.currentTime = loopStartSeconds;
        }
      });

      window.addEventListener("agelythemechange", function () {
        // The fallback <picture> swaps via its data-theme-dark-source rule;
        // the video needs an explicit reload onto the matching asset.
        setVisible(false);
        applyPreferredVideoAsset();
        video.load();
        seekToLoopStart();
        tryPlay();
      });

      document.addEventListener("visibilitychange", function () {
        if (!document.hidden) { tryPlay(); }
      });

      // Watchdog: if the playhead stops advancing while the loop should be
      // running, nudge play(); after repeated stalled checks, reload the file.
      window.setInterval(function () {
        if (!hasStarted || document.hidden || reduceMotionQuery.matches) { return; }

        var isAdvancing = !video.paused && video.currentTime !== lastPlayheadTime;
        lastPlayheadTime = video.currentTime;

        if (isAdvancing) {
          stalledTicks = 0;
          return;
        }

        stalledTicks += 1;

        // While the file is still downloading its first frames, reloading
        // would only restart the download, so wait much longer before
        // escalating; a wedged pipeline gets reloaded after three checks.
        var isStillDownloading = video.networkState === HTMLMediaElement.NETWORK_LOADING &&
          video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA;
        if (stalledTicks >= (isStillDownloading ? 8 : 3)) {
          stalledTicks = 0;
          applyPreferredVideoAsset();
          video.load();
          seekToLoopStart();
        }
        tryPlay();
      }, 4000);

      applyPreferredVideoAsset();
      video.load();
      seekToLoopStart();

      if (reduceMotionQuery.matches) {
        // Respect reduced motion: playback never starts, so the still-frame
        // fallback simply stays in place.
        return;
      }

      function beginWhenVisible() {
        if (hasStarted) { return; }
        hasStarted = true;
        tryPlay();
      }

      if ("IntersectionObserver" in window) {
        var videoObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) { return; }
            beginWhenVisible();
            videoObserver.unobserve(video);
          });
        }, {
          threshold: 0.35
        });

        videoObserver.observe(video);
      } else {
        beginWhenVisible();
      }
    });
  }

  function scrollToHashTarget(hash) {
    if (!hash || hash === "#") { return false; }
    var target;
    try {
      target = document.querySelector(hash);
    } catch (_) {
      return false;
    }
    if (!target) { return false; }
    target.scrollIntoView({ block: "start", behavior: reduceMotionQuery.matches ? "auto" : "smooth" });
    return true;
  }

  function bindSamePageAnchors() {
    document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach(function (link) {
      link.addEventListener("click", function (event) {
        var rawHref = link.getAttribute("href") || "";
        var hash = rawHref.charAt(0) === "/" ? rawHref.slice(1) : rawHref;
        if (!hash || hash === "#") { return; }
        if (scrollToHashTarget(hash)) {
          event.preventDefault();
          if (window.location.hash !== hash) {
            history.pushState(null, "", hash);
          }
        }
      });
    });
  }

  function revealAll() {
    document.querySelectorAll(".animate-on-scroll").forEach(function (element) {
      element.classList.add("is-visible");
    });
  }

  function initScrollAnimations() {
    if (!("IntersectionObserver" in window) || reduceMotionQuery.matches) {
      revealAll();
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.14,
      rootMargin: "0px 0px -48px 0px"
    });

    document.querySelectorAll(".animate-on-scroll").forEach(function (element) {
      observer.observe(element);
    });
  }

  onReady(function () {
    bindAppearanceControls();
    bindSamePageAnchors();
    bindControlledVideoLoops();
    initScrollAnimations();
  });
}());
