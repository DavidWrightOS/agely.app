(function () {
  "use strict";

  document.documentElement.classList.add("js");

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
