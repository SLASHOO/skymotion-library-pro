# ASSET MANIFEST — files to host externally

Handoff artifact. Host every local file below on the CDN and reference it by
**absolute URL** in Webflow (replace the `./` paths used in local dev). Keep the
`?v=N` cache-bust query and bump it whenever a file changes. Recommended host:
the existing BunnyCDN — `https://skymotion-cdn.b-cdn.net` — i.e. `{{CDN_BASE}}`.

Canonical reference: `index.html` head/body. **Order matters** for CSS and JS.

## CSS — host all 13, link in THIS order (sm-skin LAST)

| # | File | Current ref (local) | Webflow ref |
|---|---|---|---|
| 1 | `css/sm-tokens.css` | `./css/sm-tokens.css?v=1` | `{{CDN_BASE}}/css/sm-tokens.css?v=1` |
| 2 | `css/sm-layout.css` | `./css/sm-layout.css?v=1` | `{{CDN_BASE}}/css/sm-layout.css?v=1` |
| 3 | `css/sm-cards.css` | `./css/sm-cards.css?v=1` | `{{CDN_BASE}}/css/sm-cards.css?v=1` |
| 4 | `css/sm-filters.css` | `./css/sm-filters.css?v=1` | `{{CDN_BASE}}/css/sm-filters.css?v=1` |
| 5 | `css/sm-player-modal.css` | `./css/sm-player-modal.css?v=1` | `{{CDN_BASE}}/css/sm-player-modal.css?v=1` |
| 6 | `css/sm-responsive-mobile.css` | `./css/sm-responsive-mobile.css?v=1` | `{{CDN_BASE}}/css/sm-responsive-mobile.css?v=1` |
| 7 | `css/sm-filter-mobile.css` | `./css/sm-filter-mobile.css?v=1` | `{{CDN_BASE}}/css/sm-filter-mobile.css?v=1` |
| 8 | `css/sm-subscreens.css` | `./css/sm-subscreens.css?v=1` | `{{CDN_BASE}}/css/sm-subscreens.css?v=1` |
| 9 | `css/sm-desktop.css` | `./css/sm-desktop.css?v=1` | `{{CDN_BASE}}/css/sm-desktop.css?v=1` |
| 10 | `css/sm-pack-detail.css` | `./css/sm-pack-detail.css?v=1` | `{{CDN_BASE}}/css/sm-pack-detail.css?v=1` |
| 11 | `library-pro.css` | `./library-pro.css?v=128` | `{{CDN_BASE}}/library-pro.css?v=128` |
| 12 | `plan-viewer-v3.css` | `./plan-viewer-v3.css?v=1` | `{{CDN_BASE}}/plan-viewer-v3.css?v=1` |
| 13 | `css/sm-skin.css` **(LAST)** | `./css/sm-skin.css?v=86` | `{{CDN_BASE}}/css/sm-skin.css?v=86` |

Invariants: `library-pro.css` (#11) after the 10 split files; `sm-skin.css` (#13) last.

## JS — host both, load in THIS order (before `</body>`)

| # | File | Current ref (local) | Webflow ref |
|---|---|---|---|
| 1 | `library-pro.js` | `./library-pro.js?v=126` | `{{CDN_BASE}}/library-pro.js?v=126` |
| 2 | `plan-viewer-v3.js` | `./plan-viewer-v3.js?v=1` | `{{CDN_BASE}}/plan-viewer-v3.js?v=1` |

Invariant: `library-pro.js` before `plan-viewer-v3.js`.

## Data

| File | Current ref | Webflow ref |
|---|---|---|
| moves/plans index | `window.SM_LIBRARY_DATA_URL = ./library-data-pro.json` (TEST) | Production CDN index, e.g. `{{CDN_BASE}}/videos_index_v16.json` (or omit to fall back to `videos_index_v16.json`) |

`library-data-pro.json` is local test data; do not ship it as production. The
gating injector reads `SM_LIBRARY_DATA_URL` to build the free set, so the prod
URL must resolve.

## Already absolute / external — keep as-is (do NOT re-host)

| Asset | Value |
|---|---|
| Font | `https://fonts.googleapis.com/css2?family=Inter+Tight:…` |
| API base | `window.SM_API_BASE` → Render URL |
| Checklist image | `window.SM_CHECKLIST_PAPER_ASSET_URL` → BunnyCDN |
| Media (move/plan videos) | BunnyCDN, referenced from the data index |
| Pack-detail backdrop video | inline skin script (S3 webflow-prod asset URL) |
| Memberstack | loaded **once**, site-wide, by the Webflow Memberstack integration |

## Inline (travels inside the embed — not hosted)

Logo `<symbol>`, all DOM blocks, the three inline `<style>` blocks (feedback
widget, Pro modal, Pack modal), and the 7 inline enhancement scripts. These
count toward Webflow's Embed size cap — see `BODY_EMBED.html`.

## Count

16 local files to host = 13 CSS + 2 JS + 1 production data index.
