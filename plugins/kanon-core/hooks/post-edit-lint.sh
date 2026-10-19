#!/usr/bin/env bash
# Fast, silent-on-success lint after edits. Slow verifiers (PIT, Stryker, full
# Sonar) run on demand or in CI, never here.
[ -t 0 ] && exit 0
input=$(cat)
file=$(printf '%s' "$input" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null)
[ -z "$file" ] || [ ! -f "$file" ] && exit 0

case "$file" in
  *.ts|*.tsx|*.js|*.jsx)
    if [ -f biome.json ] || [ -f biome.jsonc ]; then
      npx --no-install biome check "$file" >&2 || exit 2
    elif [ -f .eslintrc.json ] || [ -f eslint.config.js ] || [ -f eslint.config.mjs ]; then
      npx --no-install eslint --max-warnings 0 "$file" >&2 || exit 2
    fi
    ;;
  *.java)
    # Compile-time checkers (Error Prone, ArchUnit) run via the build; here we
    # only fail fast on obvious formatting drift if the repo defines it.
    if [ -x ./mvnw ] && grep -q spotless pom.xml 2>/dev/null; then
      ./mvnw -q spotless:check -DspotlessFiles="$file" >&2 || exit 2
    fi
    ;;
esac
exit 0
