/* ============================================================================
 * library-loader.js — SkyMotion Pro Library external loader (orchestration only)
 * ----------------------------------------------------------------------------
 * The ONLY script Webflow references. It contains NO product logic: it injects
 * CSS, injects the DOM template, and loads the runtime + enhancements in order.
 *
 * It never loads Memberstack (site-wide in Webflow) and never adds checkout,
 * billing, or any feature. All product behavior lives in the pinned assets.
 *
 * Every asset comes from ONE immutable release: the loader derives its base
 * from its own <script src> URL, so the commit pin lives only in the Webflow
 * snippet's loader URL (no hard-coded hash in this file).
 * For local testing, set window.SM_ASSET_BASE (e.g. "../") before this loads.
 * ============================================================================ */
(function () {
  "use strict";

  // Prevent double initialization (e.g. Webflow page transitions / double embed).
  if (window.__SM_LIBRARY_LOADER__) return;
  window.__SM_LIBRARY_LOADER__ = true;

  // --- Resolve the immutable asset base from this script's own URL ---------
  // Webflow references one pinned URL:
  //   https://cdn.jsdelivr.net/gh/SLASHOO/skymotion-library-pro@<commit>/webflow/library-loader.js
  // Stripping the trailing "webflow/library-loader.js" yields the repo-root base
  // at that exact commit, so CSS, template, runtime JS and enhancements all load
  // from the same release. Must be read NOW (document.currentScript is only valid
  // during this synchronous top-level execution).
  function selfSrc() {
    if (document.currentScript && document.currentScript.src) {
      return document.currentScript.src;
    }
    // Fallback: last <script> whose src ends with the loader path.
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (/webflow\/library-loader\.js(\?|#|$)/.test(scripts[i].src || "")) {
        return scripts[i].src;
      }
    }
    return "";
  }
  function deriveBase() {
    var src = selfSrc();
    var base = src.replace(/webflow\/library-loader\.js(\?.*)?(#.*)?$/, "");
    if (!base) console.error("[sm-loader] could not derive asset base from script src:", src);
    return base;
  }

  // window.SM_ASSET_BASE overrides (local smoke testing only); otherwise derive.
  var BASE = window.SM_ASSET_BASE || deriveBase();

  // --- Canonical asset lists (order is load-bearing) -----------------------
  // CSS: library-pro.css after the 10 split files; sm-skin.css LAST.
  var CSS = [
    "css/sm-tokens.css",
    "css/sm-layout.css",
    "css/sm-cards.css",
    "css/sm-filters.css",
    "css/sm-player-modal.css",
    "css/sm-responsive-mobile.css",
    "css/sm-filter-mobile.css",
    "css/sm-subscreens.css",
    "css/sm-desktop.css",
    "css/sm-pack-detail.css",
    "library-pro.css",
    "plan-viewer-v3.css",
    "css/sm-skin.css"
  ];

  // JS, loaded strictly in this order (runtime first, enhancements last).
  var JS_SEQUENCE = [
    "library-pro.js",
    "plan-viewer-v3.js",
    "webflow/library-enhancements.js"
  ];

  var TEMPLATE_URL = "webflow/library-template.html";
  var MOUNT_ID = "sm-library-pro";
  // Fixed overlays that must sit at <body> level (preserve current topology).
  var MOVE_TO_BODY = ["sm-plan-v3-root", "sm-pro-modal", "sm-pack-modal"];

  var API_BASE = window.SM_API_BASE || "https://skymotion.onrender.com";
  var CSS_REVEAL_MAX_MS = 12000; // hard cap: never keep the page hidden if a stylesheet hangs

  // --- 0. First-visit hints (cold device: nothing cached, no warm connections).
  //  * until every stylesheet has loaded the Library is HIDDEN behind a dark
  //    placeholder + spinner (class sm-boot-pending on <html>), so the user
  //    never sees unstyled / half-built markup — the page appears finished;
  //  * early TCP/TLS to the API + media CDN;
  //  * wake the API (Render may be asleep after idle; the first real call
  //    would otherwise wait on the cold start);
  //  * download the runtime scripts in parallel with the CSS/template instead
  //    of one-after-another after the template.
  function earlyHints() {
    var m = "#" + MOUNT_ID;
    var pending = "html.sm-boot-pending ";
    var st = document.createElement("style");
    st.textContent =
      pending + m + "{min-height:100vh;background:#121212}" +
      pending + m + ">*," +
      pending + "#sm-plan-v3-root," + pending + "#sm-pro-modal," + pending + "#sm-pack-modal{visibility:hidden!important}" +
      pending + m + "::after{content:'';display:block;position:fixed;top:calc(50% - 14px);left:calc(50% - 14px);" +
      "width:28px;height:28px;border-radius:50%;" +
      "border:3px solid rgba(255,255,255,.16);border-top-color:rgba(255,255,255,.85);" +
      "animation:sm-boot-spin .8s linear infinite}" +
      "@keyframes sm-boot-spin{to{transform:rotate(360deg)}}";
    document.head.appendChild(st);
    document.documentElement.classList.add("sm-boot-pending");

    [API_BASE, "https://skymotion-cdn.b-cdn.net"].forEach(function (origin) {
      var l = document.createElement("link");
      l.rel = "preconnect";
      l.href = origin;
      l.crossOrigin = "anonymous";
      document.head.appendChild(l);
    });
    try {
      fetch(API_BASE + "/", { mode: "no-cors", cache: "no-store" }).catch(function () {});
    } catch (_) {}

    JS_SEQUENCE.forEach(function (path) {
      var l = document.createElement("link");
      l.rel = "preload";
      l.as = "script";
      l.href = BASE + path;
      document.head.appendChild(l);
    });
  }

  // --- 1. CSS, injected into <head> in canonical order, as early as possible.
  // Returns a promise that settles when every stylesheet has loaded (or failed),
  // or after CSS_REVEAL_MAX_MS. It does NOT delay the template/script work; it
  // only controls when the hidden Library is revealed.
  function injectCss() {
    var waits = [];
    for (var i = 0; i < CSS.length; i++) {
      (function (href) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        waits.push(new Promise(function (resolve) {
          link.onload = link.onerror = function () { resolve(); };
        }));
        link.href = href;
        document.head.appendChild(link);
      })(BASE + CSS[i]);
    }
    return Promise.race([
      Promise.all(waits),
      new Promise(function (resolve) { setTimeout(resolve, CSS_REVEAL_MAX_MS); })
    ]);
  }

  // --- 2. Fetch the DOM template (starts immediately, in parallel with CSS).
  function fetchTemplate() {
    var p = fetch(BASE + TEMPLATE_URL).then(function (r) {
      if (!r.ok) throw new Error("template HTTP " + r.status);
      return r.text();
    });
    p.catch(function () {}); // reported by boot(); avoids an early unhandled-rejection warning
    return p;
  }

  // --- 3. Inject the DOM template; relocate fixed overlays to <body>.
  function injectTemplate(html) {
    var mount = document.getElementById(MOUNT_ID);
    if (!mount) {
      console.error("[sm-loader] mount #" + MOUNT_ID + " not found; aborting.");
      return Promise.reject(new Error("mount-not-found"));
    }
    return Promise.resolve(html)
      .then(function (html) {
        // <template> parses HTML (incl. SVG + <style>) inertly and correctly.
        var holder = document.createElement("template");
        holder.innerHTML = html;
        var frag = holder.content;

        // Move fixed overlays to <body> (Plan Viewer + paywall modals).
        for (var i = 0; i < MOVE_TO_BODY.length; i++) {
          var overlay = frag.getElementById
            ? frag.getElementById(MOVE_TO_BODY[i])
            : frag.querySelector("#" + MOVE_TO_BODY[i]);
          if (overlay) document.body.appendChild(overlay);
        }
        // Everything else (logo symbol, #sm-library-scope, feedback widget) → mount.
        while (frag.firstChild) mount.appendChild(frag.firstChild);
      });
  }

  // --- 4-6. Load scripts sequentially, preserving order (async=false + onload).
  function loadScriptsSequentially(list) {
    var index = 0;
    function next() {
      if (index >= list.length) return;
      var s = document.createElement("script");
      s.src = BASE + list[index];
      s.async = false; // preserve execution order
      s.onload = function () { index++; next(); };
      s.onerror = function () {
        console.error("[sm-loader] failed to load " + s.src);
      };
      document.head.appendChild(s);
    }
    next();
  }

  // Everything network-bound starts NOW (CSS, template, script preloads, API
  // wake-up) and runs in parallel. The template is inserted as soon as it and
  // the DOM are ready — but stays hidden until the styles are in, so the first
  // thing the user sees is the finished layout.
  earlyHints();
  var cssReady = injectCss();
  var templateReady = fetchTemplate();
  var domReady = new Promise(function (resolve) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { resolve(); });
    } else {
      resolve();
    }
  });

  var revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    document.documentElement.classList.remove("sm-boot-pending");
  }
  cssReady.then(function () {
    // One frame so the just-applied styles are painted before the reveal; the
    // timer covers background tabs, where rAF is paused.
    requestAnimationFrame(reveal);
    setTimeout(reveal, 120);
  });

  Promise.all([templateReady, domReady])
    .then(function (r) { return injectTemplate(r[0]); })
    .then(function () { loadScriptsSequentially(JS_SEQUENCE); })
    .catch(function (e) {
      reveal();
      console.error("[sm-loader] boot failed:", e);
    });
})();
