---
trigger: glob
globs: **/*.ts
---

# NestJS Rules

> Extends typescript/patterns.md. Applies when @nestjs/* is in package.json.

## Modules and boundaries
- Import another module's exported surface only; never reach into its internals. Enforced by dependency-cruiser where configured; add the rule when a violation recurs.
- No circular module references; `forwardRef` requires a written justification in the PR. *(Kanōn)*
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
- dependency-cruiser: boundary rules. knip: dead exports/deps. Stryker: mutation on changed files. *(Kanōn)* fast-check: invariants.

## Sources

- Information hiding: David Parnas, "On the Criteria To Be Used in Decomposing Systems into Modules", *CACM* 15(12), 1972, doi:10.1145/361598.361623
- dependency-cruiser: Sander Verweij and contributors, dependency-cruiser documentation, https://github.com/sverweij/dependency-cruiser
- Hexagonal architecture: Alistair Cockburn, "Hexagonal Architecture", 2005, https://alistair.cockburn.us/hexagonal-architecture/
- Dependency injection: Martin Fowler, "Inversion of Control Containers and the Dependency Injection pattern", 2004, https://martinfowler.com/articles/injection.html
- Input validation: OWASP, "Input Validation Cheat Sheet", https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
- TypeScript strict mode: Microsoft, "TSConfig Reference: strict", https://www.typescriptlang.org/tsconfig/#strict
- Mutation testing: DeMillo, Lipton & Sayward, "Hints on Test Data Selection: Help for the Practicing Programmer", *IEEE Computer* 11(4), 1978, doi:10.1109/C-M.1978.218136
- Property-based testing: Koen Claessen & John Hughes, "QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs", ICFP 2000, doi:10.1145/351240.351266
