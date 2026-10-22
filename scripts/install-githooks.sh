#!/usr/bin/env bash
# Run from inside a target repo. Points core.hooksPath at a repo-local .githooks
# dir containing the standard's git hooks (committed, so the whole team gets them).
set -e
SRC="$(dirname "$0")/../plugins"
DIR=$(find "$SRC" -type d -path "*core/templates/githooks" | head -1)
[ -n "$DIR" ] || { echo "hook templates not found; run from the marketplace checkout" >&2; exit 1; }

mkdir -p .githooks
installed=""
for h in "$DIR"/*; do
  [ -f "$h" ] || continue
  name=$(basename "$h")
  cp "$h" ".githooks/$name"
  chmod +x ".githooks/$name"
  installed="$installed $name"
done
git config core.hooksPath .githooks

echo "Installed:$installed"
echo "Commit .githooks/ so the team shares it; each clone runs: git config core.hooksPath .githooks"
echo
echo "pre-commit strips invisible Unicode from staged code and docs via the watermarks"
echo "service (WATERMARKS_SERVICE_URL, default http://127.0.0.1:8765). It fails open when"
echo "the service is down. Bypass once with: SKIP_WATERMARK_HOOK=1 git commit ..."
echo
echo "commit-msg strips AI attribution trailers (Co-Authored-By: Claude, \"Generated with\")"
echo "and keeps human co-authors. Bypass once with: SKIP_ATTRIBUTION_HOOK=1 git commit ..."
echo
echo "pre-commit also blocks new Markdown names that break the doc naming convention."
echo "Vendored trees go in .docnames-exempt. Bypass once with: ALLOW_DOC_NAME=1 git commit ..."
echo
echo "pre-push blocks pushes whose outgoing commits add secrets (key patterns, private"
echo "keys, dotenv files; extend with BANNED='term1|term2'). Findings print masked."
echo "Bypass once with: SKIP_SECRET_HOOK=1 git push ..."
