(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
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

      video.addEventListener("ended", completeCycle);

      if (reduceMotionQuery.matches) {
        seekToStart(function () {
          setVisible(true);
        });
        video.load();
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

      video.load();
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
    bindSamePageAnchors();
    bindControlledVideoLoops();
    initScrollAnimations();
  });
}());
