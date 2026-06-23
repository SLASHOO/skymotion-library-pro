# SkyMotion

Web product for beginner drone pilots — choose drone moves, shot plans, and
camera settings before/during a flight. Two surfaces: the **Home** landing page
and the gated **Pro Library**. Both are vanilla HTML/CSS/JS, loaded into Webflow
pages from GitHub via jsDelivr. Auth is Memberstack (site-wide), media + data
index are on BunnyCDN, the API is FastAPI on Render.

> **Read `AGENTS.md` before editing anything.** It defines the hard edit
> boundaries. This file is the orientation; `docs/PROJECT_STRUCTURE.md` has the
> full folder ownership + release workflow; `build/README.md` has the build map.

## `src/` is the only editable product source
- **Home work →** `src/home/` (`home.html`, `home.css`, `home.js`)
- **Pro Library work →** `src/library/` (`library.html`, `enhancements.js`,
  `library.js`, `library.css`, `plan-viewer.*`, `css/*`)

Everything the live site serves is **generated from `src/`** by the build, or is
**infrastructure**. Do not hand-edit those (see below).

## Build & test
```
node build/build.mjs        # Home + Library  (or build-home.mjs / build-library.mjs)
```
Then smoke-test the outputs in a browser (serve the repo root over HTTP):
- Home → `webflow/home-smoke-test.html`
- Library → `webflow/smoke-test.html`

The build is a deterministic byte copy: building an unchanged `src/` produces a
**zero git diff**. Workflow: **edit `src/` → build → smoke test → commit**.

## Do not hand-edit (generated outputs & infrastructure)
- **Generated outputs** (overwritten by the build): `webflow/home.css`,
  `webflow/home.js`, `webflow/home-template.html`,
  `webflow/library-template.html`, `webflow/library-enhancements.js`, and the
  root runtime/styles `library-pro.css`, `library-pro.js`, `plan-viewer-v3.css`,
  `plan-viewer-v3.js`, `css/*.css`. Edit the matching file under `src/` instead.
- **Infrastructure (approval-gated):** `webflow/*-loader.js`,
  `webflow/WEBFLOW_*_SNIPPET.html`, the jsDelivr commit pins, and anything in
  Webflow, BunnyCDN, Memberstack, or Render. A change goes live only when the
  maintainer deliberately bumps the commit pin in a Webflow snippet.

## Repository layout
- `src/` — the only editable product source (`home/`, `library/`, `shared` config/data).
- `build/` — zero-dependency Node pipeline (`src/` → output paths). See `build/README.md`.
- `webflow/` — live deployment outputs, the loaders, the Webflow paste snippets,
  and the local smoke tests.
- `css/`, `library-pro.*`, `plan-viewer-v3.*` (root) — **generated** Library
  runtime/styles (outputs of the build).
- `reference/` — non-production mirrors: `webflow-auth/` (login/signup embeds) and
  `free-library/` (the separate Free Library page).
- `archive/` — historical material: `legacy-sources/` (retired `index.html`,
  `landing.html`), `staging-handoff/` (old Webflow handoff docs), `prototypes/`.
- `docs/` — `PROJECT_STRUCTURE.md` (authoritative layout) + `code-map/` (historical audits).

## Key docs
- [`AGENTS.md`](AGENTS.md) — edit boundaries (read first).
- [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md) — folder ownership, build map, release workflow, live pins.
- [`build/README.md`](build/README.md) — exact `src → output` mapping.
- [`CLAUDE.md`](CLAUDE.md) — product context and design rules.
