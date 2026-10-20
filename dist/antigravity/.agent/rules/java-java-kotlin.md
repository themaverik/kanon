---
trigger: glob
globs: **/*.kt
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

## Sources

- Minimize mutability: Joshua Bloch, *Effective Java*, 3rd ed., Addison-Wesley, 2018, Item 17
- Dependency injection: Martin Fowler, "Inversion of Control Containers and the Dependency Injection pattern", 2004, https://martinfowler.com/articles/injection.html
- Never block the event loop: Eclipse Vert.x, "Golden Rule - Don't Block the Event Loop", Vert.x Core documentation, https://vertx.io/docs/vertx-core/java/#golden_rule
- Architecture tests as fitness functions: Neal Ford, Rebecca Parsons & Patrick Kua, *Building Evolutionary Architectures*, O'Reilly, 2017
- Mutation testing: Richard A. DeMillo, Richard J. Lipton & Frederick G. Sayward, "Hints on Test Data Selection: Help for the Practicing Programmer", 1978, doi:10.1109/C-M.1978.218136
- Property-based testing: Koen Claessen & John Hughes, "QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs", ICFP 2000, doi:10.1145/351240.351266
