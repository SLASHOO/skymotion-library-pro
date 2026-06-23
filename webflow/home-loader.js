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

  // --- 1. CSS, injected into <head> as early as possible -------------------
  function injectCss() {
    for (var i = 0; i < CSS.length; i++) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = BASE + CSS[i];
      document.head.appendChild(link);
    }
  }

  // --- 3. Fetch + inject the DOM template; relocate fixed elements to <body> -
  function injectTemplate() {
    var mount = document.getElementById(MOUNT_ID);
    if (!mount) {
      console.error("[sm-home-loader] mount #" + MOUNT_ID + " not found; aborting.");
      return Promise.reject(new Error("mount-not-found"));
    }
    return fetch(BASE + TEMPLATE_URL)
      .then(function (r) {
        if (!r.ok) throw new Error("template HTTP " + r.status);
        return r.text();
      })
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
      s.onerror = function () { console.error("[sm-home-loader] failed to load " + s.src); };
      document.head.appendChild(s);
    }
    next();
  }

  function boot() {
    injectTemplate()
      .then(function () { loadScriptsSequentially(JS_SEQUENCE); })
      .catch(function (e) { console.error("[sm-home-loader] boot failed:", e); });
  }

  injectCss();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
