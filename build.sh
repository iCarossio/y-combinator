#!/usr/bin/env bash
# Build the typeset PDF from Markdown — one command, from a clean checkout.
#
#   ./build.sh
#
# Output: dist/How-to-Get-Into-Y-Combinator.pdf
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "✗ Node.js is required (https://nodejs.org). Aborting." >&2
  exit 1
fi

# Install dependencies if they are not present.
if [ ! -d node_modules ]; then
  echo "→ Installing dependencies…"
  npm ci 2>/dev/null || npm install
fi

# Ensure self-hosted fonts exist (idempotent).
node book/fetch-fonts.mjs

# Build the book.
node book/build.mjs

echo ""
echo "✓ Done → dist/How-to-Get-Into-Y-Combinator.pdf"
