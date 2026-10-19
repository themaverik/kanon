---
applyTo: ".gitignore,.git/**,**/*.sh"
---

# Git Policy

Read `.claude/references/git-conventions.md` for full conventions.

## Critical Rules

- Never run `git push` without explicit user confirmation — no exceptions
- No AI tool attribution in commits (no "Generated with Claude Code" or "Co-Authored-By: Claude")
- Commits carry the developer's own configured git identity. Never set the author to an
  AI, a bot, or a shared team account — attribution is how a change is traced back to a
  person who can explain it
- Commit message type: use `build` for skills, hooks, MCP config, settings changes
- Follow Conventional Commits — subject imperative mood, no period, max 72 chars. Body length
  follows the size of the change; see the `commit-craft` skill, which is the authority
- Create `.gitignore` before first commit if missing
- Confirm before any force push or rebase on shared branches

## New Project Gitignore Strategy

Always ask before creating ignore files:
1. `.gitignore` — committed, visible to everyone. Use for open source or shared teams.
2. `.git/info/exclude` — local only, never pushed. Use for proprietary repos and personal tooling.
3. Both — `.gitignore` for shared rules, `.git/info/exclude` for personal exclusions.

Recommended default: option 3.
- `.gitignore`: node_modules/, target/, dist/, .env* (!.env.example), *.log,
  `.claude/settings.local.json`, `.claude/data/`
- `.git/info/exclude`: personal tooling only

## Claude Config: What Is Committed

- **Committed**: `CLAUDE.md`, `AGENTS.md`, `.claude/settings.json`. These are shared team
  config in the same class as `.editorconfig` — a standard each developer must opt into
  individually is not a standard.
- **Never committed**: `.claude/settings.local.json` (personal overrides), `.claude/data/`.
- Committing `enabledPlugins` only works once the marketplace is reachable by everyone. While
  it is registered from a local directory path, enablement stays in
  `.claude/settings.local.json` plus `.git/info/exclude`, and moves into the committed
  `settings.json` — together with `extraKnownMarketplaces` — when the plugin is published to a
  git remote.

## Pre-commit Watermark Cleaning

Staged code and docs are stripped of invisible Unicode before they are committed, via the
watermarks service (`WATERMARKS_SERVICE_URL`, default `http://127.0.0.1:8765`).

- **Layer A only** — removes zero-width and bidi characters and leaves every visible character
  alone. An em dash stays an em dash; an already-clean file comes back byte-identical. The
  statistical rewrite (Layer B) needs a model and changes wording, so it never runs unattended.
- **Never blocks a commit.** The service not being installed is a normal state, not an error.
  Not installed, not running, a missing `curl`/`python3`/`base64`, a malformed response or any
  internal failure all mean "skip cleaning" and never "fail the commit". The hook carries no
  `set -e` and no `set -u` precisely because a non-zero exit is how git rejects a commit.
- **Partially staged files are skipped** — cleaning them would stage content the author did not
  choose to commit.
- Bypass once with `SKIP_WATERMARK_HOOK=1 git commit ...`.
- The service rejects source extensions (`.kt`, `.xml`, `.sh`), so the hook presents non-markdown
  files under a `.txt` name. Content is unaffected; only the routing changes.

**Installation: check for an existing global `core.hooksPath` first.** Setting
`core.hooksPath=.githooks` in a repository makes git ignore any global hooks directory
**entirely**. On a machine that already serves hooks from a global path, a per-repo override
silently disables every one of them. Check before installing:

```bash
git config --show-origin --get core.hooksPath
```

If a global path is in use, either add a path-scoped hook there that execs this plugin's
template, or copy the existing global hooks into `.githooks/` alongside the plugin's. Do not
set the per-repo override and leave the question unanswered - the failure is silent.

`scripts/install-githooks.sh` refuses to overwrite a `core.hooksPath` that points somewhere
other than `.githooks`, for this reason.

## Ticket Traceability (enforced by ticket-guard hook)

Development is ticket-driven (Jira, Linear, or equivalent). No Standard/Milestone work starts without a ticket key in the brief.

- Branch: `type/PROJ-123-short-slug` (feat|fix|chore|refactor|docs).
- Commit message: must contain the ticket key. Enforced by the `ticket-guard` hook (pattern `[A-Z][A-Z0-9]+-[0-9]+`, override via `TICKET_REGEX`).
- PR title: `PROJ-123: <summary>`; description links the ticket.
- ADRs reference the driving ticket in frontmatter.
- Roadmap files are not used in this standard; the ticket system is the single source of work-item truth.
