---
trigger: model_decision
description: Testing Requirements
---

# Testing Requirements

> General TDD practice (red-green-refactor, test structure, naming) is not restated here. Use
> superpowers `test-driven-development` or Matt Pocock's `tdd` skill. This file holds only what
> Kanōn adds.

## Evidence, Not Coverage

Coverage percent is not evidence. A test suite proves itself by killing mutants (PIT, Stryker)
and holding invariants under property tests (jqwik, fast-check). A survived mutant is a
documented gap, not a number to raise.

- Run mutation testing on the changed code before review. Kill or document every survivor.
- Fix the implementation, not the test, unless the test is wrong.

## Agent Support

- **failure-mode-engineer**: enumerates failure scenarios, writes property tests and runs
  mutation testing. Use on Standard/Milestone changes.
