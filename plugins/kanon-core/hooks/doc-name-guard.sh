#!/usr/bin/env bash
# PreToolUse guard for Bash, Write, Edit and MultiEdit: blocks new Markdown names that break the doc
# naming convention. Bash is parsed too, so heredocs, tee, cp and mv cannot slip past.
[ -t 0 ] && exit 0
exec python3 "$(dirname "$0")/../templates/githooks/doc-name-check.py" --hook
