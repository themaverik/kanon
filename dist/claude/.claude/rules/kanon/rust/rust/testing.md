---
paths:
  - "**/*.rs"
  - "**/Cargo.toml"
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
- **cargo-mutants** to measure whether tests catch real changes. Kanōn judges tests by surviving mutants, not by a coverage percent.
- Database and service tests run against real dependencies through `testcontainers`, not mocks of the driver.
