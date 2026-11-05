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

  function focusWithoutScrolling(element) {
    try {
      element.focus({ preventScroll: true });
    } catch (_) {
      element.focus();
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
    function menuItems(popover) {
      return Array.prototype.slice.call(popover.querySelectorAll('[role="menuitemradio"]'));
    }

    function closeThemeMenu(menu, restoreFocus) {
      var button = menu.querySelector("[data-theme-menu-button]");
      var popover = menu.querySelector("[data-theme-popover]");
      if (!button || !popover) { return; }

      button.setAttribute("aria-expanded", "false");
      popover.hidden = true;
      if (restoreFocus) { focusWithoutScrolling(button); }
    }

    function closeThemeMenus(exceptMenu) {
      document.querySelectorAll("[data-theme-menu]").forEach(function (menu) {
        if (menu === exceptMenu) { return; }
        closeThemeMenu(menu, false);
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

        if (shouldOpen) {
          var items = menuItems(popover);
          var selectedItem = popover.querySelector('[aria-checked="true"]');
          window.requestAnimationFrame(function () {
            if (selectedItem) {
              focusWithoutScrolling(selectedItem);
            } else if (items.length) {
              focusWithoutScrolling(items[0]);
            }
          });
        }
      });

      popover.addEventListener("keydown", function (event) {
        var items = menuItems(popover);
        var currentIndex = items.indexOf(document.activeElement);
        var nextIndex;

        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          closeThemeMenu(menu, true);
          return;
        }

        if ((event.key === "Enter" || event.key === " ") && currentIndex >= 0) {
          event.preventDefault();
          items[currentIndex].click();
          return;
        }

        if (event.key === "Tab") {
          window.setTimeout(function () { closeThemeMenu(menu, false); }, 0);
          return;
        }

        if (event.key === "ArrowDown") {
          nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
        } else if (event.key === "ArrowUp") {
          nextIndex = currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length;
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = items.length - 1;
        } else {
          return;
        }

        event.preventDefault();
        if (items[nextIndex]) { focusWithoutScrolling(items[nextIndex]); }
      });
    });

    document.addEventListener("click", function (event) {
      if (event.target.closest("[data-theme-menu]")) { return; }
      closeThemeMenus();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") { return; }
      var openMenu = document.querySelector('[data-theme-menu-button][aria-expanded="true"]');
      if (!openMenu) { return; }

      event.preventDefault();
      var menu = openMenu.closest("[data-theme-menu]");
      if (menu) { closeThemeMenu(menu, true); }
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
            focusWithoutScrolling(button);
          }
        }
      });
    });
  }

  function bindAppearanceControls() {
    applyTheme(currentTheme(), { dispatch: false });
    bindThemeMenus();
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
      var lastPlayheadTime = -1;
      var stalledTicks = 0;
      var isDeactivated = video.hasAttribute("data-loop-inactive");
      var isHydrated = false;
      var isNearViewport = false;
      var isInPlaybackRange = false;
      var restartWhenReady = false;

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

      function preferredVideoSource() {
        return preferredAsset(video.dataset.lightSrc, video.dataset.darkSrc);
      }

      function applyPreferredPoster() {
        var preferredPoster = preferredAsset(video.dataset.lightPoster, video.dataset.darkPoster);

        if (preferredPoster && video.getAttribute("poster") !== preferredPoster) {
          video.setAttribute("poster", preferredPoster);
        }
      }

      function setVisible(isVisible) {
        video.classList.toggle("is-loop-visible", isVisible);
      }

      function seekToLoopStart(forceSeek) {
        if (!forceSeek && loopStartSeconds <= 0) { return; }

        if (video.readyState < 1) {
          restartWhenReady = true;
          return;
        }

        restartWhenReady = false;
        try {
          video.currentTime = loopStartSeconds;
        } catch (_) {
          restartWhenReady = true;
        }
      }

      function hydratePreferredVideoAsset(forceReload) {
        var source = video.querySelector("source");
        var preferredSource = preferredVideoSource();
        var currentSource = source ? source.getAttribute("src") : video.getAttribute("src");
        var sourceChanged = currentSource !== preferredSource;

        if (!preferredSource || reduceMotionQuery.matches || isDeactivated) { return; }
        if (source && sourceChanged) {
          source.setAttribute("src", preferredSource);
        } else if (!source && sourceChanged) {
          video.setAttribute("src", preferredSource);
        }

        if (!isHydrated || sourceChanged || forceReload) {
          isHydrated = true;
          setVisible(false);
          video.load();
          seekToLoopStart(restartWhenReady);
        }
      }

      function tryPlay() {
        if (isDeactivated || !isHydrated || !isInPlaybackRange || document.hidden || reduceMotionQuery.matches) { return; }

        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {
            // Autoplay was blocked; the still frame stays visible and the
            // watchdog retries later.
            setVisible(false);
          });
        }
      }

      function handleReducedMotionChange() {
        if (reduceMotionQuery.matches) {
          video.pause();
          setVisible(false);
          return;
        }

        if (isNearViewport && !isDeactivated) {
          hydratePreferredVideoAsset(false);
        }
        tryPlay();
      }

      // Fade the video in only while frames are actually advancing. Every
      // stopped state reveals the still-frame fallback underneath.
      video.addEventListener("loadedmetadata", function () {
        if (restartWhenReady) { seekToLoopStart(true); }
        tryPlay();
      });

      video.addEventListener("canplay", tryPlay);

      video.addEventListener("playing", function () {
        if (isDeactivated || !isInPlaybackRange || document.hidden || reduceMotionQuery.matches) {
          video.pause();
          setVisible(false);
          return;
        }

        setVisible(true);
      });
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
        // a hydrated video reloads only when it is close enough to be useful.
        setVisible(false);
        applyPreferredPoster();
        video.pause();
        isHydrated = false;

        if (isNearViewport && !isDeactivated && !reduceMotionQuery.matches) {
          hydratePreferredVideoAsset(true);
          seekToLoopStart(true);
          tryPlay();
        }
      });

      // Videos stacked behind another demo in the same phone frame are marked
      // data-loop-inactive; every play path above refuses while the flag is
      // set, so the watchdog cannot resurrect a deliberately paused demo.
      // bindCalculatorModeSwitcher drives the flag via these events.
      video.addEventListener("agelyloopactivate", function () {
        isDeactivated = false;
        video.removeAttribute("data-loop-inactive");
        // Restart from the top: a demo resumed mid-workflow reads as broken.
        restartWhenReady = true;
        if (isNearViewport || isInPlaybackRange) {
          hydratePreferredVideoAsset(false);
        }
        seekToLoopStart(true);
        tryPlay();
      });

      video.addEventListener("agelyloopdeactivate", function () {
        isDeactivated = true;
        video.setAttribute("data-loop-inactive", "");
        video.pause();
        setVisible(false);
      });

      document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
          video.pause();
          setVisible(false);
        } else {
          tryPlay();
        }
      });

      if (reduceMotionQuery.addEventListener) {
        reduceMotionQuery.addEventListener("change", handleReducedMotionChange);
      } else if (reduceMotionQuery.addListener) {
        reduceMotionQuery.addListener(handleReducedMotionChange);
      }

      // Watchdog: if the playhead stops advancing while the loop should be
      // running, nudge play(); after repeated stalled checks, reload the file.
      window.setInterval(function () {
        if (isDeactivated || !isHydrated || !isInPlaybackRange || document.hidden || reduceMotionQuery.matches) { return; }

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
          hydratePreferredVideoAsset(true);
          seekToLoopStart();
        }
        tryPlay();
      }, 4000);

      applyPreferredPoster();

      if ("IntersectionObserver" in window) {
        var hydrationObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            isNearViewport = entry.isIntersecting;
            if (isNearViewport && !isDeactivated) {
              hydratePreferredVideoAsset(false);
            }
          });
        }, {
          rootMargin: "320px 0px",
          threshold: 0.01
        });

        var playbackObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            isInPlaybackRange = entry.isIntersecting && entry.intersectionRatio >= 0.35;

            if (isInPlaybackRange) {
              isNearViewport = true;
              hydratePreferredVideoAsset(false);
              tryPlay();
            } else {
              video.pause();
              setVisible(false);
            }
          });
        }, {
          threshold: [0, 0.35]
        });

        hydrationObserver.observe(video);
        playbackObserver.observe(video);
      } else {
        isNearViewport = true;
        isInPlaybackRange = true;
        hydratePreferredVideoAsset(false);
        tryPlay();
      }
    });
  }

  /*
   * The calculator section pairs two selectable story cards with two demo
   * recordings stacked in one phone frame. The switcher owns card and layer
   * state (aria-pressed, .is-selected, .is-active); playback stays inside
   * bindControlledVideoLoops, reached only via the agelyloop* events.
   */
  function bindCalculatorModeSwitcher() {
    var section = document.getElementById("calculator");
    if (!section) { return; }

    var buttons = Array.prototype.slice.call(section.querySelectorAll("[data-calculator-mode]"));
    var layers = Array.prototype.slice.call(section.querySelectorAll("[data-calculator-demo]"));
    var media = section.querySelector("[data-calculator-media]");
    if (!buttons.length || !layers.length) { return; }

    buttons.forEach(function (button) {
      button.removeAttribute("hidden");
    });

    function activateMode(mode) {
      buttons.forEach(function (button) {
        var isSelected = button.dataset.calculatorMode === mode;
        button.setAttribute("aria-pressed", String(isSelected));

        var card = button.closest(".calculator-mode-card");
        if (card) { card.classList.toggle("is-selected", isSelected); }
      });

      if (media) {
        media.classList.toggle("is-age-mode", mode === "age");
      }

      // Stop the outgoing recording before revealing and restarting the
      // incoming one, so two hidden demos never compete for playback.
      layers.forEach(function (layer) {
        var isActive = layer.dataset.calculatorDemo === mode;
        if (isActive) { return; }

        layer.classList.remove("is-active");
        var video = layer.querySelector("video[data-controlled-loop]");
        if (video) {
          video.dispatchEvent(new CustomEvent("agelyloopdeactivate"));
        }
      });

      layers.forEach(function (layer) {
        var isActive = layer.dataset.calculatorDemo === mode;
        if (!isActive) { return; }

        layer.classList.add("is-active");
        var video = layer.querySelector("video[data-controlled-loop]");
        if (video) {
          video.dispatchEvent(new CustomEvent("agelyloopactivate"));
        }
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        // Reselecting the current card would only restart its demo.
        if (button.getAttribute("aria-pressed") === "true") { return; }
        activateMode(button.dataset.calculatorMode);
      });
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
    // A skip link must move keyboard focus as well as the viewport.
    if (target.id === "main-content") { focusWithoutScrolling(target); }
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

  function bindContextualAvailability() {
    var header = document.querySelector("[data-contextual-availability]");
    if (!header) { return; }

    var sentinels = Array.prototype.slice.call(document.querySelectorAll("[data-availability-sentinel]"));
    if (!sentinels.length) {
      header.classList.add("is-availability-visible");
      return;
    }

    var updatePending = false;

    function isVisible(element) {
      var rect = element.getBoundingClientRect();
      return rect.bottom > header.offsetHeight && rect.top < window.innerHeight;
    }

    function updateAvailability() {
      updatePending = false;
      var hasVisiblePageControl = sentinels.some(isVisible);
      header.classList.toggle("is-availability-visible", !hasVisiblePageControl);
    }

    function requestUpdate() {
      if (updatePending) { return; }
      updatePending = true;
      window.requestAnimationFrame(updateAvailability);
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    updateAvailability();
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
    bindContextualAvailability();
    bindControlledVideoLoops();
    bindCalculatorModeSwitcher();
    initScrollAnimations();
  });
}());
