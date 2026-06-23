# SOURCE OF TRUTH — read this first

These files under `webflow/staging/` are **deployment handoff artifacts**. They are a
recipe for pasting the existing Library into a Webflow page. **They are not the product
and they are not loaded by anything.**

## Canonical source (the only files that define behavior)

The live, authoritative Library is, and remains:

| Canonical file | Role |
|---|---|
| `index.html` | DOM skeleton, config block, the 7 inline enhancement scripts |
| `css/` (10 split files) | Library styles |
| `library-pro.css` | Mobile-override layer (loads after split CSS) |
| `plan-viewer-v3.css` | Plan Viewer styles |
| `css/sm-skin.css` | Visual skin — **loads LAST** |
| `library-pro.js` | Library runtime |
| `plan-viewer-v3.js` | Plan Viewer runtime |
| `library-data-pro.json` | Local test data (prod uses the CDN index) |

**If anything here disagrees with `index.html`, `index.html` wins.**

## What these staging files intentionally do NOT do

- They do **not** copy the runtime logic of the inline scripts (gating injector, player
  enhancements, feedback widget, modals, last-watched, filter-drawer helper). Duplicating
  that logic would create a second, divergent copy — exactly the risk we avoid. Instead
  `BEFORE_BODY.html` and `BODY_EMBED.html` point to the **exact line ranges in
  `index.html`** to copy at deploy time.
- They do **not** change Free/Pro gating, Memberstack wiring, checkout, Stripe, price
  ids, or billing redirects.
- They do **not** modify any canonical file.

## What they DO provide

- The exact load order and placement map (HEAD / BODY / BEFORE BODY).
- Paste-ready external-asset tags (CSS/JS) with absolute-URL placeholders — this is the
  only real transformation from local dev to Webflow (relative `./` paths → hosted URLs).
- A config template (`CONFIG.example.js`) with placeholders.
- An asset manifest and a smoke test.

## Deploy = copy from canonical, fill placeholders

When deploying: copy the referenced DOM/script ranges out of the current `index.html`,
host the assets listed in `ASSET_MANIFEST.md`, replace the `{{...}}` placeholders, and
paste into the Webflow page slots described in the other files. Re-export from
`index.html` whenever the canonical source changes; do not hand-edit production logic here.
