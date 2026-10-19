---
applyTo: "**/*.kt"
---

# Kotlin (Quarkus) Rules

> Applies alongside java/quarkus.md when the repo uses Kotlin (io.quarkus:quarkus-kotlin).

## Idioms over Java translation
- Data carriers: `data class` (or Panache Kotlin entities); no Lombok-style builders.
- Null safety is the type system: no `!!` outside tests; platform types from Java APIs get an explicit nullable/non-null decision at the boundary.
- Immutability: `val` default, immutable collections at API surfaces.
- Extension functions for local ergonomics only; never to hide domain logic from its owning component.

## Quarkus specifics
- CDI beans as normal classes with constructor injection; `@ApplicationScoped` proxying requires open classes - the all-open plugin handles it, never mark beans `final` manually.
- Reactive: prefer coroutines via quarkus-kotlin (`suspend` REST methods) over hand-managed Mutiny chains where supported; the event-loop blocking rules from quarkus.md apply identically to coroutine dispatchers.
- Panache: use the Kotlin variants (PanacheEntityBase/PanacheRepository from quarkus-hibernate-orm-panache-kotlin).

## Verifiers
- detekt (+ detekt-formatting) is the lint baseline; ktlint via spotless acceptable alternative - pick one per repo.
- ArchUnit works on Kotlin bytecode: the same Taikai/ArchUnit rules from quarkus.md apply unchanged.
- Mutation: PIT with the Kotlin plugin; properties: jqwik works, kotest-property is the Kotlin-native alternative.
