// Edit the daily puzzle word lists without committing them as plain text.
//
//   node scripts/daily-words.mjs decode <en|el>          print the list, one word per line
//   node scripts/daily-words.mjs encode <en|el> <file>   write src/daily/words.<lang>.dat from a plain list
//
// Light obfuscation only (XOR with a fixed key, then base64), see
// src/daily/wordCodec.ts. Word order matters: it decides which word each day gets.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Keep in sync with WORD_KEY in src/daily/wordCodec.ts.
const KEY = Buffer.from("braille-buddy/daily", "utf8");

export const encode = (words) => {
  const bytes = Buffer.from(words.join("\n"), "utf8");
  return Buffer.from(bytes.map((byte, index) => byte ^ KEY[index % KEY.length])).toString("base64");
};

export const decode = (text) => {
  const bytes = Buffer.from(text.trim(), "base64");
  return Buffer.from(bytes.map((byte, index) => byte ^ KEY[index % KEY.length]))
    .toString("utf8")
    .split("\n");
};

const datPath = (lang) => fileURLToPath(new URL(`../src/daily/words.${lang}.dat`, import.meta.url));

const main = () => {
  const [command, lang, file] = process.argv.slice(2);
  if (!["en", "el"].includes(lang) || (command === "encode" && !file) || !["decode", "encode"].includes(command)) {
    console.error("usage: daily-words.mjs decode <en|el> | encode <en|el> <file>");
    process.exit(1);
  }
  if (command === "decode") {
    console.log(decode(readFileSync(datPath(lang), "utf8")).join("\n"));
  } else {
    const words = readFileSync(file, "utf8").split("\n").map((w) => w.trim()).filter(Boolean);
    writeFileSync(datPath(lang), encode(words) + "\n");
    console.error(`wrote ${words.length} words to ${datPath(lang)}`);
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
