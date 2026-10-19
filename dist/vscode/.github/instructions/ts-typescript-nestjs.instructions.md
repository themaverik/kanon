---
applyTo: "**/*.ts"
---

# NestJS Rules

> Extends typescript/patterns.md. Applies when @nestjs/* is in package.json.

## Modules and boundaries
- Import another module's exported surface only; never reach into its internals. Enforced by dependency-cruiser where configured; add the rule when a violation recurs.
- No circular module references; `forwardRef` requires a written justification in the PR.
- In hexagonal repos, domain/use-case layers import zero `@nestjs/*`.

## DI discipline
- Providers injected via constructor. Never `new` an injectable.
- Interfaces injected via injection tokens.
- `@Injectable({ scope: Scope.REQUEST })` only with a stated reason; scope bubbles and costs per-request instantiation.

## Edges
- Validate every inbound DTO (class-validator ValidationPipe or zod) at the controller edge; nothing unvalidated crosses in.
- ORM entities do not cross service boundaries; map to DTOs/domain objects.
- No floating promises: every promise awaited or explicitly handled; error paths tested.

## Strictness
- tsconfig strict on; no `any` escapes or non-null assertions on nullable paths without justification.

## Hygiene verifiers
- dependency-cruiser: boundary rules. knip: dead exports/deps. Stryker: mutation on changed files. fast-check: invariants.
