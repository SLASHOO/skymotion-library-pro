/* ============================================================================
 * boot/library.js — SkyMotion Pro Library STABLE boot loader (Bunny-hosted)
 * ----------------------------------------------------------------------------
 * This is the ONE script Webflow references for the Library, forever:
 *
 *   <script src="https://skymotion-cdn.b-cdn.net/boot/library.js"></script>
 *
 * It is uploaded to Bunny ONCE and is meant to never change again. It contains
 * NO commit hash and NO product logic. Its only job:
 *
 *   1. Fetch the release manifest from Bunny:
 *        https://skymotion-cdn.b-cdn.net/boot/library-release.json
 *      { "release": "<40-char git commit>",
 *        "loader":  "https://cdn.jsdelivr.net/gh/SLASHOO/skymotion-library-pro@<commit>/webflow/library-loader.js" }
 *   2. Strictly validate the manifest (repo + path + full hash + consistency).
 *   3. Inject that immutable jsDelivr loader into <head>.
 *
 * Releasing a new Library version = updating the Bunny manifest only.
 * Webflow is never touched again. GitHub stays the source of truth; the pinned
 * jsDelivr loader derives every other asset URL from its own @commit src.
 *
 * This file MUST NOT change Library UI, access, the data URL, gating, or the
 * jsDelivr library-loader itself. It only orchestrates manifest -> loader.
 * ============================================================================ */
(function () {
  "use strict";

  // --- Single-init guard (Webflow page transitions / accidental double embed).
  if (window.__SM_LIBRARY_BOOT__) return;
  window.__SM_LIBRARY_BOOT__ = true;

  var MOUNT_ID = "sm-library-pro";

  // The manifest URL is fixed to Bunny. window.SM_BOOT_MANIFEST_URL exists ONLY
  // so local smoke tests can point at a local fixture (mirrors the existing
  // window.SM_ASSET_BASE convention in library-loader.js). Production never sets it.
  var MANIFEST_URL =
    window.SM_BOOT_MANIFEST_URL ||
    "https://skymotion-cdn.b-cdn.net/boot/library-release.json";

  // Exactly one repo + one loader path are ever allowed.
  var LOADER_RE =
    /^https:\/\/cdn\.jsdelivr\.net\/gh\/SLASHOO\/skymotion-library-pro@([0-9a-f]{40})\/webflow\/library-loader\.js$/;

  // --- Neutral failure state: never leave a blank mount / white screen. -------
  var _errorShown = false;
  function showError(reason) {
    // console.error always carries the concrete cause for debugging.
    console.error("[sm-boot] " + reason);
    if (_errorShown) return;
    _errorShown = true;

    function paint() {
      var mount = document.getElementById(MOUNT_ID);
      if (!mount) return; // mount missing entirely — nothing neutral to paint into.
      mount.setAttribute("data-sm-boot-error", "1");

      // Self-contained fallback: inline styles only, no dependency on Library CSS.
      // Dark full-viewport panel so the white Webflow background never shows; a
      // compact centered message. Never injects markup from the manifest (text only).
      mount.textContent = "";
      mount.style.cssText =
        "min-height:100vh;margin:0;display:flex;align-items:center;justify-content:center;" +
        "background:#121212;padding:24px;box-sizing:border-box;";
      var msg = document.createElement("div");
      msg.style.cssText =
        "max-width:320px;text-align:center;color:#e6e6e6;" +
        "font:15px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
      msg.textContent = "Library couldn't load. Please refresh.";
      mount.appendChild(msg);
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", paint);
    } else {
      paint();
    }
  }

  // --- Manifest validation: reject anything that is not our exact release. -----
  function validateManifest(m) {
    if (!m || typeof m !== "object") return "manifest is not an object";

    var release = m.release;
    if (typeof release !== "string" || !/^[0-9a-f]{40}$/.test(release)) {
      return "manifest.release is not a full 40-character git commit hash";
    }

    var loader = m.loader;
    if (typeof loader !== "string") return "manifest.loader is missing";
    var match = LOADER_RE.exec(loader);
    if (!match) {
      // Covers wrong host, wrong repo/owner, wrong path, non-https, bad hash.
      return "manifest.loader must be the jsDelivr SLASHOO/skymotion-library-pro " +
             "/webflow/library-loader.js URL at a full commit";
    }
    if (match[1] !== release) {
      return "manifest.loader commit does not match manifest.release";
    }
    return null; // valid
  }

  // --- Inject the immutable jsDelivr loader into <head>. -----------------------
  function injectLoader(loaderUrl) {
    var s = document.createElement("script");
    s.src = loaderUrl;
    // No async ordering concerns: this is the only script the boot loader adds.
    s.onerror = function () {
      showError("failed to load pinned loader: " + loaderUrl);
    };
    document.head.appendChild(s);
  }

  // --- Boot: fetch -> validate -> inject. -------------------------------------
  // cache:"no-store" so a new release (manifest purged on Bunny) is always seen
  // on the next page load, without depending on browser cache freshness.
  fetch(MANIFEST_URL, { cache: "no-store" })
    .then(function (r) {
      if (!r.ok) throw new Error("manifest HTTP " + r.status);
      return r.json();
    })
    .then(function (manifest) {
      var problem = validateManifest(manifest);
      if (problem) {
        showError("invalid manifest (" + MANIFEST_URL + "): " + problem);
        return;
      }
      injectLoader(manifest.loader);
    })
    .catch(function (e) {
      showError("could not load manifest (" + MANIFEST_URL + "): " + (e && e.message ? e.message : e));
    });
})();
