// ============================================================================
// deploy/warm-jsdelivr.mjs — pre-warm jsDelivr for one commit BEFORE it goes live.
// ----------------------------------------------------------------------------
// jsDelivr serves a brand-new commit "cold": every file is fetched from GitHub
// on its first request (3–7 s each, and the loader needs ~18 files in a chain).
// Whoever opens the site right after a release would stare at a spinner for
// 10+ seconds. Requesting every asset a few times through each jsDelivr host
// BEFORE the manifest is switched moves that cost onto the release, not onto
// the first visitors.
//
// Asset lists are read from the loader itself (CSS / JS_SEQUENCE / TEMPLATE_URL)
// so they never drift. Best-effort: failures are reported, never fatal.
// ============================================================================
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HOSTS = ["cdn.jsdelivr.net", "fastly.jsdelivr.net", "gcore.jsdelivr.net", "testingcf.jsdelivr.net"];
const PASSES = 3;

function listFrom(source, varName) {
  const m = new RegExp("var\\s+" + varName + "\\s*=\\s*(\\[[\\s\\S]*?\\]|\"[^\"]+\")\\s*;").exec(source);
  if (!m) return [];
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

export async function warmJsdelivr(hash, loaderRelPath, log = console.log) {
  const src = readFileSync(resolve(ROOT, loaderRelPath), "utf8");
  const files = new Set([loaderRelPath, ...listFrom(src, "CSS"), ...listFrom(src, "JS_SEQUENCE"), ...listFrom(src, "TEMPLATE_URL")]);
  const list = [...files];
  log(`\nPre-warming jsDelivr (${list.length} files × ${HOSTS.length} hosts × ${PASSES} passes)…`);

  let failed = 0;
  const t0 = Date.now();
  for (let pass = 1; pass <= PASSES; pass++) {
    const jobs = [];
    for (const host of HOSTS) {
      for (const f of list) {
        const url = `https://${host}/gh/SLASHOO/skymotion-library-pro@${hash}/${f}`;
        jobs.push(
          fetch(url, { cache: "no-store", signal: AbortSignal.timeout(60000) })
            .then((r) => { if (!r.ok && pass === PASSES && host === HOSTS[0]) failed++; return r.arrayBuffer(); })
            .catch(() => { if (pass === PASSES && host === HOSTS[0]) failed++; })
        );
      }
    }
    await Promise.all(jobs);
  }
  log(`  ✓ warm-up finished in ${((Date.now() - t0) / 1000).toFixed(1)}s` + (failed ? `  (⚠ ${failed} file(s) failed on the main host)` : ""));
}
