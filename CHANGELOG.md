# Changelog

Kanōn follows [Semantic Versioning](https://semver.org/). Each release is a `vX.Y.Z` git tag on this repo. A breaking change to any plugin bumps the major version. Plugin versions in `marketplace.json` move independently.

## Unreleased

- New doc-name-guard: `doc-name-check.py` blocks new Markdown names that are neither hyphenated Title-Case, kebab-case, `ADR-NNN-slug.md` nor a standard file (README, NOTICE, COPYING, CODE_OF_CONDUCT, SKILL.md, DESIGN.md ...). It runs as a PreToolUse hook on Write and on Bash (redirects, heredocs, `tee`, `touch`, `cp`, `mv`, `git mv`), in pre-commit for staged additions and renames, and in CI over every tracked `.md`. Existing files are not checked, so legacy names do not block edits. Vendored trees are listed in `.docnames-exempt`. Bypass once with `ALLOW_DOC_NAME=1`. kanon-core 2.2.0.
- `AIRAILS-NOTICE.md` is now `Airails-Notice.md`.

- New opt-in plugin kanon-web-design 1.0.0: 10 vendored frontend design skills, unchanged from upstream. tasteskill v2 (`design-taste-frontend`, MIT), impeccable (Apache 2.0) and eight of Emil Kowalski's skills (MIT): animate, animation-performance, animation-vocabulary, break-ui, emil-design-eng, find-animation-opportunities, improve-animations, review-animations. Attribution and pinned commits are in `plugins/kanon-web-design/skills/Web-Design-Notice.md`, license texts in `plugins/kanon-web-design/LICENSES/`. kanon-web 1.1.0: the frontend-discipline router says which of them does which job. Install with `/plugin install kanon-web-design@kanon`, or add `web-design` to `--stacks` for other editors.

## 2.1.0 (Oct 2026)

Plugin versions: kanon-core 2.1.0, cache-keeper 0.3.0, collision-guard 0.1.1, prompt-enhancer 0.1.1.

- cache-keeper compacts adaptively. The target is floor plus room and the ceiling adds a grace buffer, both held under a per-plan cap (Pro 180K, Max 5x and Team 250K, Max 20x 300K, API 250K). Between them a heavy turn (8K+ tokens added or 3+ files edited) compacts and a light one holds. Max 5x room rises from 100K to 130K, Max 20x from 150K to 170K. Grace keeps the plans' ratio: Pro 5K, Max 5x and Team 15K, Max 20x 40K, API 10K. See the README's Compaction section for the sources.
- cache-keeper: with `enforce` on it asks Compact, Handoff & Clear or Keep going when the verdict is due. The new `autoCompact` option compacts between turns without asking. New `compactCapTokens` and `compactGraceTokens` options.
- cache-keeper no longer vetoes an engine auto-compaction past 80% of the model window, so a prompt that is too long still compacts. Before, the API profile's 200K window could veto the engine's 167K compaction on a 200K model.
- cache-keeper's `ctx` reading turns orange past the compaction target and red past the ceiling, instead of yellow and red at fixed `warnTokens` multiples.
- New `commit-msg` githook strips AI attribution trailers (`Co-Authored-By: Claude`, "Generated with Claude Code") and keeps human co-authors. Before, the no-attribution rule was policy text only. Bypass once with `SKIP_ATTRIBUTION_HOOK=1`.
- `dist/` is no longer committed (411 generated files); it had no users. Run `scripts/sync-editors.py` for Cursor, VS Code, Codex or Antigravity: it needs only Python 3. CI now checks that every dialect generates instead of diffing a committed copy.
- Band labels start with a capital: `Cache`, `Profile`, `Other session`, `Prompt`.

## 2.0.0 (Oct 2026)

Plugin versions: kanon-core 2.0.0, kanon-java 2.0.0, kanon-ts 1.1.0, kanon-web 1.0.1. New plugins kanon-rust, kanon-java-airails and kanon-tools start at 1.0.0.

- Every rule and reference file ends with a Sources list for the patterns, principles and specs it names. Kanōn's own stances are marked *(Kanōn)* in place. AIRAILS-NOTICE.md credits BCE, ubiquitous language and EARS to their authors. One file-size limit (800 lines max) replaces the stray 300-line rule.
- New Rust recipe on the landing page, and a dark theme with IBM Plex Sans and JetBrains Mono.
- **Breaking:** docker-dev, remove-ai-marks and diagram-on-the-fly moved from kanon-core to the new opt-in plugin kanon-tools. Install it to keep them (`/plugin install kanon-tools@kanon`, or add `tools` to `--stacks` for other editors). The fixed floor drops by about 0.2K tokens.
- `common/testing.md` and `common/development-workflow.md` keep only what Kanōn adds: ticket keys, mutation evidence and read-only reviewers. General TDD and planning now point to superpowers and Matt Pocock's skills.
- The cooldown, env-mutation and ticket guards are now one PreToolUse script, `bash-guard.sh`, so each Bash call parses its payload once instead of three times. Block messages, overrides and `TICKET_REGEX` are unchanged.
- CI runs `claude plugin validate`, the leak check, a dist drift check (`scripts/build-dist.sh`) and bats tests for the hooks. The leak check could never pass before, because an unescaped dot in the Serena pattern matched every Serena mention.
- kanon-ts covers TS backends beyond NestJS. `typescript/testing.md` now sets Vitest or Jest, supertest and Testcontainers by layer, and a new framework-neutral `typescript/hexagonal.md` defines ports and adapters with a dependency-cruiser config to enforce them.
- New plugin kanon-rust: rust-reviewer agent (clippy, rustfmt, cargo-deny), rust-discipline router skill, Rust rules and an axum rule. post-edit-lint now runs `cargo fmt --check` on `.rs` files.
- **Breaking:** the 8 airails skills moved from kanon-java to the new opt-in plugin kanon-java-airails. Install it to keep them. sbce, ears-tests and continuous-testing now run only as slash commands. This cuts about 1.4K tokens from every Java session.
- `templates/CLAUDE.md` shrank from 7.9 KB to 4.2 KB. The read protocol and token budget now live only in karpathy-guidelines, so the fixed floor drops by about 0.9K tokens.
- **Breaking:** the env-mutation-guard override is now `ALLOW_ENV_MUTATION=1`. The old variable no longer works.
- Rules now match Kanōn's own stance: ticket-prefixed commits (`PROJ-123: ...`), mutation testing instead of an 80% coverage target, and no PRD or roadmap files.
- Rules point only to agents and skills that Kanōn ships.
- `sync-editors.py` copies reference docs to `.kanon/references/`, where the rules point.
- Removed project-specific sections from `java-services.md` and `frontend.md`.

## 1.0.0 (Aug 2026)

Standards and rule files reconciled:

- Errors are RFC 9457 Problem Details (`application/problem+json`), replacing the old `ApiResponse` envelope in `common/patterns.md`, `java/patterns.md` and `typescript/patterns.md`.
- ADRs follow MADR `ADR-NNN-<slug>.md` with an auto-maintained `index.md`.
- Compose files use `docker-compose.<qualifier>.yml`, kept deliberately over the newer `compose.yaml` spec name.
- Quarkus schema strategy is `quarkus.hibernate-orm.schema-management.strategy`. `database.generation` is deprecated.
- A NestJS backend-TS standard is planned. Until then, `rules/typescript/nestjs.md` governs.
