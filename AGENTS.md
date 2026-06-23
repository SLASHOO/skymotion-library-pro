# AGENTS.md — edit boundaries for SkyMotion

This repo separates **editable source** (`src/`) from **generated deployment
outputs** (served live via jsDelivr). Follow these rules exactly.

## Where to edit
- **Home work →** edit only `src/home/` (`home.html`, `home.css`, `home.js`).
- **Pro Library work →** edit only `src/library/` (`library.html`,
  `enhancements.js`, `library.js`, `library.css`, `plan-viewer.*`, `css/*`).
- `src/` is the **only** editable product source.

## Never hand-edit generated outputs
These are produced by the build and are overwritten on every run — do **not**
edit them directly:
- `webflow/home.css`, `webflow/home.js`, `webflow/home-template.html`
- `webflow/library-template.html`, `webflow/library-enhancements.js`
- root `library-pro.css`, `library-pro.js`, `plan-viewer-v3.css`,
  `plan-viewer-v3.js`, and `css/*.css`

If you need to change any of them, edit the matching file under `src/` and run
the build.

## Always, before every commit
1. `node build/build.mjs` (or `build-home.mjs` / `build-library.mjs`).
2. Run the relevant smoke test:
   - Home → `webflow/home-smoke-test.html`
   - Library → `webflow/smoke-test.html`
3. Confirm the build produced the intended diff (and **zero** diff when you only
   reorganized).

## Infrastructure — requires explicit approval
Do **not** modify these without the maintainer explicitly asking:
- Loaders: `webflow/home-loader.js`, `webflow/library-loader.js`
- Webflow snippets: `webflow/WEBFLOW_HOME_SNIPPET.html`,
  `webflow/WEBFLOW_LIBRARY_SNIPPET.html`
- jsDelivr commit pins, live URLs, and anything in Webflow, BunnyCDN,
  Memberstack, or Render.

## Releasing
Routine commits do **not** change the live pin. A change goes live only when the
maintainer bumps the commit pin in the Webflow page snippet. See
`docs/PROJECT_STRUCTURE.md`.

## Do not
- Redesign or refactor runtime behavior as part of unrelated work.
- Delete meaningful legacy source — archive it under `archive/` with clear names.
- Touch `archive/` or `reference/` contents except to add clearly-named items.
