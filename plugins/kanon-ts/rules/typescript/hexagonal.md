---
paths:
  - "**/*.ts"
---
# Hexagonal Backend (framework-neutral)

> Applies to TS backends that declare hexagonal architecture in CLAUDE.md, on any framework (NestJS, Express, Fastify, Hono). Extends [patterns.md](patterns.md).

## Layers

- **domain** - entities, value objects, domain errors. Imports no framework, ORM or I/O package. Pure libraries (a UUID or decimal type) are fine.
- **application** - use cases and port interfaces (`interface OrderRepository`). Imports domain only.
- **adapters** - HTTP handlers, ORM repositories, queue consumers, external clients. Implement ports, import application and domain.
- **composition root** - one place (NestJS module, `main.ts`, a factory) wires adapters to ports.

Dependencies point inward only. The framework is an adapter.

## Rules

- No framework, ORM or HTTP types in domain or application (`@nestjs/*`, `express`, `fastify`, `@prisma/client`, `typeorm`, `Request`, `Response`).
- Ports are defined by the use case that needs them, in its own terms, not as a mirror of the ORM.
- Adapters map between wire or ORM shapes and domain types at the boundary. ORM entities never reach a use case.
- Use cases take plain input types and return results or domain errors. HTTP adapters translate those errors to RFC 9457 Problem Details.

## Enforcement

Encode the layer rules in dependency-cruiser and fail CI on violations:

```js
// .dependency-cruiser.cjs
forbidden: [
  { name: 'domain-is-pure', from: { path: '^src/domain' },
    to: { path: '^src/(application|adapters)|node_modules/(@nestjs|express|fastify|hono|@prisma|typeorm)' } },
  { name: 'application-no-adapters', from: { path: '^src/application' },
    to: { path: '^src/adapters' } },
]
```

## Sources

- Hexagonal architecture: Alistair Cockburn, "Hexagonal Architecture", 2005, https://alistair.cockburn.us/hexagonal-architecture/
- Value object: Eric Evans, *Domain-Driven Design*, 2003; Martin Fowler, "Value Object", https://martinfowler.com/eaaCatalog/valueObject.html
- Repository: Martin Fowler, *Patterns of Enterprise Application Architecture*, 2002, https://martinfowler.com/eaaCatalog/repository.html
- Composition root: Mark Seemann, "Composition Root", 2011, https://blog.ploeh.dk/2011/07/28/CompositionRoot/
- Dependency rule: Robert C. Martin, "The Clean Architecture", 2012, https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- Problem Details: IETF, RFC 9457, 2023, https://www.rfc-editor.org/rfc/rfc9457
- Architecture fitness functions: Neal Ford, Rebecca Parsons & Patrick Kua, *Building Evolutionary Architectures*, 2017
- dependency-cruiser: Sander Verweij and contributors, dependency-cruiser documentation, https://github.com/sverweij/dependency-cruiser
