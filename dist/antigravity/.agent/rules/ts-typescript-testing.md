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
- **Stryker** on changed files to find tests that don't catch real changes. Surviving mutants are the gap to close.
- Mock only what you own. Third-party clients sit behind a port, and the port gets the fake.
