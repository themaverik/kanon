# Claude Code - <REPO NAME> (kanon standard v1)

**Rules**: kanon-core (+ stack plugin) rules/, loaded via discipline skills
**Stack**: <e.g. Quarkus services | Spring Boot services | NestJS APIs | Next.js portal>
**Java framework**: <quarkus | spring - delete if no Java; if omitted, detected from the build file>
**Architecture**: <pick ONE and delete the rest: Spec-Driven BCE ([org].[app].[bc].[boundary|control|entity]) | hexagonal (ports/adapters; domain imports no framework code) | layered MVC>
**Work items**: <Jira|Linear> - every Standard/Milestone task carries a ticket key

---

## Core Principles (read first)

Load the `karpathy-guidelines` skill before planning, implementing or reviewing. It holds the principles, the read protocol and the token budget. Non-negotiable: surgical changes, simplicity first, premise checks before building on a fact, and cost class stated before any dispatch (M and L wait for approval).

## Ticket-Driven Workflow

- Every Standard/Milestone task starts from a ticket key (e.g. PROJ-123) in the brief. If missing, ask for it before starting.
- Branch `type/PROJ-123-slug`; the branch key satisfies traceability for every commit on it (ticket-guard enforces the fallback on unkeyed branches); PR title carries the key.
- Commit messages follow the `commit-craft` skill. Humans get the same via the `prepare-commit-msg` git hook (scripts/install-githooks.sh).
- Ticket context relevant to the change is pasted into the brief; agents do not need ticket-system access.

## Scope Tiers

- **Trivial** - single component, no new deps/state/abstractions, no API or schema change. Implement directly, run the relevant gate, commit with the ticket key.
- **Standard / Milestone** - everything else. Follow the Execution Lifecycle.

If unsure, default to Trivial and ask before escalating.

## Execution Lifecycle (Standard / Milestone)

1. **Discover** - read protocol from karpathy-guidelines #11. Needs graphify run once at the repo root; the graph-sync hook keeps it fresh. Without graphify, use Serena symbol overviews plus `git ls-files`; do not fake a graph.
2. **Premise-check** - cheap falsifiable checks on every load-bearing assumption.
3. **Design** (contracts/schemas change) - dispatch `backend-architect`; capture the decision via `adr-manager` (ticket-linked).
4. **Implement** - dispatch `implementer` with ticket key + success criteria in the brief. Its handoff report is the interface; never resume its transcript.
5. **Verify** - build/test gates; risky paths get `failure-mode-engineer` (mutation/property verdicts, not coverage percent).
6. **Review** - `pr-reviewer` on every PR; `architect-review` for structural changes; the stack reviewer per repo type. Reviews cover the diff plus touched files only.
7. **Record** - ADR for decisions. Work-item status lives in the ticket, not in repo files.
8. **Deliverables** - run `remove-ai-marks` (kanon-tools) on generated docs/artifacts before publishing.

## Agent Routing

| Need | Agent | Mode |
|---|---|---|
| Build a scoped change | implementer | writes; env-mutation blocked |
| Service/API/schema design | backend-architect | design doc only |
| PR review (five axes) | pr-reviewer | read-only, every PR |
| Structural review | architect-review | read-only, Milestone tier |
| How does this break | failure-mode-engineer | writes tests; verifier-backed |
| Quarkus / Spring Boot idiom review | quarkus-reviewer / spring-reviewer (kanon-java) | read-only |
| NestJS/TS boundary review | nestjs-boundary-reviewer (kanon-ts) | read-only |

Opus on any agent only with explicit approval per invocation.

## Session State and Repo Docs

Committed docs describe the system: ADRs (`docs/adr/`), diagrams (`docs/diagrams/`), runbooks, API docs. Session state never enters the tree (artifact-guard enforces):

- **Machine-local:** tool-native memory and `claude --resume`/`--continue`.
- **Team-shared:** status, open questions and handoff reports go on the ticket or PR, not in PROGRESS.md or MEMORY.md.

## Environment Safety

- Container/service lifecycle and destructive DB commands are blocked in every session, main and subagent (`env-mutation-guard`). Ask the user when one is needed; only the user can lift the block, for one session, by starting Claude Code with `ALLOW_ENV_MUTATION=1`.
- Install cooldown bypasses blocked (`cooldown-guard`).
