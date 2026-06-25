// ============================================================================
// deploy/release-library.mjs — point the live Library at one immutable commit.
// ----------------------------------------------------------------------------
// Usage:
//   node deploy/release-library.mjs <full-40-char-commit-hash>
//
// Webflow is NEVER touched by this. Releasing (and rolling back) only updates
// the Bunny manifest that the stable boot loader (boot/library.js) reads:
//
//   release  -> node deploy/release-library.mjs <new-commit>
//   rollback -> node deploy/release-library.mjs <previous-commit>
//
// Both do the exact same thing: regenerate boot/library-release.json for the
// given commit, upload boot/library.js + the manifest to Bunny, then purge ONLY
// the manifest URL (never the whole Pull Zone).
//
// Secrets: Bunny credentials are read from env vars and are NEVER written to
// the repo, printed, or logged. Only the PRESENCE of each var is reported.
// ============================================================================
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// --- Credentials come ONLY from .env.local (never Windows/shell env vars) ----
// Minimal KEY=VALUE parser (zero deps). Blank lines + `#` comments ignored;
// surrounding quotes stripped. Missing file -> empty config (no upload).
const ENV_FILE = resolve(ROOT, ".env.local");
function loadEnvLocal(path) {
  const env = {};
  if (!existsSync(path)) return env;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key) env[key] = val;
  }
  return env;
}
const ENV = loadEnvLocal(ENV_FILE);
// Empty string counts as "not set" so blank placeholder fields read as missing.
const envVal = (name) => (ENV[name] && ENV[name].length ? ENV[name] : "");

// --- Fixed identity (the only repo / CDN / paths this release system serves) --
const REPO = "SLASHOO/skymotion-library-pro";
const CDN_BASE = "https://skymotion-cdn.b-cdn.net";
const MANIFEST_PUBLIC_URL = `${CDN_BASE}/boot/library-release.json`;
const BOOT_PUBLIC_URL = `${CDN_BASE}/boot/library.js`;
const BOOT_REMOTE_PATH = "boot/library.js"; // path inside the Bunny storage zone
const MANIFEST_REMOTE_PATH = "boot/library-release.json";

const BOOT_SRC = resolve(ROOT, "boot/library.js");
const MANIFEST_SRC = resolve(ROOT, "boot/library-release.json");

// Required Bunny env vars (presence only is ever reported).
const REQUIRED_ENV = [
  "BUNNY_STORAGE_ZONE",     // storage zone name
  "BUNNY_STORAGE_PASSWORD", // storage zone password / access key (write)
  "BUNNY_PURGE_API_KEY",    // account API key, used only to purge the manifest URL
];
// Optional; defaults to the global storage endpoint when unset.
const OPTIONAL_ENV = ["BUNNY_STORAGE_HOST"];

// --- tiny logger ------------------------------------------------------------
const log = (...a) => console.log(...a);
function die(msg) {
  console.error("\n✗ " + msg + "\n");
  process.exit(1);
}

function jsdelivrLoaderUrl(hash) {
  return `https://cdn.jsdelivr.net/gh/${REPO}@${hash}/webflow/library-loader.js`;
}

// --- 1. Parse + validate the commit argument --------------------------------
const hash = (process.argv[2] || "").trim();
if (!hash) {
  die(
    "missing commit hash.\n" +
    "  Usage: node deploy/release-library.mjs <full-40-char-commit-hash>\n" +
    "  Rollback is the same command with a previous commit hash."
  );
}
if (!/^[0-9a-f]{40}$/.test(hash)) {
  die(`commit must be a full 40-character git hash (got: "${hash}").`);
}

log("\nSkyMotion — Library release");
log("  repo   : " + REPO);
log("  commit : " + hash);

// --- 2. Repo must be clean --------------------------------------------------
function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}
let porcelain;
try {
  porcelain = git(["status", "--porcelain"]);
} catch (e) {
  die("could not run git in " + ROOT + ": " + e.message);
}
if (porcelain) {
  die(
    "working tree is not clean. Commit or stash first so the release maps to an\n" +
    "exact immutable commit. Uncommitted changes:\n" + porcelain
  );
}
log("  ✓ working tree clean");

// --- 3. Commit must exist locally -------------------------------------------
try {
  git(["rev-parse", "--verify", "--quiet", `${hash}^{commit}`]);
} catch {
  die(`commit ${hash} does not exist locally. Fetch it or check the hash.`);
}
log("  ✓ commit exists locally");

// --- 4. The exact jsDelivr loader for this commit must be reachable (HTTP 200)-
const loaderUrl = jsdelivrLoaderUrl(hash);
log("\nChecking pinned loader is published on jsDelivr…");
log("  " + loaderUrl);
const head = await fetch(loaderUrl, { method: "GET", cache: "no-store" }).catch((e) => {
  die("could not reach jsDelivr: " + (e && e.message ? e.message : e));
});
if (!head.ok) {
  die(
    `jsDelivr returned HTTP ${head.status} for the pinned loader.\n` +
    "Make sure the commit is pushed to GitHub (jsDelivr serves pushed commits)."
  );
}
log("  ✓ HTTP 200");

