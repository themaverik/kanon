#!/usr/bin/env bash
# Regenerate dist/ for every editor. CI runs this and fails on any diff.
set -euo pipefail
cd "$(dirname "$0")/.."
stacks=java,java-airails,ts,web,rust,tools
for t in claude cursor vscode antigravity codex; do
  rm -f "dist/$t/AGENTS.md"
  legacy=""
  [ "$t" = antigravity ] && legacy=--legacy-agent-dir
  python3 scripts/sync-editors.py --repo "dist/$t" --stacks "$stacks" --tools "$t" $legacy >/dev/null
done
cp plugins/kanon-core/templates/AGENTS.md dist/AGENTS.md
