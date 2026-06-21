// ============================================================================
// build.mjs — turn book/content.md into a typeset PDF via Paged.js.
//
//   node book/build.mjs
//
// Pipeline:  content.md  ->  structured nodes  ->  HTML (build/book.html)
//            ->  pagedjs-cli  ->  dist/How-to-Get-Into-Y-Combinator.pdf
// ============================================================================
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import MarkdownIt from "markdown-it";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const buildDir = resolve(root, "build");
const distDir = resolve(root, "dist");
mkdirSync(buildDir, { recursive: true });
mkdirSync(distDir, { recursive: true });

const cfg = JSON.parse(readFileSync(resolve(__dirname, "book.config.json"), "utf8"));
const md = new MarkdownIt({ html: false, typographer: true, linkify: false });

// ---- Parse content.md into ordered nodes ----------------------------------
// Markers:  <!-- frontmatter: Title -->  <!-- part: Title -->
//           <!-- chapter: Title -->      <!-- closing: Title -->
const raw = readFileSync(resolve(__dirname, "content.md"), "utf8");
const marker = /<!--\s*(frontmatter|part|chapter|closing|author|escape)\s*:\s*([^>]*?)\s*-->/g;

const nodes = [];
let m, last = null, idx = 0;
const cuts = [];
while ((m = marker.exec(raw))) cuts.push({ type: m[1], title: m[2], start: m.index, end: marker.lastIndex });
cuts.forEach((c, i) => {
  const bodyStart = c.end;
  const bodyEnd = i + 1 < cuts.length ? cuts[i + 1].start : raw.length;
  nodes.push({ type: c.type, title: c.title, body: raw.slice(bodyStart, bodyEnd).trim() });
});

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Recurring call-to-action callout (drives readers to the author's LinkedIn and contact page).
const ctaBox = cfg.cta
  ? `<aside class="cta">
  <div class="cta__title">${esc(cfg.cta.title)}</div>
  <p class="cta__text">${esc(cfg.cta.text)}</p>
  <div class="cta__action"><span class="cta__in">in</span><a href="${esc(cfg.linkedinUrl)}">${esc(cfg.cta.action)}</a>${cfg.contactUrl ? `<span class="cta__contact"><a href="${esc(cfg.contactUrl)}">${esc(cfg.contact)}</a></span>` : ""}</div>
</aside>`
  : "";

// ---- Build body HTML + collect TOC ----------------------------------------
let chapterNo = 0;
let currentPart = null;
const toc = []; // {kind:'part'|'chapter'|'front', title, id, num}
let html = "";

for (const n of nodes) {
  const id = slug(n.title) + "-" + (idx++);
  const bodyHtml = md.render(n.body);

  if (n.type === "frontmatter") {
    toc.push({ kind: "front", title: n.title, id });
    html += `
<section class="matter" id="${id}">
  <header class="matter__head"><h2 class="matter__title">${esc(n.title)}</h2></header>
  <div class="body">${bodyHtml}</div>
</section>`;
  } else if (n.type === "part") {
    currentPart = n.title;
    toc.push({ kind: "part", title: n.title, id });
    const partNo = roman(toc.filter((t) => t.kind === "part").length);
    html += `
<section class="part" id="${id}">
  <div class="kicker">Part ${partNo}</div>
  <div class="prule"></div>
  <h2>${esc(n.title)}</h2>
</section>`;
  } else if (n.type === "chapter") {
    chapterNo++;
    toc.push({ kind: "chapter", title: n.title, id, num: chapterNo });
    html += `
<section class="chapter" id="${id}">
  <header class="chapter__head">
    <span class="chapter__num">${chapterNo}</span>
    <h2 class="chapter__title">${esc(n.title)}</h2>
  </header>
  <div class="body">${bodyHtml}${ctaBox}</div>
</section>`;
  } else if (n.type === "closing") {
    toc.push({ kind: "front", title: n.title, id });
    html += `
<section class="matter" id="${id}">
  <header class="matter__head"><h2 class="matter__title">${esc(n.title)}</h2></header>
  <div class="body">${bodyHtml}</div>
</section>`;
  } else if (n.type === "author") {
    toc.push({ kind: "front", title: n.title, id });
    html += `
<section class="matter aboutauthor" id="${id}">
  <header class="matter__head"><h2 class="matter__title">${esc(n.title)}</h2></header>
  <div class="author-card">
    <img class="author-portrait" src="${cfg.authorPhoto}" alt="${esc(cfg.author)}"/>
    <div class="author-meta">
      <p class="author-name">${esc(cfg.author)}</p>
      <p class="author-role">${esc(cfg.authorTagline)}</p>
      <p class="author-creds">${esc(cfg.authorCredentials)}</p>
    </div>
  </div>
  <div class="body"><p>${esc(cfg.authorBio)}</p>${bodyHtml}
    <p class="author-links">${esc(cfg.website)}</p>
  </div>
</section>`;
  } else if (n.type === "escape") {
    toc.push({ kind: "front", title: n.title, id });
    html += `
<section class="matter aboutescape" id="${id}">
  <header class="matter__head"><h2 class="matter__title">${esc(n.title)}</h2></header>
  <div class="escape-mark"><img src="${cfg.escapeLogo}" alt="Escape"/></div>
  <div class="body escape-body"><p>${esc(cfg.escapeBlurb)}</p>${bodyHtml}
    <p class="escape-cta">escape.tech</p>
  </div>
</section>`;
  }
}

// ---- TOC markup (page numbers filled in by Paged.js via target-counter) ----
let tocHtml = `<nav class="toc"><h2>Contents</h2><ol>`;
let openPart = false;
for (const t of toc) {
  if (t.kind === "part") {
    tocHtml += `<li class="toc-part">${esc(t.title)}</li>`;
    openPart = true;
  } else {
    const num = t.kind === "chapter" ? `<span class="num">${t.num}</span>` : `<span class="num"></span>`;
    const cls = t.kind === "front" ? "toc-entry front" : "toc-entry";
    tocHtml += `<li class="${cls}"><a href="#${t.id}">${num}<span class="title">${esc(t.title)}</span><span class="dots"></span></a></li>`;
  }
}
tocHtml += `</ol></nav>`;

// ---- Cover + front matter --------------------------------------------------
const logo = "../assets/y-combinator-logo-vector.svg";
const cover = `
<section class="cover">
  <div class="cover__bigY">Y</div>
  <div class="cover__band">
    <span class="cover__series"><span class="yc-badge">Y</span> ${esc(cfg.spineSeries)}</span>
  </div>
  <div class="cover__title">${esc(cfg.title)}<span class="hl">${esc(cfg.titleHighlight)}</span></div>
  <div class="cover__subtitle">${esc(cfg.subtitle)}</div>
  <div class="cover__author">
    <img src="${cfg.authorPhoto}" alt="${esc(cfg.author)}"/>
    <div class="who">${esc(cfg.author)}<span>${esc(cfg.authorTagline)}</span></div>
  </div>
  <div class="cover__escape">
    <span>Written by the co-founder &amp; CTO of</span>
    <img src="${cfg.escapeLogo}" alt="Escape"/>
  </div>
</section>`;

const titlepage = `
<section class="titlepage">
  <img class="logo" src="${logo}" alt="Y Combinator"/>
  <h1>${esc(cfg.title)}<span class="hl">${esc(cfg.titleHighlight)}</span></h1>
  <div class="rule"></div>
  <p class="sub">${esc(cfg.subtitle)}</p>
  <div class="by">${esc(cfg.author)}<span>${esc(cfg.authorTagline)} &middot; ${esc(cfg.edition)}</span></div>
</section>`;

const copyright = `
<section class="copyright">
  <p><strong>${esc(cfg.title)} ${esc(cfg.titleHighlight)}</strong> &mdash; ${esc(cfg.edition)}.</p>
  <p>Copyright &copy; ${esc(cfg.year)} ${esc(cfg.author)}. All rights reserved.</p>
  <p>This guide reflects the author's personal observations and experience as a YC&nbsp;W23 founder. It is not affiliated with, endorsed by, or representative of Y&nbsp;Combinator. The Y&nbsp;Combinator name and logo are property of their respective owner and used here for reference only.</p>
  <p>Written by ${esc(cfg.author)} &middot; ${esc(cfg.website)}</p>
  <p>Typeset from Markdown with Paged.js. Set in EB&nbsp;Garamond and Inter.</p>
</section>`;

const endmark = `
<section class="colophon-end">
  <img src="${logo}" alt="Y Combinator"/>
  <p>${esc(cfg.backTagline)}</p>
</section>`;

const backcover = `
<section class="backcover">
  <div class="backcover__band">
    <span class="yc-badge">Y</span> ${esc(cfg.spineSeries)}
  </div>
  <div class="backcover__body">
    <p class="lead">${esc(cfg.backTagline)}</p>
    <p class="blurb">${esc(cfg.backBlurb)}</p>
    <ul class="bullets">
      ${cfg.backBullets.map((b) => `<li>${esc(b)}</li>`).join("\n      ")}
    </ul>
  </div>
  <div class="backcover__author">
    <img src="${cfg.authorPhoto}" alt="${esc(cfg.author)}"/>
    <p><strong>${esc(cfg.author)}</strong> is the co-founder &amp; CTO of Escape (YC&nbsp;W23, $18M Series A), a Forbes 30 Under 30 honoree, and a speaker on AI &amp; cybersecurity at RSA, Black Hat, and DEF CON. He went through YC in W23 and has since coached founders into the batch.</p>
  </div>
  <div class="backcover__brand">
    <span>Written by the co-founder &amp; CTO of</span>
    <img src="${cfg.escapeLogo}" alt="Escape"/>
  </div>
  <div class="backcover__foot">${esc(cfg.website)}</div>
</section>`;

// ---- Full document ---------------------------------------------------------
const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${esc(cfg.title)} ${esc(cfg.titleHighlight)}</title>
<link rel="stylesheet" href="../book/style.css"/>
</head>
<body>
${cover}
${titlepage}
${copyright}
${tocHtml}
${html}
${endmark}
${backcover}
</body>
</html>`;

const htmlPath = resolve(buildDir, "book.html");
writeFileSync(htmlPath, doc, "utf8");
console.log(`✓ wrote ${htmlPath}  (${toc.filter((t) => t.kind === "chapter").length} chapters)`);

// ---- Render to PDF ---------------------------------------------------------
if (!existsSync(resolve(root, "book/fonts/eb-garamond-400.woff2"))) {
  console.log("… fonts missing, fetching");
  const f = spawnSync(process.execPath, [resolve(__dirname, "fetch-fonts.mjs")], { stdio: "inherit" });
  if (f.status !== 0) process.exit(f.status ?? 1);
}
const out = resolve(distDir, "How-to-Get-Into-Y-Combinator.pdf");
const cli = resolve(root, "node_modules/pagedjs-cli/src/cli.js");
// Chromium can't use its sandbox inside CI containers (no usable SUID sandbox),
// so launch it with --no-sandbox. Harmless locally.
const r = spawnSync(
  process.execPath,
  [cli, htmlPath, "-o", out, "--browserArgs", "--no-sandbox,--disable-setuid-sandbox"],
  { stdio: "inherit" }
);
if (r.status !== 0) process.exit(r.status ?? 1);
console.log(`✓ built ${out}`);

// ---- helpers ---------------------------------------------------------------
function roman(n) {
  const map = [[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
  let s = ""; for (const [v, sym] of map) while (n >= v) { s += sym; n -= v; } return s;
}
