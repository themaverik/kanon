---
trigger: glob
globs: **/*.rs,**/Cargo.toml
---

# Rust Testing

> This file extends [common/testing.md](../common/testing.md) with Rust specific content.

## Runner

Use **cargo-nextest** (`cargo nextest run`). It isolates each test in its own process and reports flaky tests. Run doctests separately with `cargo test --doc`, since nextest skips them.

## Layout

- Unit tests in a `#[cfg(test)] mod tests` next to the code.
- Integration tests in `tests/`, using only the crate's public API.
- Doc examples on public items compile and run as tests.

## Beyond Examples

- **proptest** for properties: round-trips, invariants, parsers fed arbitrary input.
- **insta** for snapshot tests of large or structured output. Review snapshots with `cargo insta review`, never accept them blind.
- **cargo-mutants** to measure whether tests catch real changes. Kanōn judges tests by surviving mutants, not by a coverage percent. *(Kanōn)*
- Database and service tests run against real dependencies through `testcontainers`, not mocks of the driver.

## Sources

- cargo-nextest: nextest project, documentation, https://nexte.st
- Doctests: Rust project, "Documentation tests", The rustdoc book, https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html
- proptest: proptest project, The Proptest Book, https://proptest-rs.github.io/proptest/
- Property-based testing: Koen Claessen & John Hughes, "QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs", ICFP 2000, doi:10.1145/351240.351266
- Snapshot testing: insta, project documentation, https://insta.rs
- Mutation testing: DeMillo, Lipton & Sayward, "Hints on Test Data Selection: Help for the Practicing Programmer", *IEEE Computer* 11(4), 1978, doi:10.1109/C-M.1978.218136
- cargo-mutants: Martin Pool, cargo-mutants documentation, https://mutants.rs
- Testcontainers: Testcontainers, project documentation, https://testcontainers.com
