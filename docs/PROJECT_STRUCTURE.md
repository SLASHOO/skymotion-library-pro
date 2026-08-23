# PROJECT STRUCTURE — SkyMotion working baseline

How the repo is organized, who owns what, and how a change reaches production.
See `AGENTS.md` for the hard edit rules.

## Model: source → build → deployment outputs → jsDelivr → Webflow

```
src/        (EDIT HERE)            build/  →  deployment outputs (DO NOT hand-edit)
  home/                                       webflow/home.css|js|home-template.html
  library/                                    webflow/library-template.html
                                              webflow/library-enhancements.js
                                              library-pro.css|js, plan-viewer-v3.css|js
                                              css/*.css
```

The Webflow pages load a single pinned `*-loader.js` from GitHub via jsDelivr;
the loader fetches the deployment outputs from one immutable commit. BunnyCDN
serves media + the data index; Render serves the API; Memberstack is site-wide.

## Folder ownership

| Path | Owner / purpose | Editable? |
|---|---|---|
| `src/home/` | Home (landing) source: `home.html`, `home.css`, `home.js` | ✅ edit |
| `src/library/` | Pro Library source: `library.html`, `enhancements.js`, `library.js`, `library.css`, `plan-viewer.*`, `css/*`, `config.js`, `data/` | ✅ edit |
| `build/` | `src/` → output pipeline (`build.mjs`, `build-home.mjs`, `build-library.mjs`) | ✅ pipeline only |
| `webflow/home.*`, `webflow/home-template.html` | **generated** Home outputs | ❌ generated |
| `webflow/library-template.html`, `webflow/library-enhancements.js` | **generated** Library outputs | ❌ generated |
| `library-pro.*`, `plan-viewer-v3.*`, `css/*` (root) | **generated** Library runtime/styles | ❌ generated |
| `webflow/*-loader.js`, `webflow/WEBFLOW_*_SNIPPET.html` | infrastructure (loaders + paste snippets) | 🔒 approval only |
| `webflow/*smoke-test.html` | local smoke tests (validate outputs) | ✅ tests |
| `reference/webflow-auth/` | mirrors of Webflow login/signup embeds | 📎 reference |
| `reference/free-library/` | mirror of the separate Free Library page | 📎 reference |
| `archive/legacy-sources/` | retired monoliths (`index.html`, `landing.html`) | 🗄 archive |
| `archive/staging-handoff/` | superseded Webflow handoff/staging docs | 🗄 archive |
| `archive/prototypes/` | old standalone concepts | 🗄 archive |
| `docs/` | this file + `code-map/` historical audits | 📖 docs |

> `archive/legacy-sources/index.html` and `landing.html` are the **historical**
> monoliths. They are no longer the edit surface — `src/` is. They are kept for
> provenance only.

## Build mapping
`build/README.md` has the exact `src → output` table. Summary:
- `src/home/{home.css,home.js,home.html}` → `webflow/home.{css,js}` + `webflow/home-template.html`
- `src/library/library.html` → `webflow/library-template.html`
- `src/library/enhancements.js` → `webflow/library-enhancements.js`
- `src/library/{library,plan-viewer}.{css,js}` → root `library-pro.*` / `plan-viewer-v3.*`
- `src/library/css/*.css` → root `css/*.css`

The build is a deterministic byte copy: building an unchanged `src/` yields a
**zero git diff**.

## Test data note
`library-data-pro.json` at the **repository root** is the current smoke-test data
file (read by `webflow/smoke-test.html` via `../library-data-pro.json`).
`src/library/data/library-data-pro.json` is a **reference copy and is not yet
synced by the build** — do not assume editing it affects the smoke test. (Live
data comes from the BunnyCDN index, not from either file.)

## Release workflow
1. Edit under `src/`.
2. `node build/build.mjs`.
3. Smoke test (`webflow/home-smoke-test.html` and/or `webflow/smoke-test.html`).
4. Commit + push to the working branch.
5. **Release (deliberate):** bump the commit pin in the Webflow page snippet
   (`WEBFLOW_HOME_SNIPPET.html` / `WEBFLOW_LIBRARY_SNIPPET.html`) to the new
   commit. Routine commits change no pin; live stays on its current pin until a
   release.

## Live pins (current)
- Pro Library loader → `@62213da…`
- Home loader → `@30db914…` (landing copy refresh)

These are immutable jsDelivr commit pins; repo reorganization never affects live
until a pin is intentionally bumped.
