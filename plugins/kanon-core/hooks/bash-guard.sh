#!/usr/bin/env bash
# PreToolUse guard for Bash. One script so each command pays for one python3
# parse, not three. Checks keep their old names in block messages.
[ -t 0 ] && exit 0
input=$(cat)
# Single quotes around the python3 -c argument are load-bearing. With double
# quotes the shell strips the inner ones, python raises NameError, cmd comes back
# empty and every check silently passes. env-mutation-guard did that until 2026-09-04.
cmd=$(printf '%s' "$input" | python3 -c 'import json,sys;print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null)
[ -z "$cmd" ] && exit 0

block() { echo "$1" >&2; exit 2; }

cooldown_guard() {
  if printf '%s' "$cmd" | grep -Eqi '(no-min-release-age|min-release-age[= ]*0|minimum-release-age[= ]*0|minimumReleaseAge[= ]*0|npmMinimalAgeGate[= ]*0)'; then
    block "Blocked by cooldown-guard: refusing to bypass the install cooldown. Remove the override and retry."
  fi
}

# Agents implement code; they do not mutate the environment silently.
env_mutation_guard() {
  [ "${ALLOW_ENV_MUTATION:-0}" = "1" ] && return
  if printf '%s' "$cmd" | grep -Eq '(^|[;&| ])(docker|podman)[[:space:]]+(run|start|stop|rm|compose[[:space:]]+(up|down|rm)|volume[[:space:]]+rm|system[[:space:]]+prune)'; then
    block "Blocked by env-mutation-guard: container lifecycle changes require ask-first. State what you need started or torn down and why, then request approval (ALLOW_ENV_MUTATION=1)."
  fi
  if printf '%s' "$cmd" | grep -Eq '(systemctl|service)[[:space:]]+(start|stop|restart)'; then
    block "Blocked by env-mutation-guard: service lifecycle requires ask-first."
  fi
  if printf '%s' "$cmd" | grep -Eqi '(psql|mysql|mongosh)[^|]*(-c|--command|eval)?[^|]*\b(drop|truncate|create[[:space:]]+database|createdb|dropdb|delete[[:space:]]+from)\b'; then
    block "Blocked by env-mutation-guard: destructive DB command requires ask-first. SELECT/\\d inspection queries are allowed."
  fi
}

# A ticket key in the branch name covers every commit on it. Otherwise the
# inline message must carry the key. Editor-composed messages are skipped.
ticket_guard() {
  [ "${TICKET_GUARD:-1}" = "0" ] && return
  printf '%s' "$cmd" | grep -Eq '(^|[;&| ])git[[:space:]]+commit' || return
  printf '%s' "$cmd" | grep -Eq -- '--amend|--fixup|--continue|--no-edit' && return
  local regex="${TICKET_REGEX:-[A-Z][A-Z0-9]+-[0-9]+}" branch
  branch=$(git branch --show-current 2>/dev/null)
  [ -n "$branch" ] && printf '%s' "$branch" | grep -Eq "$regex" && return
  printf '%s' "$cmd" | grep -Eq -- '(-m|--message)' || return
  if ! printf '%s' "$cmd" | grep -Eq "$regex"; then
    block "Blocked by ticket-guard: branch '$branch' has no ticket key and the commit message lacks one (pattern: $regex). Either work on a keyed branch (type/PROJ-123-slug) or include the key in the message."
  fi
}

cooldown_guard
env_mutation_guard
ticket_guard
exit 0
