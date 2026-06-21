// Copies the exact woff2 files we use from the Fontsource packages into
// book/fonts/, so the build is self-contained and reproducible offline.
import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const out = resolve(__dirname, "fonts");
mkdirSync(out, { recursive: true });

// [package, fontsource-filename, our-filename]
const FILES = [
  ["@fontsource/eb-garamond", "eb-garamond-latin-400-normal.woff2", "eb-garamond-400.woff2"],
  ["@fontsource/eb-garamond", "eb-garamond-latin-400-italic.woff2", "eb-garamond-400-italic.woff2"],
  ["@fontsource/eb-garamond", "eb-garamond-latin-500-normal.woff2", "eb-garamond-500.woff2"],
  ["@fontsource/eb-garamond", "eb-garamond-latin-600-normal.woff2", "eb-garamond-600.woff2"],
  ["@fontsource/eb-garamond", "eb-garamond-latin-600-italic.woff2", "eb-garamond-600-italic.woff2"],
  ["@fontsource/eb-garamond", "eb-garamond-latin-700-normal.woff2", "eb-garamond-700.woff2"],
  ["@fontsource/inter", "inter-latin-400-normal.woff2", "inter-400.woff2"],
  ["@fontsource/inter", "inter-latin-500-normal.woff2", "inter-500.woff2"],
  ["@fontsource/inter", "inter-latin-600-normal.woff2", "inter-600.woff2"],
  ["@fontsource/inter", "inter-latin-700-normal.woff2", "inter-700.woff2"],
  ["@fontsource/inter", "inter-latin-800-normal.woff2", "inter-800.woff2"],
  ["@fontsource/inter", "inter-latin-900-normal.woff2", "inter-900.woff2"],
];

let copied = 0;
for (const [pkg, src, dst] of FILES) {
  const from = resolve(root, "node_modules", pkg, "files", src);
  const to = resolve(out, dst);
  if (!existsSync(from)) {
    console.error(`! missing ${from} — run \`npm install\` first`);
    process.exit(1);
  }
  copyFileSync(from, to);
  copied++;
}
console.log(`✓ copied ${copied} font files into book/fonts/`);
