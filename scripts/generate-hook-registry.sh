#!/bin/bash
# Generate hook-registry.json from the Astro docs content.
# Run this after adding a new hook to keep the registry in sync.
#
# Usage: bash scripts/generate-hook-registry.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCS_DIR="$SCRIPT_DIR/../packages/website-astro/src/content/docs"
OUTPUT="$SCRIPT_DIR/hook-registry.json"

python3 -c "
import os, json, sys

docs_dir = sys.argv[1]
hooks = {}

for root, dirs, files in os.walk(docs_dir):
    for f in files:
        if not f.endswith('.mdx'):
            continue
        rel = os.path.relpath(os.path.join(root, f), docs_dir)
        parts = rel.replace('.mdx', '').split(os.sep)
        if len(parts) == 2:
            category, name = parts
            # Site URLs are lowercase (the canonical form). Keep the original
            # casing as the lookup key, but lowercase the url so links built
            # from the registry match the canonical URL and don't create
            # duplicate camelCase/lowercase pages in Google's index.
            hooks[name] = {
                'category': category,
                'url': f'https://reactuse.com/{category}/{name.lower()}/'
            }

print(json.dumps(dict(sorted(hooks.items())), indent=2))
" "$DOCS_DIR" > "$OUTPUT"

echo "Generated $OUTPUT with $(python3 -c "import json; print(len(json.load(open('$OUTPUT'))))" ) hooks."
