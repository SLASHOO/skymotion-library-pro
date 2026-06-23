// build-home.mjs — reproduce Home deployment outputs from src/home/ (pure byte copy).
// Zero dependencies. Outputs land at their existing live paths; no banners injected.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// [ source (edit here) , deployment output (live path; do not hand-edit) ]
export const HOME_MAP = [
  ["src/home/home.css",  "webflow/home.css"],
  ["src/home/home.js",   "webflow/home.js"],
  ["src/home/home.html", "webflow/home-template.html"],
];

export function buildHome(root = ROOT, log = console.log) {
  for (const [src, out] of HOME_MAP) {
    const from = resolve(root, src);
    const to = resolve(root, out);
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to); // byte-for-byte
    log(`home  ${src}  ->  ${out}`);
  }
  return HOME_MAP.length;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("build-home.mjs")) {
  const n = buildHome();
  console.log(`[build-home] ${n} file(s) written.`);
}
