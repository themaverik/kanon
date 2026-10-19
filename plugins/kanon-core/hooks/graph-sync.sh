#!/usr/bin/env bash
# Keep the code graph fresh after source edits. No-op when graphify is not
# installed (read protocol degrades to Serena + targeted reads).
# Override the refresh command per repo/org: GRAPH_SYNC_CMD='graphify update'
[ -t 0 ] && exit 0
command -v graphify >/dev/null 2>&1 || exit 0
input=$(cat)
file=$(printf '%s' "$input" | python3 -c "import json,sys;print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)
case "$file" in
  *.java|*.ts|*.tsx|*.js|*.jsx|*.py|*.go|*.rs|*.kt) ;;
  *) exit 0 ;;
esac
# Incremental refresh; never block or fail the edit on graph problems
${GRAPH_SYNC_CMD:-graphify update} "$file" >/dev/null 2>&1 || true
exit 0
