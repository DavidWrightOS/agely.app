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

  function bindControlledVideoLoops() {
    document.querySelectorAll("video[data-controlled-loop]").forEach(function (video) {
      var fadeMs = 700;
      var loopStartSeconds = 0.5;
      var loopEndSeconds = 11.05;
      var firstFrameHoldMs = 0;
      var finalFrameHoldMs = 2000;
      var hiddenHoldMs = 1000;
      var timerId;
      var endWatcherId;
      var isCompletingCycle = false;
      var hasStarted = false;

      video.loop = false;
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

      function clearTimer() {
        if (!timerId) { return; }
        window.clearTimeout(timerId);
        timerId = null;
      }

      function clearEndWatcher() {
        if (!endWatcherId) { return; }
        window.cancelAnimationFrame(endWatcherId);
        endWatcherId = null;
      }

      function clearScheduledWork() {
        clearTimer();
        clearEndWatcher();
      }

      function segmentEndSeconds() {
        if (!Number.isFinite(video.duration)) {
          return loopEndSeconds;
        }

        return Math.min(loopEndSeconds, Math.max(loopStartSeconds + 1, video.duration - 0.08));
      }

      function setVisible(isVisible) {
        video.classList.toggle("is-loop-visible", isVisible);
      }

      function afterFirstFrameLoaded(callback) {
        if (video.readyState >= 2) {
          callback();
          return;
        }

        video.addEventListener("loadeddata", callback, { once: true });
      }

      function seekToStart(callback) {
        video.pause();

        afterFirstFrameLoaded(function () {
          if (Math.abs(video.currentTime - loopStartSeconds) < 0.05) {
            callback();
            return;
          }

          video.addEventListener("seeked", callback, { once: true });
          video.currentTime = loopStartSeconds;
        });
      }

      function watchForSegmentEnd() {
        if (video.currentTime >= segmentEndSeconds() || video.ended) {
          completeCycle();
          return;
        }

        endWatcherId = window.requestAnimationFrame(watchForSegmentEnd);
      }

      function playVideo() {
        var playPromise = video.play();
        clearEndWatcher();
        endWatcherId = window.requestAnimationFrame(watchForSegmentEnd);
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {
            clearEndWatcher();
            // Keep the first frame visible if the browser blocks autoplay.
          });
        }
      }

      function startCycle() {
        clearScheduledWork();
        isCompletingCycle = false;
        seekToStart(function () {
          setVisible(true);
          timerId = window.setTimeout(playVideo, fadeMs + firstFrameHoldMs);
        });
      }

      function completeCycle() {
        if (isCompletingCycle) { return; }
        isCompletingCycle = true;
        clearScheduledWork();
        video.pause();
        timerId = window.setTimeout(function () {
          setVisible(false);
          timerId = window.setTimeout(startCycle, fadeMs + hiddenHoldMs);
        }, finalFrameHoldMs);
      }

      function handleColorSchemeChange() {
        clearScheduledWork();
        isCompletingCycle = false;
        video.pause();
        setVisible(false);
        applyPreferredVideoAsset();
        video.load();

        if (reduceMotionQuery.matches) {
          seekToStart(function () {
            setVisible(true);
          });
          return;
        }

        if (hasStarted) {
          startCycle();
        }
      }

      applyPreferredVideoAsset();
      video.addEventListener("ended", completeCycle);
      window.addEventListener("agelythemechange", handleColorSchemeChange);

      video.load();

      if (reduceMotionQuery.matches) {
        seekToStart(function () {
          setVisible(true);
        });
        return;
      }

      function beginWhenVisible() {
        if (hasStarted) { return; }
        hasStarted = true;
        startCycle();
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
