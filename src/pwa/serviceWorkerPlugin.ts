import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import type { Plugin } from "vite";

// Files in the build folder that are not part of the app: host config and
// the service worker itself.
const SKIP = new Set(["sw.js", "_headers", "_redirects", ".assetsignore"]);

// Turns build-relative file paths into the URLs the service worker caches.
// index.html is cached as "./" because that's the URL navigations use, and
// Cloudflare redirects /index.html to /.
export const precacheList = (files: string[]): string[] =>
  files
    .filter((file) => !SKIP.has(file))
    .map((file) => (file === "index.html" ? "./" : file))
    .sort();

// A short hash of every file's path and content. Any change, even to an
// unhashed file such as manifest.json, gives a new cache name.
export const cacheVersion = (files: { path: string; content: Buffer | string }[]) => {
  const hash = createHash("sha256");
  for (const file of [...files].sort((a, b) => (a.path < b.path ? -1 : 1))) {
    hash.update(file.path).update("\0").update(file.content).update("\0");
  }
  return hash.digest("hex").slice(0, 12);
};

export const serviceWorkerSource = (template: string, version: string, urls: string[]) =>
  `const VERSION = ${JSON.stringify(version)};\n` +
  `const PRECACHE = ${JSON.stringify(urls, null, 2)};\n\n` +
  template;

const listFiles = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)).split(sep).join("/"));

// Writes sw.js after everything else, including the public/ folder, has been
// written, so the precache list is exactly what gets deployed.
export const serviceWorker = (): Plugin => {
  let outDir = "";
  return {
    name: "braille-buddy-service-worker",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const files = listFiles(outDir).filter((file) => !SKIP.has(file));
      const version = cacheVersion(
        files.map((path) => ({ path, content: readFileSync(join(outDir, path)) }))
      );
      const template = readFileSync(new URL("./sw.js", import.meta.url), "utf8");
      writeFileSync(join(outDir, "sw.js"), serviceWorkerSource(template, version, precacheList(files)));
    },
  };
};
