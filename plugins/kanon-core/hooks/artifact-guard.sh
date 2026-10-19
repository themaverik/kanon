#!/usr/bin/env bash
# Repos hold docs about the SYSTEM (ADRs, diagrams, runbooks), never about the
# SESSION. Blocks writing memory/session-tracking artifacts into the repo tree.
[ -t 0 ] && exit 0
input=$(cat)
file=$(printf '%s' "$input" | python3 -c "import json,sys;print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)
[ -z "$file" ] && exit 0
base=$(basename "$file")
case "$file" in
  *"/.superpowers/"*|*"/superpowers/"*) blocked=1 ;;
esac
case "$base" in
  MEMORY.md|Knowledge-Base.md|SESSION*.md|PROGRESS*.md|SCRATCH*.md|TODO-session*.md) blocked=1 ;;
esac
if [ "${blocked:-0}" = "1" ]; then
  echo "Blocked by artifact-guard: session/memory tracking files do not belong in the repo. Use native memory for session state; use docs/adr/ for decisions." >&2
  exit 2
fi
exit 0
