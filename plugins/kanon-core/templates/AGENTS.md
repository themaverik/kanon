# AGENTS.md - <REPO NAME> Engineering Standard (agent-agnostic)

Guidance for any AI coding agent (Codex, Cursor, Gemini CLI, Aider, Copilot, etc.). Claude Code additionally loads CLAUDE.md and the kanon bundle; this file is the provider-neutral contract.

**Architecture**: <pick ONE and delete the rest: Spec-Driven BCE | hexagonal (ports/adapters) | layered MVC>. Agents follow this declaration; the matching rules activate and the others stay silent.

**Java framework**: <quarkus | spring - delete if no Java; if omitted, detected from the build file>

## Core Principles

- **Surgical changes**: touch only what the task requires; list adjacent problems under "noticed but not touched" instead of changing them.
- **Simplicity first**: minimum code; no speculative abstractions or dependencies.
- **Verify premises**: read/check any stated fact you build on; if reality contradicts the brief, say so before proceeding.
- **Deviate loudly**: any deviation from the request is stated with its reason.
- **Verifiable done**: define the verification before starting; run it before claiming done.
- **Name the pattern**: recommendations reference the pattern or anti-pattern by name (SOLID, hexagonal, outbox, saga, CQRS, etc.).

## Ticket-Driven Workflow

Every non-trivial task references a work-item ticket (Jira/Linear). Branch `type/PROJ-123-slug`; the branch key covers all commits on it; PR titles carry it. Commit messages: `KEY: imperative one-liner` subject, then 2-5 one-line bullets (what + why). No paragraphs, no AI attribution footers. No ticket in the brief: ask before starting.

## Hard Rules

- Never delete or weaken a failing test to go green; report it.
- Never mutate the environment silently (containers, services, databases). Ask first.
- Never commit secrets; never bypass dependency-install cooldowns.
- Never commit session/memory artifacts (MEMORY.md, progress notes, session logs, generated knowledge bases). Committed docs describe the system only: ADRs in `docs/adr/`, diagrams in `docs/diagrams/`, runbooks, API docs.
- Immutability by default: return new objects; do not mutate inputs.

## Stack Discipline

- **Java**: declare `Java framework: quarkus | spring` (else detected from the build file); never mix the two in one module.
  - **Quarkus**: CDI idioms (`@ApplicationScoped`, constructor injection, `@ConfigProperty`). Never block the event loop; `@Blocking`, `@RunOnVirtualThread`, or reactive persistence on reactive paths. Prefer Dev Services, Panache, SmallRye Fault Tolerance over hand-rolled equivalents. Architecture rules live as ArchUnit/Taikai tests.
  - **Spring Boot**: constructor injection and stereotypes, `@ConfigurationProperties`, `@Transactional` on services (mind self-invocation), `ProblemDetail` errors, `SecurityFilterChain` beans, open-in-view off, slice tests + Testcontainers `@ServiceConnection`.
- **TypeScript/NestJS**: strict mode; constructor DI; import other modules only via exported surfaces; domain layers import no framework code in hexagonal repos; validate inbound DTOs at the edge; no floating promises. Boundaries via dependency-cruiser; dead code via knip.
- **Frontend**: respect server/client component boundaries; accessibility and performance rules per rules/web.

## External Documentation

Training data lags library releases, so look up library, framework, SDK and CLI behaviour before relying on it.

- Use Context7, when connected, for library and API docs, including well-known libraries.
- Use Exa, when connected, for what Context7 lacks: pricing, changelogs, issues, articles. Otherwise use the built-in web search.
- End any answer that states library or API behaviour with one source line, so the reader can tell looked-up facts from recalled ones: `Docs: Context7 <library-id>`, `Docs: Exa <url>`, `Docs: web <url>`, or `Docs: memory (not verified)`.

## Context Budget

Assume a constrained token budget. Work from the diff and the brief; read only what the task requires; never scan the repo wholesale or re-read what is in context. If the task genuinely needs more than ~15 files or a repo-wide pass, stop and ask with the reason instead of proceeding. State the expected cost class (small/medium/large) before any long-running autonomous run; medium and large need explicit approval.

## Verification Toolchain (claims require tool evidence)

Lint: eslint/Biome (TS), Spotless/Checkstyle (Java). Static: Error Prone, SpotBugs+FindSecBugs, typescript-eslint, Semgrep. Architecture: ArchUnit/Taikai, dependency-cruiser. Failure modes: PIT/Stryker mutation, jqwik/fast-check properties. A survived mutant is a documented gap; coverage percent is not evidence.

## Required Handoff Report (every task)

1. What changed (files + one-line why)
2. Deviations from the brief (and why), or "None"
3. Premises verified or corrected
4. Noticed but deliberately not touched
5. Commands run, in order
6. How to verify (exact commands + observed results)

## Deliverable Hygiene

Generated documents/artifacts are cleaned of AI provenance marks before publishing, per the repo's watermark-removal step.