// --- 5. Generate the manifest (boot/library-release.json) -------------------
const manifest = { release: hash, loader: loaderUrl };
const manifestJson = JSON.stringify(manifest, null, 2) + "\n";
writeFileSync(MANIFEST_SRC, manifestJson);
log("\nGenerated manifest -> boot/library-release.json");
log(manifestJson.replace(/^/gm, "    ").replace(/\s+$/, ""));

// --- Credentials presence (names only — never values) -----------------------
log("\nBunny credentials from .env.local (presence only):");
log("  source: " + (existsSync(ENV_FILE) ? ".env.local found" : ".env.local MISSING"));
const missing = [];
for (const name of REQUIRED_ENV) {
  const set = !!envVal(name);
  log(`  ${set ? "present" : "missing"}  ${name}`);
  if (!set) missing.push(name);
}
for (const name of OPTIONAL_ENV) {
  log(`  ${envVal(name) ? "present" : "default"}  ${name}` +
      (envVal(name) ? "" : "  (-> storage.bunnycdn.com)"));
}

if (missing.length) {
  log("\n— No upload performed (missing credentials). —");
  log("Source + manifest files are ready. Fill these fields in .env.local:");
  for (const name of missing) log("  - " + name);
  log(
    "\n  Edit " + ENV_FILE + " (git-ignored), then re-run:\n" +
    "    node deploy/release-library.mjs " + hash + "\n"
  );
  process.exit(0);
}

// --- 6. Upload to Bunny Storage ---------------------------------------------
const storageHost = envVal("BUNNY_STORAGE_HOST") || "storage.bunnycdn.com";
const storageZone = envVal("BUNNY_STORAGE_ZONE");
const storagePass = envVal("BUNNY_STORAGE_PASSWORD");
const purgeKey = envVal("BUNNY_PURGE_API_KEY");

async function bunnyUpload(remotePath, body, contentType) {
  const url = `https://${storageHost}/${storageZone}/${remotePath}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { AccessKey: storagePass, "Content-Type": contentType },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`upload ${remotePath} -> HTTP ${res.status} ${text}`.trim());
  }
}

log("\nUploading to Bunny storage zone…");
const bootBytes = readFileSync(BOOT_SRC);
try {
  await bunnyUpload(BOOT_REMOTE_PATH, bootBytes, "application/javascript");
  log("  ✓ uploaded " + BOOT_REMOTE_PATH);
  await bunnyUpload(MANIFEST_REMOTE_PATH, manifestJson, "application/json");
  log("  ✓ uploaded " + MANIFEST_REMOTE_PATH);
} catch (e) {
  die("Bunny upload failed: " + e.message);
}

// --- 7. Purge ONLY the manifest URL (never the whole Pull Zone) -------------
log("\nPurging manifest URL (manifest only)…");
{
  const purgeUrl = `https://api.bunny.net/purge?url=${encodeURIComponent(MANIFEST_PUBLIC_URL)}&async=false`;
  const res = await fetch(purgeUrl, { method: "POST", headers: { AccessKey: purgeKey } })
    .catch((e) => die("purge request failed: " + (e && e.message ? e.message : e)));
  if (!res.ok) die(`purge returned HTTP ${res.status} for ${MANIFEST_PUBLIC_URL}`);
  log("  ✓ purged " + MANIFEST_PUBLIC_URL);
}

// --- 8. Public verification (both must serve current content) ---------------
log("\nVerifying public URLs…");

// Manifest: must now serve exactly what we generated.
{
  const res = await fetch(MANIFEST_PUBLIC_URL, { cache: "no-store" });
  if (!res.ok) die(`manifest verify HTTP ${res.status}`);
  const live = await res.json();
  if (live.release !== manifest.release || live.loader !== manifest.loader) {
    die("manifest served by Bunny does not match the generated manifest yet.");
  }
  log("  ✓ manifest live + correct: " + MANIFEST_PUBLIC_URL);
}

// Boot loader: must be reachable. It is intentionally NOT purged (it is stable
// and rarely changes); warn loudly if Bunny still serves different bytes.
{
  const res = await fetch(BOOT_PUBLIC_URL, { cache: "no-store" });
  if (!res.ok) die(`boot loader verify HTTP ${res.status}`);
  const liveBoot = await res.text();
  if (liveBoot !== bootBytes.toString("utf8")) {
    log(
      "  ! boot/library.js changed and the cached copy still differs.\n" +
      "    The manifest is updated, but the stable boot loader needs a manual\n" +
      "    purge of " + BOOT_PUBLIC_URL + " (it is deliberately not auto-purged)."
    );
  } else {
    log("  ✓ boot loader live + current: " + BOOT_PUBLIC_URL);
  }
}

log("\n✓ Library release complete — commit " + hash + " is now live via the manifest.");
log("  Webflow was not touched.\n");
