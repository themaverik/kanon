#!/usr/bin/env bash
# Generate every editor dialect into dist/ (git-ignored). CI runs it to prove generation works.
set -euo pipefail
cd "$(dirname "$0")/.."
stacks=java,java-airails,ts,web,web-design,rust,tools
for t in claude cursor vscode antigravity codex; do
  mkdir -p "dist/$t"
  rm -f "dist/$t/AGENTS.md"
  legacy=""
  [ "$t" = antigravity ] && legacy=--legacy-agent-dir
  python3 scripts/sync-editors.py --repo "dist/$t" --stacks "$stacks" --tools "$t" $legacy >/dev/null
done
cp plugins/kanon-core/templates/AGENTS.md dist/AGENTS.md
