# Archived prototypes — legacy standalone concepts

These files are **legacy standalone HTML concepts**. They are **not loaded by
production** and are **not part of the Pro Library embed** (`index.html`).

Verified before archiving: no `href` / `src` / `fetch` reference to any of these
files exists anywhere in the production code. (Class-name matches like
`sm-pro-pack-*` are CSS class names, not links.)

| File | What it was |
|---|---|
| `landing-v2.html` | Old landing-page variant |
| `pro-redesign.html` | Pro Library redesign prototype |
| `pro-checklist.html` | Pre-flight checklist prototype |
| `pro-pack.html` | Pack detail prototype |
| `pro-hero-options.html` | Hero section options prototype |

They were moved here with `git mv` (history preserved). The move is fully
reversible — restore any file with `git mv archive/prototypes/<file> ./<file>`.

The live landing page reference is `../../landing.html` (kept at repo root).
