---
trigger: model_decision
description: Coding Style
---

# Coding Style

## Immutability (CRITICAL)

ALWAYS create new objects, NEVER mutate existing ones:

```
// Pseudocode
WRONG:  modify(original, field, value) → changes original in-place
CORRECT: update(original, field, value) → returns new copy with change
```

Rationale: Immutable data prevents hidden side effects, makes debugging easier, and enables safe concurrency.

## Core Principles

### KISS (Keep It Simple)

- Prefer the simplest solution that actually works
- Avoid premature optimization
- Optimize for clarity over cleverness

### DRY (Don't Repeat Yourself)

- Extract repeated logic into shared functions or utilities
- Avoid copy-paste implementation drift
- Introduce abstractions when repetition is real, not speculative

### YAGNI (You Aren't Gonna Need It)

- Do not build features or abstractions before they are needed
- Avoid speculative generality
- Start simple, then refactor when the pressure is real

## File Organization

MANY SMALL FILES > FEW LARGE FILES:
- High cohesion, low coupling
- 200-400 lines typical, 800 max *(Kanōn)*
- Extract utilities from large modules
- Organize by feature/domain, not by type

## Error Handling

ALWAYS handle errors comprehensively:
- Handle errors explicitly at every level
- Provide user-friendly error messages in UI-facing code
- Log detailed error context on the server side
- Never silently swallow errors

## Input Validation

ALWAYS validate at system boundaries:
- Validate all user input before processing
- Use schema-based validation where available
- Fail fast with clear error messages
- Never trust external data (API responses, user input, file content)

## Naming Conventions

- Variables and functions: `camelCase` with descriptive names
- Booleans: prefer `is`, `has`, `should`, or `can` prefixes
- Interfaces, types, and components: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Custom hooks: `camelCase` with a `use` prefix

## Code Smells to Avoid

### Deep Nesting

Prefer early returns over nested conditionals once the logic starts stacking.

### Magic Numbers

Use named constants for meaningful thresholds, delays, and limits.

### Long Functions

Split large functions into focused pieces with clear responsibilities.

## Code Quality Checklist

Before marking work complete:
- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling
- [ ] No hardcoded values (use constants or config)
- [ ] No mutation (immutable patterns used)

## Sources

- Immutability: Joshua Bloch, *Effective Java*, 3rd ed., 2018, Item 17 "Minimize mutability"
- Premature optimization: Donald Knuth, "Structured Programming with go to Statements", 1974, doi:10.1145/356635.356640
- DRY: Andrew Hunt and David Thomas, *The Pragmatic Programmer*, 1999
- YAGNI: Kent Beck, *Extreme Programming Explained*, 1999; Martin Fowler, "Yagni", https://martinfowler.com/bliki/Yagni.html
- Speculative generality: Martin Fowler and Kent Beck, *Refactoring*, 1999, ch.3 "Bad Smells in Code"
- High cohesion, low coupling: W. P. Stevens, G. J. Myers and L. L. Constantine, "Structured Design", 1974, doi:10.1147/sj.132.0115
- Validate at system boundaries: OWASP, "Input Validation Cheat Sheet", https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
- Fail fast: Jim Shore, "Fail Fast", 2004, https://martinfowler.com/ieeeSoftware/failFast.pdf
- Custom hooks: React, "Reusing Logic with Custom Hooks", https://react.dev/learn/reusing-logic-with-custom-hooks
- Early return: Kent Beck, *Smalltalk Best Practice Patterns*, 1996 ("Guard Clause"); Martin Fowler, *Refactoring*, 1999 ("Replace Nested Conditional with Guard Clauses")
- Magic numbers: Martin Fowler, *Refactoring*, 1999 ("Replace Magic Number with Symbolic Constant")
- Long functions: Martin Fowler and Kent Beck, *Refactoring*, 1999 ("Long Method")
