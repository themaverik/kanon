#!/usr/bin/env bash
# Ticket traceability, branch-first:
#   1. Branch name contains a ticket key (e.g. feat/PROJ-123-slug) -> all commits
#      on it pass, no message requirement. This is the normal path.
#   2. Otherwise (main, ad-hoc branch) -> the inline commit message must contain
#      the key.
# Override pattern: TICKET_REGEX='...'   Disable: TICKET_GUARD=0
[ -t 0 ] && exit 0
[ "${TICKET_GUARD:-1}" = "0" ] && exit 0
input=$(cat)
cmd=$(printf '%s' "$input" | python3 -c "import json,sys;print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null)
[ -z "$cmd" ] && exit 0
printf '%s' "$cmd" | grep -Eq '(^|[;&| ])git[[:space:]]+commit' || exit 0
printf '%s' "$cmd" | grep -Eq -- '--amend|--fixup|--continue|--no-edit' && exit 0

regex="${TICKET_REGEX:-[A-Z][A-Z0-9]+-[0-9]+}"

# Branch-first: key in branch name satisfies traceability for every commit on it
branch=$(git branch --show-current 2>/dev/null)
if [ -n "$branch" ] && printf '%s' "$branch" | grep -Eq "$regex"; then
  exit 0
fi

# No keyed branch: require the key in an inline message (editor-composed skipped)
printf '%s' "$cmd" | grep -Eq -- '(-m|--message)' || exit 0
if ! printf '%s' "$cmd" | grep -Eq "$regex"; then
  echo "Blocked by ticket-guard: branch '$branch' has no ticket key and the commit message lacks one (pattern: $regex). Either work on a keyed branch (type/PROJ-123-slug) or include the key in the message." >&2
  exit 2
fi
exit 0
