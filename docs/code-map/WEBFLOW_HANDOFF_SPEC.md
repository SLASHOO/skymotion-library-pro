# WEBFLOW HANDOFF SPECIFICATION — SkyMotion Pro Library

> Scope: how to take the **current working Library** (`index.html` + its assets) and embed it into a Webflow page **without changing product logic**.
> This is a handoff spec only. No code refactor, no CSS cleanup, no landing changes, no billing. Source of truth = `index.html` as it is today.

---

## 0. What "the Library" is (one embed, three DOM blocks + modals)

The Library is a self-contained widget made of:

- **DOM** — `#sm-library-scope` (header, tabs, filter, results, player `#modal`) + `#sm-plan-v3-root` (Plan Viewer) + two paywall modals (`#sm-pro-modal`, `#sm-pack-modal`) + a feedback widget + an inline `<symbol id="sm-logo">`.
- **CSS** — 12 stylesheets in `css/` + `library-pro.css` + `plan-viewer-v3.css`, with `css/sm-skin.css` **loaded LAST**.
- **JS** — `library-pro.js` (runtime), `plan-viewer-v3.js` (Plan Viewer), and ~7 small inline enhancement scripts (scroll-lock, modal openers, **Free/Pro gating injector**, last-watched, filter-drawer helper).
- **Data** — a JSON index of moves/plans (currently local test file; production = BunnyCDN).
- **External deps** — Memberstack (auth/plan), Google Font "Inter Tight", BunnyCDN media, the Render API.

Everything is scoped under `#sm-library-scope` except the Plan Viewer (`#sm-plan-v3-root`, intentionally outside) and the paywall modals (fixed overlays).

---

## 1. Asset inventory — what must be hosted vs what's already absolute

### 1A. LOCAL files → must be hosted on a CDN and referenced by **absolute URL** in Webflow

| File | Type | Current ref | Action |
|---|---|---|---|
| `css/sm-tokens.css` | CSS | `./css/…?v=1` | Host → absolute URL |
| `css/sm-layout.css` | CSS | `./css/…` | Host |
| `css/sm-cards.css` | CSS | `./css/…` | Host |
| `css/sm-filters.css` | CSS | `./css/…` | Host |
| `css/sm-player-modal.css` | CSS | `./css/…` | Host |
| `css/sm-responsive-mobile.css` | CSS | `./css/…` | Host |
| `css/sm-filter-mobile.css` | CSS | `./css/…` | Host |
| `css/sm-subscreens.css` | CSS | `./css/…` | Host |
| `css/sm-desktop.css` | CSS | `./css/…` | Host |
| `css/sm-pack-detail.css` | CSS | `./css/…` | Host |
| `library-pro.css` | CSS | `./library-pro.css?v=128` | Host |
| `plan-viewer-v3.css` | CSS | `./plan-viewer-v3.css?v=1` | Host |
| `css/sm-skin.css` | CSS (**LAST**) | `./css/sm-skin.css?v=86` | Host |
| `library-pro.js` | JS | `./library-pro.js?v=126` | Host |
| `plan-viewer-v3.js` | JS | `./plan-viewer-v3.js?v=1` | Host |
| `library-data-pro.json` | Data (TEST) | `window.SM_LIBRARY_DATA_URL` | Replace with **production CDN index** |

Recommended host: the existing BunnyCDN (`https://skymotion-cdn.b-cdn.net/…`). Keep the `?v=N` cache-bust query on each file so updates propagate.

### 1B. EXTERNAL / already absolute → keep as-is

| Asset | Value |
|---|---|
| Font | `https://fonts.googleapis.com/css2?family=Inter+Tight:…` |
| API base | `window.SM_API_BASE = https://skymotion.onrender.com` |
| Checklist image | `window.SM_CHECKLIST_PAPER_ASSET_URL = https://skymotion-cdn.b-cdn.net/checklist.png` |
| Sign-up URL | `window.SM_PRO_SIGNUP_URL = https://skymotion.cloud/sign-up` |
| Memberstack | provided by the Webflow Memberstack integration (site-wide) |
| Header/footer links | `https://skymotion.cloud/…` (already absolute) |

