# deploy/ — Library release system (stable Bunny boot loader)

Goal: **Webflow is edited once and never again** for Library releases.

## How it works

```
Webflow (forever)                Bunny (per release)              GitHub (source of truth)
─────────────────                ───────────────────              ────────────────────────
boot/library.js  ──fetch──▶  /boot/library-release.json  ──▶  jsDelivr @<commit>/webflow/library-loader.js
                             { release, loader }                 └─ derives every other asset @<commit>
```

The Webflow snippet is fixed forever:

```html
<script>
  window.SM_LIBRARY_DATA_URL =
    "https://skymotion-cdn.b-cdn.net/videos_index_v16.json";
</script>
<script src="https://skymotion-cdn.b-cdn.net/boot/library.js"></script>
```

Body mount (unchanged):

```html
<div id="sm-library-pro"></div>
```

`boot/library.js` is uploaded to Bunny once and contains **no commit hash**. It
reads the manifest, strictly validates it (must be the jsDelivr
`SLASHOO/skymotion-library-pro` `/webflow/library-loader.js` URL at a full
40-char commit, consistent with `release`), and injects that loader. A new
release = a new manifest. Webflow is never touched.

## Release

```bash
node deploy/release-library.mjs <full-40-char-commit-hash>
```

It will:
1. Require a clean working tree.
2. Require the commit to exist locally.
3. Require HTTP 200 for the exact jsDelivr loader of that commit (i.e. pushed).
4. Generate `boot/library-release.json`.
5. Upload `boot/library.js` + `boot/library-release.json` to Bunny storage.
6. Purge **only** the manifest URL (never the whole Pull Zone).
7. Verify both public URLs serve the current content.

## Rollback

Same command, previous commit:

```bash
node deploy/release-library.mjs <previous-full-commit-hash>
```

This rewrites the Bunny manifest to the older commit and purges the manifest
URL. Webflow is not touched.

## Credentials (never committed)

Read **only** from `.env.local` in the repo root — never from Windows/shell
environment variables. Only their **presence** is ever printed, never their
values. `.env.local` is git-ignored; `.env.local.example` (secret-free) is
tracked as the template.

```bash
cp .env.local.example .env.local   # then fill in the values
```

Required (in `.env.local`):
- `BUNNY_STORAGE_ZONE` — storage zone name
- `BUNNY_STORAGE_PASSWORD` — storage zone password / write access key
- `BUNNY_PURGE_API_KEY` — account API key, used only to purge the manifest URL

Optional:
- `BUNNY_STORAGE_HOST` — storage endpoint host (default `storage.bunnycdn.com`;
  set this if your zone is in a specific region, e.g. `ny.storage.bunnycdn.com`)

If `.env.local` is missing or any required field is blank, the script creates
all files but performs **no upload**, and prints exactly which fields to fill.

## Home (same pattern, separate files)

Home has its own identical system, fully independent of the Library one:
- boot loader: `boot/home.js`  → Bunny `/boot/home.js`
- manifest:    `boot/home-release.json` → Bunny `/boot/home-release.json`
- release:     `node deploy/release-home.mjs <full-commit-hash>`
- loader path validated: `/webflow/home-loader.js`; mount: `#sm-home`

Final Webflow Home snippet (set once, then never touched again):

```html
<div id="sm-home"></div>
<script src="https://skymotion-cdn.b-cdn.net/boot/home.js"></script>
```

## Local verification (before Webflow Publish)

Serve the repo root over HTTP, then open:
- Library: `boot/boot-smoke-test.html` / `boot/boot-smoke-test-broken.html`
- Home:    `boot/home-boot-smoke-test.html` / `boot/home-boot-smoke-test-broken.html`

```bash
python -m http.server 8777
# http://localhost:8777/boot/boot-smoke-test.html
# http://localhost:8777/boot/boot-smoke-test-broken.html
# http://localhost:8777/boot/home-boot-smoke-test.html
# http://localhost:8777/boot/home-boot-smoke-test-broken.html
```
