#!/usr/bin/env bats
# Each guard parses the hook payload with python3. A parse bug makes the guard
# pass everything silently, so every guard has a case that must block.

HOOKS="$BATS_TEST_DIRNAME/../plugins/kanon-core/hooks"

bash_payload() { printf '{"tool_input":{"command":%s}}' "$(printf '%s' "$1" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))')"; }
file_payload() { printf '{"tool_input":{"file_path":"%s"}}' "$1"; }

run_hook() { run bash -c "printf '%s' \"\$1\" | \"$HOOKS/$2\"" _ "$1"; }

@test "cooldown-guard blocks a cooldown bypass" {
  run_hook "$(bash_payload 'npm install --min-release-age=0 left-pad')" bash-guard.sh
  [ "$status" -eq 2 ]
}

@test "cooldown-guard allows a normal install" {
  run_hook "$(bash_payload 'npm install left-pad')" bash-guard.sh
  [ "$status" -eq 0 ]
}

@test "env-mutation-guard blocks docker compose down" {
  run_hook "$(bash_payload 'docker compose down -v')" bash-guard.sh
  [ "$status" -eq 2 ]
}

@test "env-mutation-guard blocks a destructive psql command" {
  run_hook "$(bash_payload "psql -c 'DROP TABLE users'")" bash-guard.sh
  [ "$status" -eq 2 ]
}

@test "env-mutation-guard allows read-only commands" {
  run_hook "$(bash_payload "docker ps && psql -c 'select 1'")" bash-guard.sh
  [ "$status" -eq 0 ]
}

@test "env-mutation-guard honours ALLOW_ENV_MUTATION=1" {
  ALLOW_ENV_MUTATION=1 run_hook "$(bash_payload 'docker compose down')" bash-guard.sh
  [ "$status" -eq 0 ]
}

@test "ticket-guard blocks an unticketed commit on an unkeyed branch" {
  cd "$BATS_TEST_TMPDIR" && git init -q -b main repo && cd repo
  run_hook "$(bash_payload 'git commit -m "fix things"')" bash-guard.sh
  [ "$status" -eq 2 ]
}

@test "ticket-guard allows a keyed message" {
  cd "$BATS_TEST_TMPDIR" && git init -q -b main repo && cd repo
  run_hook "$(bash_payload 'git commit -m "PROJ-12: fix things"')" bash-guard.sh
  [ "$status" -eq 0 ]
}

@test "ticket-guard allows any message on a keyed branch" {
  cd "$BATS_TEST_TMPDIR" && git init -q -b feat/PROJ-12-slug repo && cd repo
  run_hook "$(bash_payload 'git commit -m "fix things"')" bash-guard.sh
  [ "$status" -eq 0 ]
}

@test "artifact-guard blocks a session file" {
  run_hook "$(file_payload /repo/docs/SESSION-notes.md)" artifact-guard.sh
  [ "$status" -eq 2 ]
}

@test "artifact-guard allows an ADR" {
  run_hook "$(file_payload /repo/docs/adr/ADR-001-x.md)" artifact-guard.sh
  [ "$status" -eq 0 ]
}

@test "post-edit-lint ignores a file type it does not lint" {
  touch "$BATS_TEST_TMPDIR/notes.md"
  run_hook "$(file_payload "$BATS_TEST_TMPDIR/notes.md")" post-edit-lint.sh
  [ "$status" -eq 0 ]
}

@test "graph-sync never fails the edit" {
  run_hook "$(file_payload /repo/src/App.ts)" graph-sync.sh
  [ "$status" -eq 0 ]
}

# claude plugin validate does not check that hook scripts exist.
@test "every hooks.json command is an executable script" {
  for h in $(grep -o 'hooks/[A-Za-z0-9_-]*\.sh' "$HOOKS/hooks.json"); do
    [ -x "$HOOKS/../$h" ] || { echo "missing: $h"; return 1; }
  done
}
