# Kanōn

A ticket-driven, verifier-backed engineering standard for AI coding agents. One canonical source, with generated versions for Claude Code, Cursor, VS Code, Codex and Antigravity.

**Discipline**, as Kanōn uses the word: a named set of rules, roles and checks that the agent follows the same way on every task. Hooks and verifiers enforce it, so nothing depends on the model remembering.

The full guide is the landing page, [`index.html`](index.html).

## Features

Kanōn stays lean by measuring. Every rule earns its tokens, every check runs as code, and every pattern points to its source. The figures below come from this repo's files and the author's own Claude Code transcripts.

- **Distilled from the best public packs.** Benchmarked against [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills), [mattpocock/skills](https://github.com/mattpocock/skills) and [obra/superpowers](https://github.com/obra/superpowers). Kanōn keeps what works and points to them for what they do better. Adam Bien's airails ships vendored for Java. The CLAUDE.md template went from 7.9 KB to 4.2 KB, with every line earning its place.
- **Cost-aware routing and compaction.** Subagents run on Sonnet by default, Opus needs approval, and Fable is held to one bounded task per session. cache-keeper reads your plan (Pro, Max, Team or API) and compacts at your real context floor plus working room. A fixed 50K gate would sit below the ~57K floor a fresh session already starts at.
- **Visibility in session mods.** Cache time left, context size, 5-hour and weekly use, and session cost show on every turn. Handoff & Clear is one key, and collision-guard asks before you edit a file another session just changed.
- **Layered plugins.** Enable core plus your stack, and nothing else loads. About 1.4–2.5K tokens are fixed per session, not counting MCP tool schemas. Eight tech stack recipes cover Quarkus, Spring Boot, Kotlin, NestJS, Next.js, plain TypeScript and Rust.
- **Audited prompts.** The CLAUDE.md template, agents, skills and rules are audited with `/claude-api prompt-audit` against current Claude models (Opus 5.5, Sonnet 5.5, Fable 5.1), so instructions written for older models get caught. The template is about 1.05K tokens.
- **Deterministic safety gates.** Hooks block unticketed commits, committed session notes, container and database changes by agents, and dependency-cooldown bypasses. CI runs 14 bats tests on them, plus `claude plugin validate`, a leak check and a dist drift check.
- **Verifiers, not opinions.** Reviewers are read-only and quote ArchUnit, dependency-cruiser, clippy and cargo-deny output. Tests prove themselves with mutation testing (PIT, Stryker, cargo-mutants), not a coverage percent.
- **Industry standards, with sources.** Every rule and reference file ends with the source behind each pattern it names: 370 citations across 53 files. Kanōn's own stances are marked *(Kanōn)*.
- **One source, five editors.** Generated dialects for Claude Code, Cursor, VS Code, Codex and Antigravity, plus a paste-in block for plain chat.

## Plugins

| Plugin | Enable in | Brings |
|---|---|---|
| kanon-core | every repo | implementer, backend-architect, architect-review and failure-mode-engineer agents, karpathy-guidelines, adr-manager, commit-craft, common rules, 6 hook checks, Serena MCP, CLAUDE.md/AGENTS.md templates |
| kanon-java | Java/Kotlin repos | Quarkus or Spring Boot, picked from the repo. quarkus-reviewer, spring-reviewer, java-discipline, java rules |
| kanon-java-airails | Java repos, opt-in | 8 vendored [airails](plugins/kanon-java-airails/skills/AIRAILS-NOTICE.md) skills. sbce, ears-tests and continuous-testing run only as slash commands |
| kanon-ts | TS backend repos | nestjs-boundary-reviewer, typescript-discipline, typescript, NestJS and hexagonal rules |
| kanon-web | frontend repos | frontend-discipline, web rules |
| kanon-rust | Rust repos | rust-reviewer, rust-discipline, Rust and axum rules |
| kanon-tools | any repo, opt-in | docker-dev, remove-ai-marks and diagram-on-the-fly skills |
| cache-keeper | any repo (mod) | cache countdown, context size, rate limits, session cost, Handoff & Clear |
| collision-guard | any repo (mod) | asks before editing a file another session just changed |
| prompt-enhancer | any repo (mod) | rewrites a draft prompt into your template, unsent |

The mods need a Claude Code build with hooks modules. The landing page's [Mods section](index.html#mods) covers their buttons, commands and settings.

## What Kanōn does not cover

Kanōn holds only its own stance: ticket keys, mutation evidence, read-only reviewers and the hooks that enforce them. For general workflow (brainstorming, planning, TDD, debugging), install one of these alongside it:

- [superpowers](https://github.com/obra/superpowers): `brainstorming`, `writing-plans`, `test-driven-development`, `systematic-debugging`.
- [Matt Pocock's skills](https://github.com/mattpocock/skills): `to-spec`, `tdd`, `diagnosing-bugs`, `code-review`.

## Install

```
/plugin marketplace add themaverik/kanon
/plugin install kanon-core@kanon
/plugin install kanon-java@kanon      # or kanon-ts, kanon-web, kanon-rust
/plugin install kanon-java-airails@kanon   # optional, Java only
/plugin install kanon-tools@kanon          # optional utility skills
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

**Other editors:** run `python3 scripts/sync-editors.py --repo <repo> --stacks java --tools cursor`, or copy the matching tree from `dist/`. Add `tools` to `--stacks` for the kanon-tools skills. [Editor-Parity.md](Editor-Parity.md) lists what ports and what doesn't.

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
- Pin a release tag (`v2.0.0`) and enforce it with managed settings. Releases follow semver, and [CHANGELOG.md](CHANGELOG.md) lists what each one breaks.

## License

[MIT](LICENSE). IBM Plex Sans and JetBrains Mono are under the [SIL Open Font License](assets/fonts/OFL.txt).
