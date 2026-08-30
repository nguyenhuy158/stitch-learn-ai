#!/bin/bash
# Push airport vocab images to R2.
set -e
cd "$(dirname "$0")/.."
for f in src/data/phrases/airport-30/*.jpg; do
  n=$(basename "$f")
  echo "$n"
  pnpm exec wrangler r2 object put "ai-english-vocab/airport-30/$n" \
    --file "$f" --content-type "image/jpeg" --remote >/dev/null 2>&1 || { echo "FAILED $n"; exit 1; }
done
echo "done"
