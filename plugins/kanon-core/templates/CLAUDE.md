# Claude Code - <REPO NAME> (kanon standard v1)

**Rules**: kanon-core (+ stack plugin) rules/, loaded via discipline skills
**Stack**: <e.g. Quarkus services | Spring Boot services | NestJS APIs | Next.js portal>
**Java framework**: <quarkus | spring - delete if no Java; if omitted, detected from the build file>
**Architecture**: <pick ONE and delete the rest: Spec-Driven BCE ([org].[app].[bc].[boundary|control|entity]) | hexagonal (ports/adapters; domain imports no framework code) | layered MVC>
**Work items**: <Jira|Linear> - every Standard/Milestone task carries a ticket key

---

## Core Principles (read first)

Full guidelines in the `karpathy-guidelines` skill. Non-negotiable summary:

- **Surgical changes** - touch only what the task requires; adjacent problems go in a "noticed but not touched" note.
- **Simplicity first** - minimum code that solves the problem.
- **Think before coding** - state assumptions; ask before guessing.
- **Goal-driven** - verifiable success criteria before starting; loop until verified.
- **Premise checks in main context** - before dispatching any agent or building on a stated fact, verify it cheaply: read the actual line, check what is deployed, query what the DB holds.
- **Anchor on industry standard; name the anti-pattern.** Deviating is legitimate; deviating silently is not.

---

## Ticket-Driven Workflow

- Every Standard/Milestone task starts from a ticket key (e.g. PROJ-123) in the brief. If missing, ask for it before starting.
- Branch `type/PROJ-123-slug`; the branch key satisfies traceability for every commit on it (ticket-guard enforces the fallback on unkeyed branches); PR title carries the key.
- Commit messages follow the `commit-craft` skill: `KEY: one-liner` subject plus 2-5 pointwise bullets, no attribution footers. Humans get the same via the `prepare-commit-msg` git hook (scripts/install-githooks.sh).
- Ticket context relevant to the change is pasted into the brief; agents do not need ticket-system access.

## Scope Tiers

- **Trivial** - single component, no new deps/state/abstractions, no API or schema change. Implement directly, run the relevant gate, commit with the ticket key.
- **Standard / Milestone** - everything else. Follow the Execution Lifecycle.

If unsure, default to Trivial and ask before escalating.

---

## Execution Lifecycle (Standard / Milestone)

1. **Discover** - follow the read protocol, cheapest tier that answers the question:
   - Tier 0 graph (graphify report/graph.json): structure, dependencies, where-is-X, blast radius. Always first.
   - Tier 1 symbols (Serena): a definition, its references, a call chain.
   - Tier 2 targeted lines: the exact code you will reason about or verify a premise against. Mandatory before ANY behavioral claim; the graph never substitutes here.
   - Tier 3 full files: only files being edited plus their immediate contracts.
   Prerequisite: graphify installed and the repo graphed once (`graphify` at repo root); the graph-sync hook keeps it fresh after edits. If graphify is absent, tier 0 degrades to Serena symbol overviews plus `git ls-files` structure; do not fake a graph.
   Never start from grep or wholesale file reads on an unfamiliar area; never assert behavior from tiers 0-1; rebuild the graph on structural change (a stale graph is confidently wrong).
2. **Premise-check** - cheap falsifiable checks on every load-bearing assumption.
3. **Design** (contracts/schemas change) - dispatch `backend-architect`; capture the decision via `adr-manager` (ticket-linked).
4. **Implement** - dispatch `implementer` with ticket key + success criteria in the brief. Its handoff report is the interface; never resume its transcript for questions the report should answer.
5. **Verify** - build/test gates; risky paths get `failure-mode-engineer` (mutation/property verdicts, not coverage percent).
6. **Review** - official code-review plugin generally; `architect-review` for structural changes; stack reviewer (`quarkus-reviewer` / `spring-reviewer` / `nestjs-boundary-reviewer`) per repo type.
7. **Record** - ADR for decisions. Work-item status lives in the ticket, not in repo files.
8. **Deliverables** - run `remove-ai-marks` on generated docs/artifacts before publishing.

## Agent Routing

| Need | Agent | Mode |
|---|---|---|
| Build a scoped change | implementer | writes; env-mutation blocked |
| Service/API/schema design | backend-architect | design doc only |
| Structural review | architect-review | read-only, opus, Milestone tier |
| How does this break | failure-mode-engineer | writes tests; verifier-backed |
| Quarkus idiom review | quarkus-reviewer (kanon-java) | read-only |
| Spring Boot idiom review | spring-reviewer (kanon-java) | read-only |
| NestJS/TS boundary review | nestjs-boundary-reviewer (kanon-ts) | read-only |

Reviewers never edit. Only implementer and failure-mode-engineer write.

## Session Continuity (no session files in the repo)

Cross-session state lives in exactly three sanctioned places, none of them committed session files:
1. **Tool-native memory** (machine-local): Claude Code Auto Memory + `claude --resume`/`--continue` restore prior sessions from ~/.claude, outside the repo. Other editors use their own (Cursor Memories, Antigravity's ~/.gemini store).
2. **The ticket** (team-shared): status, open questions, and next steps go on the ticket, not in a PROGRESS.md. Resuming work = re-reading the ticket + the last handoff report pasted there.
3. **The repo, system-level only**: ADRs, diagrams, runbooks. Agent handoff reports are pasted into the ticket or PR description when they need to outlive the session; they are never committed as files.
The artifact-guard hook blocks the fourth, unsanctioned place: session files in the tree.

## Repo Docs Policy

Committed docs describe the SYSTEM: ADRs (`docs/adr/`), diagrams (`docs/diagrams/`), runbooks, API docs. Nothing committed describes the session: no MEMORY.md, progress trackers, session notes, or generated knowledge bases (artifact-guard hook enforces). Native Auto Memory handles session continuity outside the repo.

## Token Budget & Dispatch Approval (CRITICAL)

Assume a constrained subscription budget. Tokens are money; spend them like it.

- Cost classes for any subagent dispatch: **S** (<20K tokens: scoped diff work, single-module review), **M** (20-60K: multi-file implementation, full-feature review), **L** (>60K: anything touching many modules, repo-wide analysis, opus usage).
- **Before every dispatch**, state the class and one-line justification. **M and L require explicit user approval before dispatching; L is exceptional.** If unsure of the class, ask.
- Prefer main context for Trivial-tier work; a dispatch that would be S is often cheaper done directly.
- One dispatch per lifecycle phase; never redispatch to "double-check" without approval.
- Opus on any agent only with explicit approval per invocation (architect-review defaults to sonnet).
- Never resume an agent transcript; the handoff report is the interface. A resumed transcript re-reads everything and can cost as much as the original run.
- Agents carry a context budget in their charters: they stop and ask when a task exceeds ~15 files or needs a repo-wide pass, rather than silently spending.
- Reviews run on the diff plus touched files, never the whole codebase.

## Token Efficiency

- CLI over MCP by default; Serena is the only always-on code MCP. Static analysis runs as CLI in hooks/CI.
- Skills load progressively; read only rule sections the task needs.
- Repo maps are cached; regenerate only on structural change.

## Environment Safety

- Container/service lifecycle and destructive DB commands are blocked for agents (`env-mutation-guard`); main context grants exceptions per session with `ALLOW_ENV_MUTATION=1`.
- Install cooldown bypasses blocked (`cooldown-guard`).
