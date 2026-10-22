# Editor Parity - Claude Code / Cursor / VS Code Copilot / Antigravity

The plugin marketplace is the single source of truth. `scripts/sync-editors.py`
emits each editor's dialect into a target repo. Regenerate after standard
changes (or wire it into CI). Generated directories are derived artifacts:
edit the plugin, never the output.

## Mapping

| Canonical (this repo) | Claude Code | Cursor | VS Code Copilot | Antigravity |
|---|---|---|---|---|
| AGENTS.md template | CLAUDE.md (richer) + AGENTS.md | native | native | native (also GEMINI.md) |
| rules/*.md (`paths:` fm) | .claude/rules/kanon/ via `sync-editors.py --tools claude` (path-scoped); unscoped ones read by the router skills | .cursor/rules/*.mdc (globs, auto-attach) | .github/instructions/*.instructions.md (applyTo) | .agents/rules/*.md (trigger: glob) |
| skills/ (SKILL.md open standard) | plugin skills | .cursor/skills/ verbatim | .github/skills/ verbatim | .agents/skills/ verbatim |
| agents/ | plugin subagents | persona skills | .github/agents/*.agent.md | persona skills |
| Serena MCP | .mcp.json | .cursor/mcp.json | .vscode/mcp.json (key: servers) | .agents/mcp_config.json |
| prepare-commit-msg + ticket key | git-level: identical everywhere | same | same | same |
| leak-check, PIT/Stryker, depcruise, ArchUnit | CI: identical everywhere | same | same | same |

"New and old" Antigravity: current workspace dir is `.agents/`. Pre-rename
installs read `.agent/` (singular). `--legacy-agent-dir` emits both.

## What does NOT port, and the compensation

- **Claude hooks (env-mutation-guard, ticket-guard, artifact-guard, cooldown,
  post-edit-lint).** Hook schemas are editor-specific and drift, so we do not
  generate them. Enforcement parity comes from layers every editor shares:
  the `prepare-commit-msg` git hook (ticket key), server-side branch
  protection, CI (leak-check, linters, ArchUnit, dependency-cruiser,
  mutation tests), and Antigravity's own Terminal Command Deny List
  (Settings > Security) for the env-mutation equivalent. VS Code and Cursor
  hooks exist, so add them per-org later if prompt-level rules prove
  insufficient, treating this repo's hook scripts as the spec.
- **Read-only reviewers via tool restriction.** Other editors get the charter
  as a persona skill. "Never edit" is stated in the prompt, not enforced by
  tooling. Reviews there should run on a branch/PR where CI is the backstop.
- **Model pinning (architect-review on opus).** Model choice is per-editor
  configuration, and the charter notes the intent.
- **Native Auto Memory / ADR flow.** ADRs in `docs/adr/` are editor-agnostic
  by design. Session memory is each tool's own feature and is never
  committed (artifact policy holds via AGENTS.md + review).
- **Plugin marketplace distribution.** Cursor/VS Code/Antigravity have no
  equivalent installable bundle here. Distribution means committing the
  generated directories to each repo via sync-editors.py.

## Per-repo setup (any editor)

1. `python3 scripts/sync-editors.py --repo <repo> --stacks <java,ts,web,rust> --tools cursor,vscode,antigravity [--legacy-agent-dir]`
2. Fill AGENTS.md placeholders (and CLAUDE.md for Claude Code repos).
3. `scripts/install-githooks.sh` inside the repo.
4. Commit the generated dirs. Regenerate on standard updates. A CI check
   comparing regeneration output to the committed tree catches drift.

## Known constraints

- Antigravity caps rules and workflows at 12,000 chars/file. The generator
  warns when a rule exceeds it (split the source rule).
- Antigravity indexes every SKILL.md at startup, so keep skills workspace-scoped
  and pruned rather than installing large libraries globally.
- `disable-model-invocation` (sbce, ears-tests, continuous-testing) is a Claude
  Code key. Other editors may still pick those skills by description. Leave
  `java-airails` out of `--stacks` if you don't want them.
- `web-design` adds about 4.6 MB of skills, mostly tasteskill's and impeccable's
  libraries and scripts. Add it to `--stacks` only in frontend repos that use them.
- VS Code custom agents (.agent.md) and skills locations are evolving.
  `chat.agentSkillsLocations` can point at a different skills dir if your org
  standardizes elsewhere.
