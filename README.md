# Kanōn - Enterprise Engineering Standard for Claude Code

Ticket-driven, verifier-backed engineering discipline, split by repo type so no repo pays context for rules it cannot use.

## Plugins

| Plugin | Enable in | Contents |
|---|---|---|
| kanon-core | every repo | karpathy-guidelines, implementer, backend-architect, architect-review, failure-mode-engineer, adr-manager, docker-dev, remove-ai-marks, diagram-on-the-fly, common rules, git/doc policy, references, all hooks, Serena MCP, CLAUDE.md/AGENTS.md templates |
| kanon-java | Java repos | quarkus-reviewer, spring-reviewer, java-discipline, rules/java (+ quarkus.md, spring.md), java-services |
| kanon-ts | TS backend repos | nestjs-boundary-reviewer, typescript-discipline, rules/typescript (+ nestjs.md) |
| kanon-web | frontend repos | frontend-discipline, rules/web, frontend.md |

Monorepos with mixed stacks enable all four. A pure frontend repo enables core + web only, so quarkus/spring/nestjs agents and rules never enter its context.

## Install

```
/plugin marketplace add themaverik/kanon
/plugin install kanon-core@kanon
```

Or per repo in `.claude/settings.json` (example: TS backend repo):
```json
{
  "extraKnownMarketplaces": { "kanon": { "source": { "source": "github", "repo": "themaverik/kanon" } } },
  "enabledPlugins": {
    "kanon-core@kanon": true,
    "kanon-ts@kanon": true
  }
}
```
Copy `plugins/*-core/templates/CLAUDE.md` and `AGENTS.md` to the repo root and fill placeholders.

## Forking for your organisation

Optional: give the plugins your own prefix and org name.

```
python3 scripts/rename.py --prefix <your-prefix> --org "<Your Org>" --dry-run
python3 scripts/rename.py --prefix <your-prefix> --org "<Your Org>"
```

Then:

- Register the fork under Organization settings > Plugins, pin semver and enforce it with managed settings.
- Where the org runs SonarQube, merge `templates/mcp.enterprise.json` into the managed `.mcp.json`.
- Run `scripts/leak-check.sh` in the fork's CI, with your internal names added to BANNED.

## Policies enforced by hooks (not prose)

- ticket-guard: git commits must reference a ticket key (Jira/Linear pattern, `TICKET_REGEX` override).
- artifact-guard: no session/memory artifacts committed (MEMORY.md, SESSION*/PROGRESS* notes, generated knowledge bases). ADRs/diagrams/runbooks are the committed docs.
- env-mutation-guard: agents cannot start/stop containers/services or run destructive DB commands; `ECC_ALLOW_ENV=1` granted deliberately from main context.
- cooldown-guard: dependency install cooldown cannot be bypassed.
- post-edit-lint: fast lint after edits; slow verifiers (PIT, Stryker, Sonar) stay in CI/on-demand.

## Design notes

- Work-item truth lives in the ticket system; no roadmap files.
- CLI over MCP; Serena is the only always-on code MCP.
- Reviewers are read-only; only implementer and failure-mode-engineer write.
- Handoff reports replace transcript resumption.

## Commit messages

- `commit-craft` skill (core) disciplines AI-written commits: `KEY: one-liner` + pointwise bullets from the staged diff, no footers.
- `templates/githooks/prepare-commit-msg` covers human commits deterministically: prepends the branch's ticket key, inserts the bullet skeleton on empty messages. Opt-in AI draft via `COMMIT_AI=1`. Install per repo with `scripts/install-githooks.sh` (commits `.githooks/` + `core.hooksPath`).
- ticket-guard remains the enforcement backstop on unkeyed branches only.

## Other editors (Cursor, VS Code Copilot, Antigravity)

`scripts/sync-editors.py` generates each editor's config from this canonical
standard: rules to .cursor/rules / .github/instructions / .agents/rules,
skills verbatim (shared SKILL.md standard), agents as VS Code custom agents
and persona skills elsewhere, plus per-editor Serena MCP config.
`--legacy-agent-dir` also emits Antigravity's pre-rename `.agent/` layout.
See Editor-Parity.md for the full mapping and what intentionally does not
port (editor hooks; parity via git hooks + CI).

## Prerequisites (per machine)

- `uv` (Serena MCP launches via uvx; first Java project also downloads Eclipse JDT.LS ~500MB)
- `graphify` for the tier-0 read protocol, plus one initial `graphify` run per repo; the `graph-sync` hook then refreshes it incrementally after source edits (silent no-op when graphify is absent; set `GRAPH_SYNC_CMD` if your graphify version uses a different incremental command)
- JDK + Maven/Gradle wrappers, Node/npx per stack; `python3` (hooks), `jq` not required

## License

[MIT](LICENSE). The landing page's Open Sans font is under the [SIL Open Font License](assets/fonts/OFL.txt).
