#!/usr/bin/env bats
# Fake secrets are assembled at runtime so no secret-shaped literal sits in the repo.

LIB="$BATS_TEST_DIRNAME/../plugins/kanon-memory/lib"
HOOK="$BATS_TEST_DIRNAME/../plugins/kanon-memory/hooks/capture.sh"
AWS_KEY="AKIA$(printf 'Q%.0s' {1..16})"
VALID_AADHAAR="2345 6789 0124"

scan() { python3 -c "import sys;sys.path.insert(0,'$LIB');import memfilter as m;t,f=m.scan(sys.argv[1]);print(m.verdict(f));print(t)" "$1"; }

setup_repo() {
  export KANON_MEMORY_PROJECTS="$BATS_TEST_TMPDIR/projects"
  REPO="$BATS_TEST_TMPDIR/repo"
  git init -q -b feat/PROJ-1-x "$REPO"
  mkdir -p "$REPO/src" && printf 'a\nb\nc\n' > "$REPO/src/app.ts"
  (cd "$REPO" && git add -A && git -c user.email=t@t -c user.name=t commit -qm "PROJ-1: init")
  MEM="$KANON_MEMORY_PROJECTS/$(printf '%s' "$REPO" | sed 's/[^A-Za-z0-9]/-/g')/memory"
  mkdir -p "$MEM"
}

@test "filter blocks a cloud key" {
  run scan "deploy uses $AWS_KEY in src/app.ts:2"
  [ "${lines[0]}" = "block" ]
}

@test "filter masks email, phone, PAN, GSTIN and a valid Aadhaar" {
  run scan "owner ravi@corp.in +91 9876543210 ABCDE1234F 22ABCDE1234F1Z5 $VALID_AADHAAR"
  [ "${lines[0]}" = "mask" ]
  [[ "${lines[1]}" == *"<EMAIL>"*"<PHONE_IN>"*"<PAN>"*"<GSTIN>"*"<AADHAAR>"* ]]
  [[ "${lines[1]}" != *"ravi@"* ]]
}

@test "filter leaves an invalid Aadhaar checksum alone" {
  run scan "order 2345 6789 0125 shipped"
  [ "${lines[0]}" = "clean" ]
}

@test "filter holds legal keywords and blocks invisible unicode" {
  run scan "see court order in src/app.ts:1"
  [ "${lines[0]}" = "hold" ]
  run scan "$(printf 'rule\xe2\x80\x8b text')"
  [ "${lines[0]}" = "block" ]
}

@test "capture keeps cited lines only, withholds secrets, and changes nothing it reads" {
  setup_repo
  printf -- '---\nname: x\n---\n- retries live in `src/app.ts:2`\n- uncited preference\n- key %s at src/app.ts:1\n' "$AWS_KEY" > "$MEM/fact.md"
  before=$(shasum "$MEM/fact.md")
  run bash -c "printf '{\"cwd\":\"%s\"}' '$REPO' | '$HOOK'"
  [ "$status" -eq 0 ]
  [ "$(shasum "$MEM/fact.md")" = "$before" ]
  cand="$(dirname "$MEM")/kanon-memory-candidates.jsonl"
  [ "$(wc -l < "$cand" | tr -d ' ')" -eq 2 ]
  python3 -c "import json,sys;c=[json.loads(l) for l in open(sys.argv[1])];assert any(x[\"status\"]==\"block\" and x[\"text\"] is None for x in c)" "$cand"
  run grep -q "$AWS_KEY" "$cand"
  [ "$status" -ne 0 ]
  [ -z "$(git -C "$REPO" status --porcelain)" ]
}

@test "capture is idempotent across sessions" {
  setup_repo
  printf -- '- retries live in src/app.ts:2\n' > "$MEM/fact.md"
  printf '{"cwd":"%s"}' "$REPO" | "$HOOK"
  printf '{"cwd":"%s"}' "$REPO" | "$HOOK"
  [ "$(wc -l < "$(dirname "$MEM")/kanon-memory-candidates.jsonl" | tr -d ' ')" -eq 1 ]
}

check_entry() {
  setup_repo
  mkdir -p "$REPO/.claude/rules/learned"
  printf -- '%s\n' "$1" > "$REPO/.claude/rules/learned/app.md"
  cd "$REPO" && run python3 "$LIB/memory-check.py" .claude/rules/learned/app.md
}

@test "memory-check passes a cited, keyed, unexpired, masked entry" {
  check_entry '- retries are owned by <EMAIL> (`src/app.ts:2`) [PROJ-1, expires 2999-01-01]'
  [ "$status" -eq 0 ]
}

@test "memory-check rejects missing citation, dead line, expiry and unmasked data" {
  check_entry '- no citation here [PROJ-1, expires 2999-01-01]'
  [ "$status" -eq 3 ]
  check_entry '- dead (`src/app.ts:99`) [PROJ-1, expires 2999-01-01]'
  [ "$status" -eq 3 ]
  check_entry '- old (`src/app.ts:1`) [PROJ-1, expires 2000-01-01]'
  [ "$status" -eq 3 ]
  check_entry '- mail ravi@corp.in (`src/app.ts:1`) [PROJ-1, expires 2999-01-01]'
  [ "$status" -eq 3 ]
}

@test "triage refuses to write inside a git repo and never changes sources" {
  setup_repo
  printf -- '- retries live in src/app.ts:2\n' > "$MEM/fact.md"
  before=$(shasum "$MEM/fact.md")
  run python3 "$LIB/triage.py" --out "$REPO/report.md" --memory-dir "$MEM"
  [ "$status" -eq 2 ]
  run python3 "$LIB/triage.py" --out "$BATS_TEST_TMPDIR/report.md" --memory-dir "$MEM" --root "$REPO"
  [ "$status" -eq 0 ]
  grep -q "promotion candidate" "$BATS_TEST_TMPDIR/report.md"
  [ "$(shasum "$MEM/fact.md")" = "$before" ]
}
