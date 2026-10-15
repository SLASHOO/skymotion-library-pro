/* ============================================================================
 * home-loader.js — SkyMotion Home (landing) external loader (orchestration only)
 * ----------------------------------------------------------------------------
 * The ONLY script Webflow's Home page references. It contains NO product logic:
 * it injects home.css, injects the DOM template, relocates fixed elements, and
 * loads home.js once. It never loads Memberstack and never touches Pro Library
 * assets or logic.
 *
 * Every asset comes from ONE immutable release: the loader derives its base from
 * its own <script src> URL, so the commit pin lives only in the Webflow snippet's
 * loader URL. For local testing, set window.SM_ASSET_BASE (e.g. "../") first.
 * ============================================================================ */
(function () {
  "use strict";

  // Prevent double initialization (Webflow page transitions / double embed).
  if (window.__SM_HOME_LOADER__) return;
  window.__SM_HOME_LOADER__ = true;

  // --- Webflow isolation scope (Home only) ---------------------------------
  // Mark <html> immediately and <body> as soon as it exists, so home.css's
  // scoped .sm-home-page rules can re-assert background/color/overflow over
  // Webflow's .body2/.body-2 (class selectors that otherwise win over `body`).
  // Runs only on Home (this loader loads nowhere else), so no other page is
  // affected. No layout/containing-block properties are touched here.
  document.documentElement.classList.add("sm-home-page");
  function tagBody() { if (document.body) document.body.classList.add("sm-home-page"); }
  tagBody();

  // --- Resolve the immutable asset base from this script's own URL ---------
  // Webflow references one pinned URL:
  //   https://cdn.jsdelivr.net/gh/SLASHOO/skymotion-library-pro@<commit>/webflow/home-loader.js
  // Stripping the trailing "webflow/home-loader.js" yields the repo-root base at
  // that exact commit, so home.css, the template and home.js all load from the
  // same release. Must be read NOW (document.currentScript is only valid during
  // this synchronous top-level execution).
  function selfSrc() {
    if (document.currentScript && document.currentScript.src) {
      return document.currentScript.src;
    }
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (/webflow\/home-loader\.js(\?|#|$)/.test(scripts[i].src || "")) {
        return scripts[i].src;
      }
    }
    return "";
  }
  function deriveBase() {
    var src = selfSrc();
    var base = src.replace(/webflow\/home-loader\.js(\?.*)?(#.*)?$/, "");
    if (!base) console.error("[sm-home-loader] could not derive asset base from script src:", src);
    return base;
  }

  // window.SM_ASSET_BASE overrides (local smoke testing only); otherwise derive.
  var BASE = window.SM_ASSET_BASE || deriveBase();

  var CSS = ["webflow/home.css"];
  var JS_SEQUENCE = ["webflow/home.js"];
  var TEMPLATE_URL = "webflow/home-template.html";
  var MOUNT_ID = "sm-home";
  // Fixed elements that must sit at <body> level (no transformed ancestor).
  var MOVE_TO_BODY = ["nav", "proModal", "contactModal"];

  var API_BASE = window.SM_API_BASE || "https://skymotion.onrender.com";
  var CSS_REVEAL_MAX_MS = 12000; // hard cap: never keep the page hidden if a stylesheet hangs

  // --- 0. First-visit hints (cold device: nothing cached) -------------------
  // Until home.css has loaded the Home is HIDDEN behind a dark placeholder +
  // spinner (class sm-boot-pending on <html>), so the unstyled markup never
  // flashes. Also: early connection to the API, a wake-up ping for the API (so
  // it is already awake when the visitor continues into the Library), and the
  // script downloading in parallel with the CSS/template.
  function earlyHints() {
    var m = "#" + MOUNT_ID;
    var pending = "html.sm-boot-pending ";
    var st = document.createElement("style");
    st.textContent =
      pending + m + "{min-height:100vh;background:#121212}" +
      pending + m + ">*," + pending + "#nav," + pending + "#proModal," + pending + "#contactModal{visibility:hidden!important}" +
      pending + m + "::after{content:'';display:block;position:fixed;top:calc(50% - 14px);left:calc(50% - 14px);" +
      "width:28px;height:28px;border-radius:50%;" +
      "border:3px solid rgba(255,255,255,.16);border-top-color:rgba(255,255,255,.85);" +
      "animation:sm-boot-spin .8s linear infinite}" +
      "@keyframes sm-boot-spin{to{transform:rotate(360deg)}}";
    document.head.appendChild(st);
    document.documentElement.classList.add("sm-boot-pending");

    var l = document.createElement("link");
    l.rel = "preconnect";
    l.href = API_BASE;
    l.crossOrigin = "anonymous";
    document.head.appendChild(l);
    try {
      fetch(API_BASE + "/", { mode: "no-cors", cache: "no-store" }).catch(function () {});
    } catch (_) {}

    JS_SEQUENCE.forEach(function (path) {
      var p = document.createElement("link");
      p.rel = "preload";
      p.as = "script";
      p.href = BASE + path;
      document.head.appendChild(p);
    });
  }

  // --- 1. CSS, injected into <head> as early as possible -------------------
  // Settles when the stylesheet has loaded (or failed), or after
  // CSS_REVEAL_MAX_MS. It does not delay the template/script work; it only
  // controls when the hidden Home is revealed.
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

  // --- 2. Fetch the DOM template (starts immediately, parallel to CSS) -------
  function fetchTemplate() {
    var p = fetch(BASE + TEMPLATE_URL).then(function (r) {
      if (!r.ok) throw new Error("template HTTP " + r.status);
      return r.text();
    });
    p.catch(function () {}); // reported by boot(); avoids an early unhandled-rejection warning
    return p;
  }

  // --- 3. Inject the DOM template; relocate fixed elements to <body> -------
  function injectTemplate(html) {
    var mount = document.getElementById(MOUNT_ID);
    if (!mount) {
      console.error("[sm-home-loader] mount #" + MOUNT_ID + " not found; aborting.");
      return Promise.reject(new Error("mount-not-found"));
    }
    // Tag the single Webflow wrapper around the mount so home.css can keep it
    // full-width without a global .w-* reset.
    if (mount.parentElement) mount.parentElement.classList.add("sm-home-host");
    return Promise.resolve(html)
      .then(function (html) {
        var holder = document.createElement("template");
        holder.innerHTML = html; // inert parse (handles SVG + <style>)
        var frag = holder.content;

        for (var i = 0; i < MOVE_TO_BODY.length; i++) {
          var fixed = frag.getElementById
            ? frag.getElementById(MOVE_TO_BODY[i])
            : frag.querySelector("#" + MOVE_TO_BODY[i]);
          if (fixed) document.body.appendChild(fixed);
        }
        while (frag.firstChild) mount.appendChild(frag.firstChild);
      });
  }

  // --- 4. Load JS once, in order (async=false + onload) --------------------
  function loadScriptsSequentially(list) {
    var index = 0;
    function next() {
      if (index >= list.length) return;
      var s = document.createElement("script");
      s.src = BASE + list[index];
      s.async = false;
      s.onload = function () { index++; next(); };
      s.onerror = function () {
        console.error("[sm-home-loader] failed to load " + s.src);
        revealAll(); // script failed: never leave scroll-reveal sections invisible
      };
      document.head.appendChild(s);
    }
    next();
  }

  // home.css hides .r sections until home.js reveals them on scroll. If the
  // script cannot run, show them anyway so the page is never a column of gaps.
  function revealAll() {
    var els = document.querySelectorAll(".r");
    for (var i = 0; i < els.length; i++) els[i].classList.add("in");
  }

  // Everything network-bound starts NOW and runs in parallel. The template is
  // inserted as soon as it and the DOM are ready, but stays hidden until the
  // stylesheet is in.
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
    .then(function (r) { tagBody(); return injectTemplate(r[0]); })
    .then(function () { loadScriptsSequentially(JS_SEQUENCE); })
    .catch(function (e) {
      reveal();
      console.error("[sm-home-loader] boot failed:", e);
    });
})();
