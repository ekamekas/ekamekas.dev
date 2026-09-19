// Three-state theme control: no stored value means "follow the OS".
// The first paint is handled by the inline script in _partials/head.html;
// this file only wires the button and keeps the OS listener alive.
(function () {
  "use strict";
  var root = document.documentElement;
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;

  var mql = window.matchMedia("(prefers-color-scheme: dark)");

  function current() {
    return root.dataset.theme || (mql.matches ? "dark" : "light");
  }

  function apply(mode) {
    root.dataset.theme = mode;
    try { localStorage.setItem("theme", mode); } catch (e) {}
    btn.setAttribute("aria-pressed", String(mode === "dark"));
  }

  btn.setAttribute("aria-pressed", String(current() === "dark"));
  btn.addEventListener("click", function () {
    apply(current() === "dark" ? "light" : "dark");
  });

  // Follow the OS only while the reader has not made an explicit choice.
  mql.addEventListener("change", function (e) {
    var stored = null;
    try { stored = localStorage.getItem("theme"); } catch (err) {}
    if (!stored) {
      delete root.dataset.theme;
      btn.setAttribute("aria-pressed", String(e.matches));
    }
  });
})();
