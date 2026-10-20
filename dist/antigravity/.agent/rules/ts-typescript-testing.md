---
trigger: glob
globs: **/*.ts,**/*.tsx,**/*.js,**/*.jsx
---

# TypeScript/JavaScript Testing

> This file extends [common/testing.md](../common/testing.md) with TypeScript/JavaScript specific content.

## Runner

- **Vitest** for new projects: native ESM and TypeScript, Jest-compatible API.
- Keep **Jest** where the repo already uses it (the NestJS CLI scaffolds it). Don't run both in one package.
- Type-check tests too: `tsc --noEmit` covers the test files, or the runner's typecheck mode does.

## Layers

- **Unit** - domain and use-case code with in-memory fakes for ports. No framework bootstrap.
- **HTTP** - drive the real app in-process with **supertest** (Express, NestJS) or the framework's injector (`fastify.inject`, Hono `app.request`). Assert status, body and the `application/problem+json` error shape.
- **Integration** - databases, brokers and caches run in **Testcontainers** (`testcontainers` on npm), not mocks of the driver. One container per suite, reset state between tests.
- **E2E** - **Playwright** for critical user flows.

## Evidence

- **fast-check** for properties: parsers, mappers, invariants.
- **Stryker** on changed files to find tests that don't catch real changes. Surviving mutants are the gap to close. *(Kanōn)*
- Mock only what you own. Third-party clients sit behind a port, and the port gets the fake.

## Sources

- Test layering: Ham Vocke, "The Practical Test Pyramid", 2018, https://martinfowler.com/articles/practical-test-pyramid.html
- Hexagonal architecture: Alistair Cockburn, "Hexagonal Architecture", 2005, https://alistair.cockburn.us/hexagonal-architecture/
- In-memory fakes: Gerard Meszaros, *xUnit Test Patterns*, 2007, "Fake Object", http://xunitpatterns.com/Fake%20Object.html
- Problem Details: IETF, RFC 9457, 2023, https://www.rfc-editor.org/rfc/rfc9457
- Testcontainers: Testcontainers, project documentation, https://testcontainers.com
- Playwright: Microsoft, Playwright documentation, https://playwright.dev
- Property-based testing: Koen Claessen & John Hughes, "QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs", ICFP 2000, doi:10.1145/351240.351266
- Mutation testing: DeMillo, Lipton & Sayward, "Hints on Test Data Selection: Help for the Practicing Programmer", *IEEE Computer* 11(4), 1978, doi:10.1109/C-M.1978.218136
- Mock only what you own: Freeman, Mackinnon, Pryce & Walnes, "Mock Roles, not Objects", OOPSLA 2004, doi:10.1145/1028664.1028765