### 1C. INLINE → travels inside the embed (no hosting, but counts toward Webflow size limits — see §5)

Logo `<symbol>`, all DOM blocks, the two modal `<style>` blocks, and the inline scripts.

---

## 2. Webflow placement map (head vs body)

### 2A. Page settings → **Inside `<head>` tag**

In this exact order:

1. The **config `<script>`** (the `window.SM_*` block) — set production values (see §3).
2. Font `<link>`s (Inter Tight) — or use a Webflow-hosted font.
3. The **13 CSS `<link>`s** in the original order, **with `css/sm-skin.css` LAST**, all as absolute URLs.

> Order matters: `library-pro.css` loads **after** the `css/` split files (it overrides them by load order — see DEPENDENCY_DUPLICATION_MAP.md), and `sm-skin.css` overrides everything, so it must remain last.

### 2B. Page body → **Embed element(s)** (the DOM)

In document order:

1. Inline `<symbol id="sm-logo">` SVG.
2. `#sm-library-scope` (header + tabs + filter `aside.assistant` + `main.results` + `#modal`).
3. `#sm-plan-v3-root` (Plan Viewer DOM).
4. `#sm-pro-modal` (pricing modal) + its `<style>` + open/close `<script>`.
5. `#sm-pack-modal` (pack value modal) + its `<style>` + `<script>`.
6. Feedback widget markup + `<style>`.

### 2C. Page settings → **Before `</body>` tag** (scripts, in order)

1. `<script src=".../library-pro.js?v=…">` (absolute).
2. `<script src=".../plan-viewer-v3.js?v=…">` (absolute) — **after** library-pro.js **and** after the `#sm-plan-v3-root` DOM exists (it does, since body renders before footer code).
3. The inline enhancement scripts, in this order: skin pack-detail backdrop → scroll-lock/feedback helpers → **Free/Pro gating injector** → last-watched → mobile filter-drawer helper.

> All inline scripts are additive and run after the DOM via `DOMContentLoaded`/`MutationObserver`, so placing them before `</body>` is safe.

---

## 3. Production config to set (the `window.SM_*` block)

| Var | Today (test) | Set for production |
|---|---|---|
| `SM_LIBRARY_DATA_URL` | `./library-data-pro.json` | **Production CDN index URL** (or remove to fall back to `videos_index_v16.json`). The gating injector reads the *same* URL to build the free set. |
| `SM_API_BASE` | Render URL | keep |
| `SM_CHECKLIST_PAPER_ASSET_URL` | BunnyCDN | keep / update |
| `SM_PRO_SIGNUP_URL` | `…/sign-up` | confirm |
| `SM_PRO_PRICE_ID` | `""` | **leave empty for now** — real checkout deferred until Memberstack billing is configured |
| `SM_PRO_PACK_TITLE/CREATOR/DESCRIPTION` | "Test Pack" / placeholder | update when the first official pack is chosen |

---

## 4. Memberstack + Free/Pro access (how gating resolves on Webflow)

- The Webflow page must have the **Memberstack integration active** (it exposes `window.$memberstackDom`). On a page without it, the Library safely treats everyone as **anonymous / Free**.
- **Pro plan id:** `pln_skymotion-pro-beta-r8ai0gbb` (hard-coded in the gating injector as `PRO_PLAN_ID`). If the production Pro plan id differs, update that one constant.
- **States** (set as classes on `#sm-library-scope`): `sm-anon` / `sm-authed`, and `sm-free` / `sm-pro`. Badge shows `Basic` (Free) or `PRO`.
- **Free entitlement:** first **7 moves + 2 plans** (fallback by data order; honors an explicit `"free": true` flag in the index when present). Everything else is **locked-but-visible**; packs and Saved are Pro.
- **Get Pro CTA (placeholder, billing deferred):** anonymous → `/sign-up` link; logged-in Free → pricing modal stays open as upgrade intent ("checkout coming soon"); **no real checkout, no price id required yet.**

---

