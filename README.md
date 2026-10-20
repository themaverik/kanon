# Kanōn

A ticket-driven, verifier-backed engineering standard for AI coding agents. One canonical source, with generated versions for Claude Code, Cursor, VS Code, Codex and Antigravity.

**Discipline**, as Kanōn uses the word: a named set of rules, roles and checks that the agent follows the same way on every task. Hooks and verifiers enforce it, so nothing depends on the model remembering.

The full guide is the landing page, [`index.html`](index.html).

## Highlights

- **Split by stack.** Each repo loads only the rules it can use. A frontend repo never sees Quarkus text.
- **Scaled to the task.** Trivial changes skip the process, while milestones get the full plan, build, verify and review loop.
- **Enforced, not suggested.** Hooks block unticketed commits, committed session notes, container and database changes by agents, and dependency-cooldown bypasses.
- **Proven by verifiers.** Reviewers are read-only and lean on ArchUnit, dependency-cruiser, PIT and Stryker rather than opinion.
- **Lean.** About 1.6–2.7K tokens are always loaded per session, not counting MCP tool schemas.
- **Session mods.** Optional bands above the prompt for cache and cost, parallel-session collisions, and prompt rewriting.

## Plugins

| Plugin | Enable in | Brings |
|---|---|---|
| kanon-core | every repo | implementer, backend-architect, architect-review and failure-mode-engineer agents, karpathy-guidelines, adr-manager, commit-craft, common rules, the 6 guard hooks, Serena MCP, CLAUDE.md/AGENTS.md templates |
| kanon-java | Java/Kotlin repos | Quarkus or Spring Boot, picked from the repo. quarkus-reviewer, spring-reviewer, java-discipline, java rules |
| kanon-java-airails | Java repos, opt-in | 8 vendored [airails](plugins/kanon-java-airails/skills/AIRAILS-NOTICE.md) skills. sbce, ears-tests and continuous-testing run only as slash commands |
| kanon-ts | TS backend repos | nestjs-boundary-reviewer, typescript-discipline, typescript and NestJS rules |
| kanon-web | frontend repos | frontend-discipline, web rules |
| cache-keeper | any repo (mod) | cache countdown, context size, rate limits, session cost, Handoff & Clear |
| collision-guard | any repo (mod) | asks before editing a file another session just changed |
| prompt-enhancer | any repo (mod) | rewrites a draft prompt into your template, unsent |

The mods need a Claude Code build with hooks modules. The landing page's [Mods section](index.html#mods) covers their buttons, commands and settings.

## Install

```
/plugin marketplace add themaverik/kanon
/plugin install kanon-core@kanon
/plugin install kanon-java@kanon      # or kanon-ts, kanon-web
/plugin install kanon-java-airails@kanon   # optional, Java only
```

Claude Code plugins can't ship rules, so sync them into the repo once, and again after each update:

```
python3 scripts/sync-editors.py --repo <repo> --stacks java --tools claude
```

This writes path-scoped rules to `.claude/rules/kanon/`, which Claude Code loads when you touch matching files. Cross-cutting rules go to `.claude/kanon/rules/`, where the discipline skills read them on demand. Reference docs the rules point to go to `.kanon/references/`, for every editor.

Then copy `plugins/kanon-core/templates/CLAUDE.md` and `AGENTS.md` to the repo root and fill in the placeholders, including `Java framework:` for Java repos. To make a repo install the plugins for everyone who trusts it, commit this to `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": { "kanon": { "source": { "source": "github", "repo": "themaverik/kanon" } } },
  "enabledPlugins": { "kanon-core@kanon": true, "kanon-ts@kanon": true }
}
```

**Other editors:** run `python3 scripts/sync-editors.py --repo <repo> --stacks java --tools cursor`, or copy the matching tree from `dist/`. [Editor-Parity.md](Editor-Parity.md) lists what ports and what doesn't.

**Prerequisites:**
- `uv`, for Serena MCP.
- `python3`, for the hooks.
- Your stack's JDK or Node.
- `graphify` (optional), for the tiered read protocol.

**Settings:**
- `TICKET_REGEX` overrides the ticket-key pattern used by ticket-guard.
- `ALLOW_ENV_MUTATION=1` lets agents run the container and database commands env-mutation-guard blocks, for one session.
- `GRAPH_SYNC_CMD` sets your graphify incremental command.
- `COMMIT_AI=1` turns on AI drafts in the `prepare-commit-msg` git hook. Install that hook with `scripts/install-githooks.sh`.

## Forking

To use your own plugin prefix and org name, run `python3 scripts/rename.py --prefix <your-prefix> --org "<Your Org>" --dry-run`, then run it again without `--dry-run`. Then:
- Add your internal names to `BANNED` and run `scripts/leak-check.sh` in CI.
- Pin a semver tag and enforce it with managed settings.

## License

[MIT](LICENSE). Open Sans is under the [SIL Open Font License](assets/fonts/OFL.txt).
