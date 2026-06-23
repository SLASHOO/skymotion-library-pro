// build.mjs — run the full deployment build (Home + Library).
// Usage: node build/build.mjs
// Reproduces every current deployment output at its existing live path by
// byte-copying from src/. No banners injected; loaders/snippets/pins untouched.
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildHome } from "./build-home.mjs";
import { buildLibrary } from "./build-library.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const home = buildHome(ROOT);
const lib = buildLibrary(ROOT);
console.log(`[build] done — ${home + lib} file(s) written (home: ${home}, library: ${lib}).`);
