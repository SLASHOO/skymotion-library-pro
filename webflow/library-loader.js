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

  // --- 1. CSS, injected into <head> in canonical order, as early as possible.
  function injectCss() {
    for (var i = 0; i < CSS.length; i++) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = BASE + CSS[i];
      document.head.appendChild(link);
    }
  }

  // --- 3. Fetch + inject the DOM template; relocate fixed overlays to <body>.
  function injectTemplate() {
    var mount = document.getElementById(MOUNT_ID);
    if (!mount) {
      console.error("[sm-loader] mount #" + MOUNT_ID + " not found; aborting.");
      return Promise.reject(new Error("mount-not-found"));
    }
    return fetch(BASE + TEMPLATE_URL)
      .then(function (r) {
        if (!r.ok) throw new Error("template HTTP " + r.status);
        return r.text();
      })
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

  function boot() {
    injectTemplate()
      .then(function () { loadScriptsSequentially(JS_SEQUENCE); })
      .catch(function (e) { console.error("[sm-loader] boot failed:", e); });
  }

  // CSS first (head, immediate). DOM work waits for the mount to exist.
  injectCss();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
