// Draws the Press app icon and writes every icon file in public/.
//
//   node scripts/generate-icons.mjs
//
// Needs Playwright with its Chromium (not a dependency of the app):
//   npx -p playwright playwright install chromium   (once)
//
// The icon is an orange letter card with an ink outline and a hard offset
// shadow, holding a braille cell for "b" (dots 1 and 2 raised, the other
// four drawn as small flat marks).
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const PUBLIC = fileURLToPath(new URL("../public/", import.meta.url));

const PAPER = "#ECEAE4";
const INK = "#1A1A1A";
const ORANGE = "#FF5A1F";

// The card drawn in a 512 unit square. `scale` shrinks it around the
// centre (for the maskable safe zone); `background` fills the square.
const iconSvg = ({ scale = 1, background = PAPER, size = 512 } = {}) => {
  const card = 330;
  const shadow = 24;
  const stroke = 14;
  const radius = 58;
  // Centre the card together with its shadow.
  const x = (512 - card - shadow) / 2;
  const y = x;
  const cx = x + card / 2;
  const cy = y + card / 2;
  const colGap = 56;
  const rowGap = 84;
  const raised = new Set([1, 2]);
  const dots = [1, 2, 3, 4, 5, 6]
    .map((n) => {
      const dx = n <= 3 ? -colGap : colGap;
      const dy = (((n - 1) % 3) - 1) * rowGap;
      return raised.has(n)
        ? `<circle cx="${cx + dx}" cy="${cy + dy}" r="34" fill="${INK}"/>`
        : `<circle cx="${cx + dx}" cy="${cy + dy}" r="11" fill="${INK}"/>`;
    })
    .join("");
  const bg = background
    ? `<rect width="512" height="512" fill="${background}"/>`
    : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">` +
    bg +
    `<g transform="translate(256 256) scale(${scale}) translate(-256 -256)">` +
    `<rect x="${x + shadow}" y="${y + shadow}" width="${card}" height="${card}" rx="${radius}" fill="${INK}"/>` +
    `<rect x="${x}" y="${y}" width="${card}" height="${card}" rx="${radius}" fill="${ORANGE}" stroke="${INK}" stroke-width="${stroke}"/>` +
    dots +
    `</g></svg>`
  );
};

// A favicon is the card alone, filling the square, on a transparent
// background so it sits well on light and dark browser tabs.
const faviconSvg = (size = 512) => iconSvg({ scale: 1.32, background: null, size });

const PNGS = [
  { file: "icon-192.png", size: 192, svg: iconSvg },
  { file: "icon-512.png", size: 512, svg: iconSvg },
  // Maskable: everything inside the central 80% circle, paper to the edge.
  { file: "icon-maskable-512.png", size: 512, svg: (o) => iconSvg({ ...o, scale: 0.84 }) },
  { file: "apple-touch-icon.png", size: 180, svg: iconSvg },
];
const ICO_SIZES = [16, 32, 48];

// An ICO file holding PNG images (supported by every current browser).
const ico = (pngs) => {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...pngs.map(({ data }) => data)]);
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const render = async (svg, size, transparent) => {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block}</style>${svg}`
    );
    return page.screenshot({ omitBackground: transparent, clip: { x: 0, y: 0, width: size, height: size } });
  };

  for (const { file, size, svg } of PNGS) {
    writeFileSync(PUBLIC + file, await render(svg({ size }), size, false));
  }
  const icoImages = [];
  for (const size of ICO_SIZES) {
    icoImages.push({ size, data: await render(faviconSvg(size), size, true) });
  }
  writeFileSync(PUBLIC + "favicon.ico", ico(icoImages));
  writeFileSync(PUBLIC + "favicon.svg", faviconSvg().replace(/ width="512" height="512"/, "") + "\n");
} finally {
  await browser.close();
}
