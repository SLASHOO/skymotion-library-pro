# SkyMotion — Pro Library

Gated Free/Pro drone-move library. Vanilla HTML/CSS/JS embed (no React/Tailwind/build
system) designed to be pasted into a Webflow page. Auth via Memberstack, media via
BunnyCDN, data/access via a FastAPI backend on Render.

See `CLAUDE.md` for product context and development rules.

---

## Production entry files

`index.html` is the entry shell: DOM skeleton, the `window.SM_*` config block, the
Free/Pro gating injector, and the inline enhancement scripts. It loads the following.

**CSS — load order matters (`sm-skin.css` LAST):**

1. `css/sm-tokens.css`
2. `css/sm-layout.css`
3. `css/sm-cards.css`
4. `css/sm-filters.css`
5. `css/sm-player-modal.css`
6. `css/sm-responsive-mobile.css`
7. `css/sm-filter-mobile.css`
8. `css/sm-subscreens.css`
9. `css/sm-desktop.css`
10. `css/sm-pack-detail.css`
11. `library-pro.css`  *(loads after the `css/` split files — wins conflicts)*
12. `plan-viewer-v3.css`
13. `css/sm-skin.css`  **← must remain last** (gating / skin overrides)

**JS — load order matters:**

1. `library-pro.js` — Library runtime
2. `plan-viewer-v3.js` — Plan Viewer v3 (must load **after** `library-pro.js` and after
   the `#sm-plan-v3-root` DOM exists, or the fallback viewer wins)

**Data:** `library-data-pro.json` (local test data, selected via
`window.SM_LIBRARY_DATA_URL`). Production falls back to BunnyCDN `videos_index_v16.json`.

**External runtime deps:** Memberstack (auth/plan), Render API
(`https://skymotion.onrender.com`), BunnyCDN (`https://skymotion-cdn.b-cdn.net`),
Google Font "Inter Tight".

---

## Repository layout

- `index.html`, `css/`, `library-pro.{css,js}`, `plan-viewer-v3.{css,js}`,
  `library-data-pro.json` — the production Library embed.
- `landing.html` — live landing page mirror (separate Webflow page).
- `webflow/` — mirrors of the Webflow auth pages and the separate Free Library page
  (reference only; not loaded by the Pro Library embed).
- `archive/prototypes/` — legacy standalone concepts, not used by production
  (see `archive/prototypes/README.md`).
- `docs/code-map/` — architecture maps, danger zones, cleanup/handoff docs.

---

## Git branches

- `main` — default branch.
- `launch-baseline` — the launched working baseline of the gated library.
- `webflow-transfer` — **current branch**: preparing the Library for the Webflow
  handoff (repo organization, audit, archiving unused prototypes). No production
  logic, gating, player, Plan Viewer, or CSS architecture is changed on this branch.

---

## Key docs

- [Webflow handoff spec](docs/code-map/WEBFLOW_HANDOFF_SPEC.md) — how to embed the
  Library into a Webflow page without changing product logic.
- [Webflow transfer audit](docs/code-map/AUDIT_WEBFLOW_TRANSFER.md) — production files,
  archive candidates, dependencies, and risks.
- [Danger zones](docs/code-map/DANGER_ZONES.md), [Dependency/duplication map](docs/code-map/DEPENDENCY_DUPLICATION_MAP.md),
  [CSS map](docs/code-map/CSS_MAP.md), [JS map](docs/code-map/JS_MAP.md),
  [Plan Viewer map](docs/code-map/PLAN_VIEWER_MAP.md).
