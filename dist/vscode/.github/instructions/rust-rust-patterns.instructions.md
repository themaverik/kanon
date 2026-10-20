---
applyTo: "**/*.rs,**/Cargo.toml"
---

# Rust Patterns

> This file extends [common/patterns.md](../common/patterns.md) with Rust specific content.

## Errors

- Libraries return typed errors built with `thiserror`. Binaries and tests may use `anyhow` or `eyre`.
- Never let `anyhow::Error` or `Box<dyn Error>` cross a library's public API.
- Add context where an error crosses a layer (`.context("loading config")`), not at every `?`.
- `unwrap()` and `expect()` belong in tests, examples and provably infallible cases. Comment the proof.

## Types Over Checks

- Newtypes for IDs and units (`struct OrderId(Uuid)`) so they can't be swapped.
- Parse, don't validate: convert raw input into a type that can only hold valid values.
- Enums for state machines. Make invalid states unrepresentable.
- Builders for structs with many optional fields. Mark them `#[must_use]`.

## Async

- One runtime per binary (usually Tokio). Libraries stay runtime-agnostic where they can.
- No blocking I/O or long CPU work on async tasks. Use `spawn_blocking` or a dedicated pool.
- Never hold a `std::sync::Mutex` guard across `.await`.
- Every spawned task has an owner that joins or cancels it. Bounded channels by default.

## Architecture

Hexagonal fits Rust well: the domain crate defines traits (ports) and depends on no framework or I/O crate. Adapters live in their own crates or modules and implement those traits. The binary crate wires them together.

## Sources

- Newtype: Rust API Guidelines, "Type safety" (C-NEWTYPE), https://rust-lang.github.io/api-guidelines/type-safety.html
- Parse, don't validate: Alexis King, "Parse, don't validate", 2019, https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/
- Make invalid states unrepresentable: Yaron Minsky, "Effective ML Revisited", Jane Street blog, 2011, https://blog.janestreet.com/effective-ml-revisited/
- Builder: Gamma, Helm, Johnson & Vlissides, *Design Patterns*, 1994
- Structured concurrency: Nathaniel J. Smith, "Notes on structured concurrency, or: Go statement considered harmful", 2018, https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/
- Hexagonal architecture: Alistair Cockburn, "Hexagonal Architecture", 2005, https://alistair.cockburn.us/hexagonal-architecture/
