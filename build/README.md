# Build — source → deployment outputs

`src/` is the **only** place to edit. The build reproduces the current
deployment outputs at their **existing live paths** by pure byte copy (no
banners, no transforms). Loaders, snippets, and Webflow commit pins are never
touched by the build.

## Run
```
node build/build.mjs          # Home + Library
node build/build-home.mjs     # Home only
node build/build-library.mjs  # Library only
```

## What maps where
**Home** (`build-home.mjs`)
| edit | output (live path) |
|---|---|
| `src/home/home.css` | `webflow/home.css` |
| `src/home/home.js` | `webflow/home.js` |
| `src/home/home.html` | `webflow/home-template.html` |

**Library** (`build-library.mjs`)
| edit | output (live path) |
|---|---|
| `src/library/library.html` | `webflow/library-template.html` |
| `src/library/enhancements.js` | `webflow/library-enhancements.js` |
| `src/library/library.css` | `library-pro.css` |
| `src/library/library.js` | `library-pro.js` |
| `src/library/plan-viewer.css` | `plan-viewer-v3.css` |
| `src/library/plan-viewer.js` | `plan-viewer-v3.js` |
| `src/library/css/*.css` (11) | `css/*.css` |

**Not built / not in src deployment scope:** `webflow/*-loader.js`,
`WEBFLOW_*_SNIPPET.html` (hand-written infra), `src/library/config.js` and
`src/library/data/` (dev/reference only — live config lives in the Webflow
snippet, live data comes from BunnyCDN).

## Rules
- **Never hand-edit the output paths** — they are overwritten by the build.
  Edit `src/`, then run the build.
- The build is a deterministic byte copy: running it on an unchanged `src/`
  produces **zero git diff**.

## Release workflow
1. Edit files under `src/`.
2. `node build/build.mjs`.
3. Run the smoke tests (`webflow/home-smoke-test.html`, `webflow/smoke-test.html`).
4. Commit + push (`webflow-transfer`).
5. **Only when releasing:** bump the commit pin in the Webflow page snippet
   (`WEBFLOW_HOME_SNIPPET.html` / `WEBFLOW_LIBRARY_SNIPPET.html`) to the new
   commit. Routine commits do **not** change pins; live stays on its current pin
   until you choose to release.