## 5. Webflow gotchas (read before pasting)

1. **Custom-code size limits.** Webflow's page head/footer custom-code fields and Embed elements are size-capped (Embed ≈ 50k chars; head/footer fields smaller). **Host all CSS/JS externally** (§1A) so only DOM + small inline glue lives in Webflow. If the DOM embed is still large, split it across multiple Embed elements (they concatenate in the rendered page).
2. **Unscoped global CSS.** `library-pro.css` lines 1–16 style `*`, `html, body { background:#121212 }`, and `body { color/font }` — these are **page-global**, not scoped to `#sm-library-scope`. On a Webflow page they will restyle the whole page (nav/footer). Decide per target page: acceptable if the page is dedicated to the Library; otherwise scope those 3 rules. *(Flagged only — do not change today.)*
3. **id collisions.** The embed uses generic ids (`#modal`, `#chat`, `#resultsGrid`, etc.). Make sure the host Webflow page has no elements with the same ids.
4. **Top-level placement.** `#sm-library-scope` and `#sm-plan-v3-root` should be near the top of the body / not nested inside Webflow layout wrappers that impose `transform`/`overflow` (these can break the fixed-position Plan Viewer and modals).
5. **Skin loads last** — never move `css/sm-skin.css` above the other stylesheets.
6. **IIFE guards** (`__SM_LIBRARY_V1_CLEAN_SPLIT__`, `__SM_PLAN_VIEWER_V3__`) already protect against double-init on Webflow page transitions — keep them.
7. **Dormant Shoot Builder** stays disabled (`SM_FREE_STYLE_FILTER = true`); ship as-is.

---

## 6. Landing → Library CTA (documentation only — no landing changes today)

Landing navigation stays **unchanged**. For when it's wired later: the landing CTA that opens the product (currently `landing.html`'s "Open library" / "Open SkyMotion Pro" → `https://skymotion.cloud/library` and `/pro-library`) should point at **the Webflow page that hosts this Library embed** — recommended **`https://skymotion.cloud/pro-library`**. The Library's own header logo (`#sm-library-scope h1 a`) and footer links already point to `skymotion.cloud/*` and need no change.

---

## 7. Danger zones — do NOT alter during handoff

(Full detail in `DANGER_ZONES.md`.)

- Auth/Memberstack resolve, Backend API (`/v1/me/access`, `/v1/saved-moves`, `/v1/saved-items`).
- Event bridge names: `sm:open-plan`, `sm:reopen-plan-after-player`, `sm:open-move-player`.
- Scroll-lock systems, Plan Viewer z-index, saved-moves logic.
- The gating injector's `cardIsFree` / `processCard` / `buildFreeSet` logic.

---

## 8. Pre-launch checklist (resolve before go-live)

- [ ] Host the 16 local assets on CDN; replace every `./…` ref with absolute URLs.
- [ ] Set `SM_LIBRARY_DATA_URL` to the production index (and upload the final index with the deliberate `free:true` items).
- [ ] Confirm `PRO_PLAN_ID` matches the production Memberstack Pro plan.
- [ ] Update pack copy (`SM_PRO_PACK_*`) once the first pack is chosen.
- [ ] Bump `?v=N` on any changed CSS/JS.
- [ ] Leave `SM_PRO_PRICE_ID` empty (checkout deferred).

## 9. Post-embed smoke test (run on the Webflow page)

1. Page loads, **no console errors**; cards render (not "Failed to load videos").
2. Tabs switch (All / Moves / Plans / Packs / Saved); filter opens/closes.
3. **Free:** 7 moves + 2 plans open; the rest locked-but-visible; pack gated; **Saved** shows the Pro message.
4. Locked move/plan → pricing modal; gated pack → pack value modal.
5. Unlocked move → player; unlocked plan → Plan Viewer v3 (not the fallback).
6. **Pro** (real Pro Memberstack login) → everything unlocks, badge = PRO.
7. Save/unsave works for Pro; scroll restores after closing pack detail / Plan Viewer / player.
8. Mobile portrait + desktop both verified (mobile is the priority surface).
