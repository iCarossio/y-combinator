<p align="center">
  <img src="assets/y-combinator-logo-vector.svg" alt="Y Combinator" width="360">
</p>

<h1 align="center">How to Get Into Y Combinator</h1>

<p align="center"><em>A methodical, reverse-engineered guide to the application and the interview.</em></p>

<p align="center">
  <a href="dist/How-to-Get-Into-Y-Combinator.pdf"><strong>📕 Download the book (PDF)</strong></a>
  &nbsp;·&nbsp;
  <a href="https://caross.io">caross.io</a>
</p>

<p align="center">
  <a href="dist/How-to-Get-Into-Y-Combinator.pdf">
    <img src="assets/cover-preview.png" alt="Book cover" width="360">
  </a>
</p>

---

## About

A short, opinionated book on getting into Y Combinator, written by [Antoine Carossio](https://caross.io), co-founder & CTO of [Escape](https://escape.tech) (YC W23, $18M Series A), Forbes 30 Under 30, ex-Apple AI researcher, and a speaker on AI & cybersecurity at RSA, Black Hat, and DEF CON. It treats YC selection the way you'd treat any competitive entrance exam: a process you can reverse-engineer and prepare for. It covers the written application, the PMF framework behind answering any question, specificity, recommendations, and the interview.

The prose lives in plain Markdown and is typeset into a polished, book-style PDF automatically.

## Read it

- **PDF:** [`dist/How-to-Get-Into-Y-Combinator.pdf`](dist/How-to-Get-Into-Y-Combinator.pdf), the typeset book.
- **Source:** [`book/content.md`](book/content.md), the same text in Markdown.

## Build it yourself

One command, from a clean checkout (requires [Node.js](https://nodejs.org) 18+):

```bash
./build.sh
```

That installs dependencies, fetches the fonts, and renders the PDF to `dist/`.

To rebuild after editing the text:

```bash
npm run build
```

## How the pipeline works

```
book/content.md   ──▶  book/build.mjs  ──▶  build/book.html  ──▶  pagedjs-cli  ──▶  dist/*.pdf
   (your prose)        (assemble +           (paginated,          (headless
                        markdown-it)          styled HTML)         Chromium)
```

| File | Role |
| --- | --- |
| `book/content.md` | The single source of truth for the text. Chapters and parts are marked with simple `<!-- chapter: … -->` / `<!-- part: … -->` comments. |
| `book/book.config.json` | Title, subtitle, author, blurbs, and cover/back-cover copy. |
| `book/style.css` | The book design: trade-paperback page geometry, EB Garamond / Inter, drop caps, small-caps chapter heads, running heads, auto table of contents. |
| `book/build.mjs` | Parses the content, renders Markdown, assembles the full HTML, and drives Paged.js to produce the PDF. |
| `book/fetch-fonts.mjs` | Copies the exact font files used into `book/fonts/` for reproducible, offline builds. |
| `.github/workflows/build-book.yml` | CI: rebuilds the PDF on every change and commits it back, so the download link is always current. |

### Editing the book

- **Change the text:** edit `book/content.md`.
- **Add a chapter:** add a `<!-- chapter: My Title -->` marker followed by Markdown.
- **Add a part:** add a `<!-- part: My Part -->` marker.
- **Change titles / cover copy:** edit `book/book.config.json`.
- **Tweak the design:** edit `book/style.css`.

Then run `npm run build`.

## Questions?

Contact me on LinkedIn: [linkedin.com/in/acarossio](https://www.linkedin.com/in/acarossio), or reach out through my contact page at [caross.io/contact](https://caross.io/contact/).

---

<sub>This guide reflects the author's personal observations and experience. It is not affiliated with, endorsed by, or representative of Y Combinator. The Y Combinator name and logo are property of their respective owner and used here for reference only.</sub>
