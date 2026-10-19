#!/usr/bin/env bash
# CI gate: fail if banned terms (personal/project provenance) appear anywhere.
# Extend BANNED with org internal codenames before publishing.
set -u
BANNED="${BANNED:-.superpowers|.serena}"
if grep -rniE "$BANNED" --exclude-dir=.git --exclude="leak-check.sh" .; then
  echo "leak-check FAILED: banned terms found above." >&2; exit 1
fi
echo "leak-check clean"
