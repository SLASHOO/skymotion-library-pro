# SkyMotion Library — Audit Report (branch `webflow-transfer`)

**Scope:** read-only inventory. Findings verified against the actual files (link/script
tags in `index.html`, grep for cross-references, gating constants). The repo already
contains a code-map under `docs/code-map/` — this report reconciles it with the current
file state and condenses it to six questions.

---

## 1. Active production files (what actually ships in the Library)

The Library is one embed = DOM (`index.html`) + CSS + JS + a data index. Confirmed load
order is in `index.html` head/body.

**Entry / shell**

| File | Responsibility |
|---|---|
| `index.html` | Pro Library shell: DOM skeleton, `window.SM_*` config block, **Free/Pro gating injector** (`PRO_PLAN_ID = pln_skymotion-pro-beta-r8ai0gbb`, line 1412), and ~7 inline enhancement scripts (scroll-lock, modal openers, last-watched, mobile filter-drawer helper, paywall modals `#sm-pro-modal` / `#sm-pack-modal`). |

**CSS — all 11 files in `css/` are referenced, plus 2 root files (13 stylesheets total), `sm-skin.css` LAST**

| File | Responsibility |
|---|---|
| `css/sm-tokens.css` | CSS variables (color, spacing) |
| `css/sm-layout.css` | Base grid, assistant, header |
| `css/sm-cards.css` | Move cards |
| `css/sm-filters.css` | Filter base |
| `css/sm-player-modal.css` | Video player modal |
| `css/sm-responsive-mobile.css` | Mobile rules |
| `css/sm-filter-mobile.css` | Mobile filter (⚠ contains dormant Shoot Builder CSS) |
| `css/sm-subscreens.css` | Moves/Plans/Packs/Saved subscreens |
| `css/sm-desktop.css` | Desktop layout (⚠ contains dormant `.sm-pro-desktop-filter`) |
| `css/sm-pack-detail.css` | Pack detail view |
| `library-pro.css` | Loads **after** split files → wins conflicts. Global resets + mobile-portrait override layer + dormant desktop-filter block. **Not a redundant monolith** (1156 lines, verified). |
| `plan-viewer-v3.css` | Plan Viewer v3 styles |
| `css/sm-skin.css` | Session overlay (gating, free-style filter, Saved, badges) — **must stay loaded last** |

**JS**

| File | Responsibility |
|---|---|
| `library-pro.js` | Entire Library runtime (one IIFE): data load, filtering, rendering, tabs, player modal, saved-moves, pack detail. Guard `__SM_LIBRARY_V1_CLEAN_SPLIT__`. |
| `plan-viewer-v3.js` | Plan Viewer v3 (separate IIFE). Guard `__SM_PLAN_VIEWER_V3__`. Communicates with library only via custom events. |

**Data**

| File | Responsibility |
|---|---|
| `library-data-pro.json` | **Local TEST data** (moves/plans/packs). Active only because `window.SM_LIBRARY_DATA_URL = "./library-data-pro.json"` is set in `index.html`. Production falls back to BunnyCDN `videos_index_v16.json`. |

---

## 2. Safe to archive later (old prototypes — verified 0 references)

Grep confirms **no `href`/`src`/`fetch` links** to any of these from production code
(matches found elsewhere are CSS class names like `sm-pro-pack-*`, not links):

- `landing-v2.html` — old landing variant
- `pro-redesign.html` — redesign prototype
- `pro-checklist.html` — checklist prototype
- `pro-pack.html` — pack prototype
- `pro-hero-options.html` — hero options prototype

These are standalone and self-contained.
(Moved to `archive/prototypes/` as part of the `webflow-transfer` organization pass.)

**Reference (keep, but not part of the embed):**

- `landing.html` — the real (separate) Webflow landing page mirror
- `webflow/login.html`, `webflow/signup.html`, `webflow/README.md` — mirrors of Webflow auth embeds
- `webflow/free-library/free-library.html` + `webflow/free-library/sm-library-v40.js` — the **separate Free Library page** (loads its own `sm-library-v40.js`, not `library-pro.js`). Reference/filter source-of-truth only.
- `docs/**`, `.claude/agents/**`, `CLAUDE.md` — dev tooling/docs; never go into Webflow.

---

## 3. Duplicates / unused code needing manual verification

- **Dormant "Shoot Builder" Pro filter** — gated off by a single flag
  `library-pro.js:878 → SM_FREE_STYLE_FILTER = true` (so `filterUsesProUi()` is always
  false). Spans `library-pro.css` (1016–1156), `css/sm-desktop.css`
  (`.sm-pro-desktop-filter`), `css/sm-filter-mobile.css` (`.sm-pro-filter-screen`), and
  several JS branches. Cleanly isolated and reversible — **archive candidate, not a
  delete-blind** (set flag false to reactivate).
- **`library-pro.css` ↔ `css/` selector overlap (57 selectors)** — per
  `DEPENDENCY_DUPLICATION_MAP.md`, only **2** are true global dupes (`html`/`body`
  resets); **16** are the dead Shoot Builder; the other **41 are intentional
  media-context layering** (mobile in `library-pro.css` vs desktop/base in `css/`).
  ⚠ Removing the 41 breaks mobile portrait — do not "dedup" naively.
