#!/usr/bin/env bash
# CI gate: fail if banned terms (personal/project provenance) appear anywhere.
# Extend BANNED with org internal codenames before publishing.
set -u
BANNED="${BANNED:-\.superpowers|\.serena|flowable|example-platform|\bECC\b|werkflow}"
# artifact-guard names the session dirs it blocks, so it must contain them.
if grep -rniE "$BANNED" --exclude-dir=.git --exclude="leak-check.sh" --exclude="artifact-guard.sh" .; then
  echo "leak-check FAILED: banned terms found above." >&2; exit 1
fi
echo "leak-check clean"
