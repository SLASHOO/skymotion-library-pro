# Webflow staging — handoff package

Deployment recipe for embedding the **existing** SkyMotion Pro Library into a
Webflow page. These are **handoff artifacts only** — they are not loaded by
anything and they do not change product behavior. The canonical source stays
`index.html` + `css/` + `library-pro.{css,js}` + `plan-viewer-v3.{css,js}`.

**Read `SOURCE_OF_TRUTH.md` first.**

## Files

| File | Purpose |
|---|---|
| `SOURCE_OF_TRUTH.md` | What is canonical vs. what these files are. Read first. |
| `HEAD.html` | Webflow `<head>`: config pointer, fonts, CSS links in exact order (sm-skin last). Paste-ready external tags with `{{CDN_BASE}}`. |
| `BODY_EMBED.html` | Webflow body Embed: the Library DOM blocks, by exact `index.html` line range and order. |
| `BEFORE_BODY.html` | Webflow "Before `</body>`": JS load order (2 external scripts paste-ready) + the 7 inline enhancement scripts by line range. |
| `CONFIG.example.js` | `window.SM_*` config template with placeholders (API base, data URL, signup URL, pack copy). Checkout deferred. |
| `ASSET_MANIFEST.md` | Every CSS/JS/data asset to host externally, in exact load order. |
| `SMOKE_TEST.md` | Free / Pro / player / Plan Viewer / Saved / mobile / desktop / Memberstack checks. |

## How to deploy (summary)

1. Host the 16 assets from `ASSET_MANIFEST.md` on the CDN; keep `?v=N`.
2. Fill `CONFIG.example.js` placeholders → paste into the page `<head>` (first).
3. Paste the fonts + 13 CSS links from `HEAD.html` (replace `{{CDN_BASE}}`).
4. Copy the DOM blocks listed in `BODY_EMBED.html` from the current `index.html`
   into Webflow Embed element(s), in order.
5. Add the 2 external `<script>`s + the 7 inline scripts per `BEFORE_BODY.html`.
6. Run `SMOKE_TEST.md` on the live staging page.

## Hard invariants (do not break)

- `library-pro.css` after the 10 `css/` split files; **`sm-skin.css` last**.
- `library-pro.js` before `plan-viewer-v3.js`; plan viewer after its DOM exists.
- Memberstack loaded **once** (Webflow site-wide integration) — no second loader.
- Keep the IIFE guards and the inline-script order.
- No checkout / Stripe / price id / billing redirect work in this handoff; do not
  alter Free/Pro gating.

## Related docs

- `../../docs/code-map/WEBFLOW_HANDOFF_SPEC.md` — full handoff spec.
- `../../docs/code-map/AUDIT_WEBFLOW_TRANSFER.md` — file audit, deps, risks.
- `../../docs/code-map/DANGER_ZONES.md` — what not to touch.
- `../README.md` — Webflow auth-page mirrors (login / signup).