- **Plan Viewer CSS** present in both `library-pro.css` and `plan-viewer-v3.css`, with a
  **z-index mismatch (`100500` vs `100000`)**. Needs a side-by-side diff before any
  consolidation.
- **`library-data-pro.json`** — runtime does **not** read pack data from it
  (`getProPackItems()` is hardcoded in `library-pro.js`); the JSON is effectively
  reference/test data. Verify before treating it as the data source.

---

## 4. Exact dependencies for the Library to work

**Local files that must all be present/hosted (16):**

- 11 × `css/*.css` + `library-pro.css` + `plan-viewer-v3.css` (13 stylesheets)
- `library-pro.js`, `plan-viewer-v3.js` (2 scripts, in that order)
- 1 data index (`library-data-pro.json` locally, or the CDN index in prod)
- `index.html` provides the DOM, the config block, and inline glue.

**External / runtime dependencies:**

- **Memberstack** (`window.$memberstackDom`) — auth + plan resolution. Absent → everyone treated as anonymous/Free.
- **Render API** `https://skymotion.onrender.com` — `/v1/me/access`, `/v1/saved-moves`, `/v1/saved-items`.
- **BunnyCDN** `https://skymotion-cdn.b-cdn.net` — media + production `videos_index_v16.json` + checklist image.
- **Google Font** "Inter Tight".

**Load-order invariants (breakage if violated):**

1. `sm-skin.css` loads **last**.
2. `library-pro.css` loads **after** all `css/` split files.
3. `plan-viewer-v3.js` loads **after** `library-pro.js` and after `#sm-plan-v3-root` DOM exists (else the fallback basic viewer wins).
4. IIFE guards must stay (double-init protection on Webflow page transitions).

---

## 5. Future `/webflow` handoff package

A complete spec exists at `WEBFLOW_HANDOFF_SPEC.md`. The package should contain:

- **Host externally on CDN** (absolute URLs, keep `?v=N` cache-bust): the 13 CSS + 2 JS + the production data index.
- **Webflow `<head>`:** config `<script>` (production `SM_*` values), font links, the 13 CSS `<link>`s in original order with `sm-skin.css` last.
- **Webflow body (Embed):** `<symbol id="sm-logo">`, `#sm-library-scope`, `#sm-plan-v3-root`, `#sm-pro-modal` + `#sm-pack-modal` (+ their inline `<style>`/`<script>`), feedback widget.
- **Before `</body>`:** `library-pro.js`, then `plan-viewer-v3.js`, then inline enhancement scripts in order (skin backdrop → scroll-lock → gating injector → last-watched → filter-drawer helper).
- **Production config to set:** real `SM_LIBRARY_DATA_URL`, confirm `PRO_PLAN_ID`, real pack copy (`SM_PRO_PACK_*`), leave `SM_PRO_PRICE_ID` empty (checkout deferred).
- **Watch-outs:** Webflow Embed ~50k char limit (host assets externally, split DOM if needed); unscoped global CSS in `library-pro.css` lines 1–16 restyles the whole page; avoid `#modal`/`#chat`/`#resultsGrid` id collisions; keep Library blocks out of `transform`/`overflow` wrappers.
- Include `../../webflow/README.md` (auth embeds), `DANGER_ZONES.md`, and the smoke-test checklist as part of the handoff bundle.

---

## 6. Risks that could break gated Free/Pro Library if files are moved/removed

- **Removing/renaming any of the 13 CSS or 2 JS files** → broken layout or dead runtime (no React/build system to catch it — all paths are literal in `index.html`).
- **Reordering CSS** (moving `sm-skin.css` off last, or `library-pro.css` before the split) → gating/skin overrides lost, mobile portrait regressions.
- **Deleting the "dormant" Shoot Builder CSS/JS piecemeal** without the flag context → JS branch errors; do it as one atomic, flag-gated change.
- **Removing the 41 media-layered selectors in `library-pro.css`** → mobile portrait breaks.
- **Renaming the event-bridge events** `sm:open-plan`, `sm:reopen-plan-after-player`, `sm:open-move-player` → Plan Viewer ↔ Library bridge breaks.
- **Touching the gating injector** in `index.html` (`PRO_PLAN_ID`, `buildFreeSet`/`cardIsFree`/`processCard`) → Free/Pro entitlement (7 moves + 2 plans free, rest locked-but-visible) breaks.
- **Removing IIFE guards** → double-init on Webflow page transitions.
- **Scroll-lock (3 systems)** and **Plan Viewer z-index** mismatch → frozen mobile scroll / Plan Viewer hidden behind player modal.
- **Pointing `SM_LIBRARY_DATA_URL` away from a valid index** (or deleting `library-data-pro.json` while still referenced) → "Failed to load videos".
- **Auth/API/CDN dependency loss** (Memberstack, Render, BunnyCDN) → no Pro unlock, no saved moves, no media.
