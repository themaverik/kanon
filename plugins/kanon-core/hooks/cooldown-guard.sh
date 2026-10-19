#!/usr/bin/env bash
# If stdin is a terminal (run by hand, no piped payload), there's nothing to check
[ -t 0 ] && exit 0

input=$(cat)
cmd=$(printf '%s' "$input" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null)

if printf '%s' "$cmd" | grep -Eqi '(no-min-release-age|min-release-age[= ]*0|minimum-release-age[= ]*0|minimumReleaseAge[= ]*0|npmMinimalAgeGate[= ]*0)'; then
  echo "Blocked: refusing to bypass the install cooldown. Remove the override and retry." >&2
  exit 2
fi
exit 0