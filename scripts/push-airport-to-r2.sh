#!/bin/bash
# Push airport vocab images to R2. Retry 3 lan vi wrangler thinh thoang loi mang.
set -e
cd "$(dirname "$0")/.."
for f in src/data/phrases/airport-30/*.jpg; do
  n=$(basename "$f")
  for try in 1 2 3; do
    if pnpm exec wrangler r2 object put "ai-english-vocab/airport-30/$n" \
      --file "$f" --content-type "image/jpeg" --remote >/dev/null 2>&1; then
      echo "$n ok"; break
    fi
    [ "$try" = 3 ] && { echo "FAILED $n"; exit 1; }
    sleep 5
  done
done
echo "done"
