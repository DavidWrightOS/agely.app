(function () {
  "use strict";

  document.documentElement.classList.add("js");


  function scrollToHashTarget(hash) {
    if (!hash || hash === "#") { return false; }
    var target;
    try {
      target = document.querySelector(hash);
    } catch (_) {
      return false;
    }
    if (!target) { return false; }
    target.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindSamePageAnchors);
  } else {
    bindSamePageAnchors();
  }

  function revealAll() {
    document.querySelectorAll(".animate-on-scroll").forEach(function (element) {
      element.classList.add("is-visible");
    });
  }

  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", revealAll);
    } else {
      revealAll();
    }
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

  function init() {
    document.querySelectorAll(".animate-on-scroll").forEach(function (element) {
      observer.observe(element);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
