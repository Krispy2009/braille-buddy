import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import type { Plugin } from "vite";

// Files in the build folder that are not part of the app: host config and
// the service worker itself.
const SKIP = new Set(["sw.js", "_headers", "_redirects", ".assetsignore"]);

// Turns build-relative file paths into the URLs the service worker caches.
// index.html is cached as "./" because that's the URL navigations use, and
// Cloudflare redirects /index.html to /. Lazy files (see lazyFiles) are left
// out, so they are only downloaded by players who use them.
export const precacheList = (files: string[], lazy: ReadonlySet<string> = new Set()): string[] =>
  files
    .filter((file) => !SKIP.has(file) && !lazy.has(file))
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

type BundleChunk = {
  type: "chunk" | "asset";
  fileName: string;
  isEntry?: boolean;
  imports?: string[];
  viteMetadata?: { importedCss?: Set<string>; importedAssets?: Set<string> };
};

// Chunks reached only through import(), such as the account code and
// supabase-js, with their CSS. Everything a page loads up front is reached
// from an entry chunk through static imports.
export const lazyFiles = (bundle: Record<string, BundleChunk>): Set<string> => {
  const chunks = Object.values(bundle).filter((item) => item.type === "chunk");
  const byName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
  const eager = new Set<string>();
  const visit = (fileName: string) => {
    if (eager.has(fileName)) return;
    eager.add(fileName);
    const chunk = byName.get(fileName);
    chunk?.viteMetadata?.importedCss?.forEach((css) => eager.add(css));
    chunk?.imports?.forEach(visit);
  };
  chunks.filter((chunk) => chunk.isEntry).forEach((chunk) => visit(chunk.fileName));
  const lazy = new Set<string>();
  for (const chunk of chunks) {
    if (eager.has(chunk.fileName)) continue;
    lazy.add(chunk.fileName);
    chunk.viteMetadata?.importedCss?.forEach((css) => {
      if (!eager.has(css)) lazy.add(css);
    });
  }
  return lazy;
};

const listFiles = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)).split(sep).join("/"));

// Writes sw.js after everything else, including the public/ folder, has been
// written, so the precache list is exactly what gets deployed.
export const serviceWorker = (): Plugin => {
  let outDir = "";
  let lazy = new Set<string>();
  return {
    name: "braille-buddy-service-worker",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    generateBundle(_options, bundle) {
      lazy = lazyFiles(bundle as unknown as Record<string, BundleChunk>);
    },
    closeBundle() {
      const files = listFiles(outDir).filter((file) => !SKIP.has(file));
      const version = cacheVersion(
        files.map((path) => ({ path, content: readFileSync(join(outDir, path)) }))
      );
      const template = readFileSync(new URL("./sw.js", import.meta.url), "utf8");
      writeFileSync(
        join(outDir, "sw.js"),
        serviceWorkerSource(template, version, precacheList(files, lazy))
      );
    },
  };
};
