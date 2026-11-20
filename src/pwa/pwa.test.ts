// @vitest-environment node
import { readFileSync } from "node:fs";
import { cacheVersion, lazyFiles, precacheList, serviceWorkerSource } from "./serviceWorkerPlugin";
import { registerServiceWorker } from "./register";

describe("precacheList", () => {
  it("caches index.html as ./ and skips host config and the worker itself", () => {
    expect(
      precacheList(["index.html", "assets/index-abc.js", "sw.js", "_headers", "manifest.json"])
    ).toEqual(["./", "assets/index-abc.js", "manifest.json"]);
  });
});

describe("lazy chunks", () => {
  const bundle = {
    "index.js": {
      type: "chunk" as const,
      fileName: "assets/index.js",
      isEntry: true,
      imports: ["assets/shared.js"],
      viteMetadata: { importedCss: new Set(["assets/index.css"]) },
    },
    "shared.js": { type: "chunk" as const, fileName: "assets/shared.js", imports: [] },
    "account.js": {
      type: "chunk" as const,
      fileName: "assets/account.js",
      imports: ["assets/shared.js", "assets/supabase.js"],
      viteMetadata: { importedCss: new Set(["assets/account.css"]) },
    },
    "supabase.js": { type: "chunk" as const, fileName: "assets/supabase.js", imports: [] },
    "index.css": { type: "asset" as const, fileName: "assets/index.css" },
  };

  it("finds chunks only reached through import(), with their CSS", () => {
    expect([...lazyFiles(bundle)].sort()).toEqual([
      "assets/account.css",
      "assets/account.js",
      "assets/supabase.js",
    ]);
  });

  it("leaves lazy files out of the precache, so only players who use them download them", () => {
    expect(
      precacheList(
        ["index.html", "assets/index.js", "assets/shared.js", "assets/account.js"],
        lazyFiles(bundle)
      )
    ).toEqual(["./", "assets/index.js", "assets/shared.js"]);
  });
});

describe("cacheVersion", () => {
  const files = [
    { path: "index.html", content: "<html>" },
    { path: "assets/a.js", content: "a" },
  ];

  it("does not depend on file order", () => {
    expect(cacheVersion(files)).toBe(cacheVersion([...files].reverse()));
  });

  it("changes when any file's content changes", () => {
    expect(cacheVersion([files[0], { path: "assets/a.js", content: "b" }])).not.toBe(
      cacheVersion(files)
    );
  });

  it("changes when a file is renamed", () => {
    expect(cacheVersion([files[0], { path: "assets/b.js", content: "a" }])).not.toBe(
      cacheVersion(files)
    );
  });
});

describe("serviceWorkerSource", () => {
  it("defines the constants the template uses", () => {
    const template = readFileSync(new URL("./sw.js", import.meta.url), "utf8");
    const source = serviceWorkerSource(template, "v1", ["./", "assets/a.js"]);
    expect(source).toMatch(/^const VERSION = "v1";\nconst PRECACHE = \[/);
    expect(source).toContain('"assets/a.js"');
    // The generated worker must at least parse.
    expect(() => new Function(source)).not.toThrow();
  });
});

describe("service worker fetch handling", () => {
  /** Runs the worker with a fake scope and returns what it did with a request. */
  const handle = (url: string, init: { method?: string; mode?: string } = {}) => {
    const template = readFileSync(new URL("./sw.js", import.meta.url), "utf8");
    const listeners: Record<string, (event: unknown) => void> = {};
    const self = {
      location: { origin: "https://braille-buddy.example" },
      addEventListener: (type: string, listener: (event: unknown) => void) => {
        listeners[type] = listener;
      },
    };
    const caches = { match: vi.fn(() => Promise.resolve(undefined)) };
    const fetch = vi.fn(() => Promise.resolve(new Response("ok")));
    new Function("self", "caches", "fetch", "Request", "URL", "setTimeout",
      serviceWorkerSource(template, "v1", ["./"])
    )(self, caches, fetch, Request, URL, setTimeout);
    const respondWith = vi.fn();
    listeners.fetch({
      request: { url, method: init.method ?? "GET", mode: init.mode ?? "cors" },
      respondWith,
    });
    return respondWith;
  };

  it("never handles requests to Supabase", () => {
    expect(handle("https://hynbvcxulcklilmeqjtj.supabase.co/rest/v1/player_progress")).not.toHaveBeenCalled();
    expect(
      handle("https://hynbvcxulcklilmeqjtj.supabase.co/auth/v1/otp", { method: "POST" })
    ).not.toHaveBeenCalled();
  });

  it("answers the sign-in link's page load, so the app opens", () => {
    expect(
      handle("https://braille-buddy.example/?token_hash=abc&type=email", { mode: "navigate" })
    ).toHaveBeenCalled();
  });
});

describe("registerServiceWorker", () => {
  const fakeWindow = (serviceWorker?: object, readyState = "complete") => {
    const listeners: (() => void)[] = [];
    const win = {
      navigator: serviceWorker ? { serviceWorker } : {},
      document: { readyState },
      addEventListener: (_: string, listener: () => void) => listeners.push(listener),
    };
    return { win: win as unknown as Window, listeners };
  };

  it("does nothing outside production builds", () => {
    const register = vi.fn(() => Promise.resolve());
    registerServiceWorker(false, fakeWindow({ register }).win);
    expect(register).not.toHaveBeenCalled();
  });

  it("does nothing when service workers are unsupported", () => {
    const { win, listeners } = fakeWindow();
    expect(() => registerServiceWorker(true, win)).not.toThrow();
    expect(listeners).toHaveLength(0);
  });

  it("waits for the load event", () => {
    const register = vi.fn(() => Promise.resolve());
    const { win, listeners } = fakeWindow({ register }, "loading");
    registerServiceWorker(true, win);
    expect(register).not.toHaveBeenCalled();
    listeners.forEach((listener) => listener());
    expect(register).toHaveBeenCalledWith("/sw.js");
  });

  it("swallows registration failures", async () => {
    const rejected = vi.fn(() => Promise.reject(new Error("blocked")));
    expect(() => registerServiceWorker(true, fakeWindow({ register: rejected }).win)).not.toThrow();
    const throwing = vi.fn(() => {
      throw new Error("SecurityError");
    });
    expect(() => registerServiceWorker(true, fakeWindow({ register: throwing }).win)).not.toThrow();
    await Promise.resolve();
  });
});
