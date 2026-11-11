// @vitest-environment node
import { readFileSync } from "node:fs";
import { cacheVersion, precacheList, serviceWorkerSource } from "./serviceWorkerPlugin";
import { registerServiceWorker } from "./register";

describe("precacheList", () => {
  it("caches index.html as ./ and skips host config and the worker itself", () => {
    expect(
      precacheList(["index.html", "assets/index-abc.js", "sw.js", "_headers", "manifest.json"])
    ).toEqual(["./", "assets/index-abc.js", "manifest.json"]);
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
