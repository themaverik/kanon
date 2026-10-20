---
paths:
  - "**/*.rs"
  - "**/Cargo.toml"
---
# Rust Coding Style

> This file extends [common/coding-style.md](../common/coding-style.md) with Rust specific content.

## Tooling Is the Style Guide

- `rustfmt` decides formatting. Commit `rustfmt.toml` only for settings the team agreed on.
- `cargo clippy --all-targets -- -D warnings` must pass. Allow a lint locally with `#[allow(clippy::x)]` plus a reason, never crate-wide without an ADR.
- Pin the toolchain in `rust-toolchain.toml` so CI and laptops agree.

## Naming

Follow the [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/naming.html): `snake_case` for functions, modules and variables, `UpperCamelCase` for types and traits, `SCREAMING_SNAKE_CASE` for constants. Conversions are `as_` (cheap, borrowed), `to_` (costly) and `into_` (consuming).

## Ownership

- Take `&str`, `&[T]` or `impl AsRef<_>` in parameters; return owned types.
- Immutable by default. Reach for `mut` only where the code needs it.
- A `clone()` that exists to satisfy the borrow checker is a design smell. Restructure first.
- Prefer iterators over index loops.

## Modules and Visibility

- Smallest visibility that works: private, then `pub(crate)`, then `pub`.
- One concept per module. Re-export the public surface from `lib.rs`.
- Workspaces split crates by dependency direction, not by file count.
