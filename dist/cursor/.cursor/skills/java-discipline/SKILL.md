---
name: java-discipline
description: Java and Quarkus coding standards, patterns, security, and testing rules. Load when reading, writing, or reviewing .java files or Maven/Gradle builds.
---

# Java Discipline Router

Read only the rule files relevant to the task, from the plugin's `rules/` directory:

- `rules/common/` - cross-language: coding-style (immutability is CRITICAL), patterns, security, testing, performance, code-review, development-workflow, git-workflow.
- `rules/java/` - Java specifics: coding-style, patterns, security, testing, hooks.
- `rules/java/quarkus.md` - Quarkus/CDI idioms, reactive rules, underuse checklist.
- `rules/java-services.md` - service-layer conventions.

Verifiers to prefer over prose claims: ArchUnit/Taikai architecture tests, Error Prone at compile, SpotBugs+FindSecBugs, PIT for mutation, jqwik for properties. For Quarkus idiom review, dispatch the `quarkus-reviewer` agent.

## Composed airails skills (vendored, MIT, AdamBien/airails)

Compose in this order; a more specific skill wins over a general one:
- `java-conventions` - modern-syntax baseline. It targets Java 25; apply only the features the repo's actual Java version supports (check pom/gradle toolchain first).
- `bce` - Boundary-Control-Entity packaging, when the repo uses BC layout. In hexagonal repos, our rules' ports/adapters layering wins; do not mix the two vocabularies in one module.
- `microprofile-server` - MicroProfile/Jakarta idioms; Quarkus implements MicroProfile, so these apply to Quarkus REST/config/fault-tolerance code alongside rules/java/quarkus.md (quarkus.md wins on conflicts).
- `continuous-testing` - Quarkus dev-mode test loop discipline.
- `ears-tests` - table-driven parameterized tests from EARS-style requirement statements; pairs with the failure-mode-engineer for spec-derived cases.
- `system-tests` - separate-project system tests against the running service.
- `java-distiller` - simplification transformations; aligns with surgical-changes/simplicity-first when asked to reduce code.
- `sbce` - opt-in spec-driven workflow (capability spec = boundary contract). Adopt per team decision, not by default.

## Kotlin repos
This plugin covers Kotlin/Quarkus too: rules/java/kotlin.md governs .kt files (idioms, all-open/CDI, coroutines vs Mutiny, detekt). java-conventions applies only where Kotlin has no idiom of its own; BCE composition works identically (packages, not language, define the layers).
