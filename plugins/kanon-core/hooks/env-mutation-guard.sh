#!/usr/bin/env bash
# Env-mutation guard. Agents implement code; they do not mutate the environment
# silently. Blocks container/service lifecycle and destructive DB commands unless
# ALLOW_ENV_MUTATION=1 is set for the session (main context grants it deliberately).
[ -t 0 ] && exit 0
[ "${ALLOW_ENV_MUTATION:-0}" = "1" ] && exit 0

input=$(cat)
# Single quotes inside the double-quoted python3 -c argument are load-bearing. With
# double quotes the shell strips them, python raises NameError, cmd comes back empty
# and this guard silently passes everything. It did exactly that until 2026-09-04.
cmd=$(printf '%s' "$input" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null)
[ -z "$cmd" ] && exit 0

# Container / service lifecycle
if printf '%s' "$cmd" | grep -Eq '(^|[;&| ])(docker|podman)[[:space:]]+(run|start|stop|rm|compose[[:space:]]+(up|down|rm)|volume[[:space:]]+rm|system[[:space:]]+prune)'; then
  echo "Blocked by env-mutation-guard: container lifecycle changes require ask-first. State what you need started or torn down and why, then request approval (ALLOW_ENV_MUTATION=1)." >&2
  exit 2
fi
if printf '%s' "$cmd" | grep -Eq '(systemctl|service)[[:space:]]+(start|stop|restart)'; then
  echo "Blocked by env-mutation-guard: service lifecycle requires ask-first." >&2
  exit 2
fi
# Destructive DB commands (reads are fine)
if printf '%s' "$cmd" | grep -Eqi '(psql|mysql|mongosh)[^|]*(-c|--command|eval)?[^|]*\b(drop|truncate|create[[:space:]]+database|createdb|dropdb|delete[[:space:]]+from)\b'; then
  echo "Blocked by env-mutation-guard: destructive DB command requires ask-first. SELECT/\\d inspection queries are allowed." >&2
  exit 2
fi
exit 0
