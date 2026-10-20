---
paths:
  - "**/*.rs"
  - "**/Cargo.toml"
---
# Rust Coding Style

> This file extends [common/coding-style.md](../common/coding-style.md) with Rust specific content.

## Tooling Is the Style Guide

- `rustfmt` decides formatting. Commit `rustfmt.toml` only for settings the team agreed on.
- `cargo clippy --all-targets -- -D warnings` must pass. Allow a lint locally with `#[allow(clippy::x)]` plus a reason, never crate-wide without an ADR. *(Kanōn)*
- Pin the toolchain in `rust-toolchain.toml` so CI and laptops agree.

## Naming

Follow the [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/naming.html): `snake_case` for functions, modules and variables, `UpperCamelCase` for types and traits, `SCREAMING_SNAKE_CASE` for constants. Conversions are `as_` (cheap, borrowed), `to_` (costly) and `into_` (consuming).

## Ownership

- Take `&str`, `&[T]` or `impl AsRef<_>` in parameters; return owned types.
- Immutable by default. Reach for `mut` only where the code needs it.
- A `clone()` that exists to satisfy the borrow checker is a design smell. Restructure first. *(Kanōn)*
- Prefer iterators over index loops.

## Modules and Visibility

- Smallest visibility that works: private, then `pub(crate)`, then `pub`.
- One concept per module. Re-export the public surface from `lib.rs`.
- Workspaces split crates by dependency direction, not by file count.

## Sources

- rustfmt: Rust project, rustfmt documentation, https://rust-lang.github.io/rustfmt/
- Clippy: Rust project, Clippy documentation, https://doc.rust-lang.org/clippy/
- Pinned toolchain: Rust project, "Overrides", The rustup book, https://rust-lang.github.io/rustup/overrides.html
- Naming conventions: Rust API Guidelines, "Naming", https://rust-lang.github.io/api-guidelines/naming.html
- Caller control over copies: Rust API Guidelines, "Flexibility" (C-CALLER-CONTROL), https://rust-lang.github.io/api-guidelines/flexibility.html#caller-decides-where-to-copy-and-place-data-c-caller-control
- Minimize mutability: Joshua Bloch, *Effective Java*, 3rd ed., 2018, Item 17
- Smallest visibility: David Parnas, "On the Criteria To Be Used in Decomposing Systems into Modules", *CACM* 15(12), 1972, doi:10.1145/361598.361623
