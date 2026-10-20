# Testing Requirements

> General TDD practice (red-green-refactor, test structure, naming) is not restated here. Use
> superpowers `test-driven-development` or Matt Pocock's `tdd` skill. This file holds only what
> Kanōn adds.

## Evidence, Not Coverage

Coverage percent is not evidence. A test suite proves itself by killing mutants (PIT, Stryker)
and holding invariants under property tests (jqwik, fast-check). A survived mutant is a
documented gap, not a number to raise. *(Kanōn)*

- Run mutation testing on the changed code before review. Kill or document every survivor. *(Kanōn)*
- Fix the implementation, not the test, unless the test is wrong. *(Kanōn)*

## Agent Support

- **failure-mode-engineer**: enumerates failure scenarios, writes property tests and runs
  mutation testing. Use on Standard/Milestone changes.

## Sources

- Test-driven development: Kent Beck, *Test-Driven Development: By Example*, 2002
- Coverage is not test adequacy: Laura Inozemtseva and Reid Holmes, "Coverage Is Not Strongly Correlated with Test Suite Effectiveness", 2014, doi:10.1145/2568225.2568271
- Mutation testing: Richard DeMillo, Richard Lipton and Frederick Sayward, "Hints on Test Data Selection: Help for the Practicing Programmer", 1978, doi:10.1109/C-M.1978.218136
- Property-based testing: Koen Claessen and John Hughes, "QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs", 2000, doi:10.1145/351240.351266
