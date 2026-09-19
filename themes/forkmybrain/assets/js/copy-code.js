// Copy button on every highlighted code block.
// Chroma wraps each block as <div class="highlight"><pre class="chroma">...
(function () {
  "use strict";
  var COPY = "salin";
  var DONE = "tersalin";
  var FAIL = "gagal";

  document.querySelectorAll("div.highlight").forEach(function (block) {
    var pre = block.querySelector("pre");
    if (!pre) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-code";
    btn.textContent = COPY;
    btn.setAttribute("aria-label", "Salin kode");

    btn.addEventListener("click", function () {
      var code = pre.querySelector("code") || pre;
      var text = code.innerText.replace(/\n$/, "");
      var ok = function () {
        btn.textContent = DONE;
        btn.classList.add("is-done");
        setTimeout(function () {
          btn.textContent = COPY;
          btn.classList.remove("is-done");
        }, 1600);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(ok, function () {
          btn.textContent = FAIL;
        });
      } else {
        // http:// and file:// fall back to the legacy path.
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); ok(); } catch (e) { btn.textContent = FAIL; }
        document.body.removeChild(ta);
      }
    });

    block.appendChild(btn);
  });
})();
