// build-library.mjs — reproduce Pro Library deployment outputs from src/library/
// (pure byte copy). Zero dependencies. Outputs land at their existing live paths
// (webflow/ + repo root); no banners injected.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SPLIT_CSS = [
  "sm-tokens", "sm-layout", "sm-cards", "sm-filters", "sm-player-modal",
  "sm-responsive-mobile", "sm-filter-mobile", "sm-subscreens", "sm-desktop",
  "sm-pack-detail", "sm-skin",
];

// [ source (edit here) , deployment output (live path; do not hand-edit) ]
export const LIBRARY_MAP = [
  ["src/library/library.html",    "webflow/library-template.html"],
  ["src/library/enhancements.js", "webflow/library-enhancements.js"],
  ["src/library/library.css",     "library-pro.css"],
  ["src/library/library.js",      "library-pro.js"],
  ["src/library/plan-viewer.css", "plan-viewer-v3.css"],
  ["src/library/plan-viewer.js",  "plan-viewer-v3.js"],
  ...SPLIT_CSS.map((n) => [`src/library/css/${n}.css`, `css/${n}.css`]),
];

export function buildLibrary(root = ROOT, log = console.log) {
  for (const [src, out] of LIBRARY_MAP) {
    const from = resolve(root, src);
    const to = resolve(root, out);
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to); // byte-for-byte
    log(`lib   ${src}  ->  ${out}`);
  }
  return LIBRARY_MAP.length;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("build-library.mjs")) {
  const n = buildLibrary();
  console.log(`[build-library] ${n} file(s) written.`);
}
