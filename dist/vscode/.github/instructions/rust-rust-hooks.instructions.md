---
applyTo: "**/*.rs,**/Cargo.toml"
---

# Rust Hooks

> This file extends [common/hooks.md](../common/hooks.md) with Rust specific content.

## PostToolUse Hooks

kanon-core's post-edit-lint runs `cargo fmt --check` on each edited `.rs` file. Clippy is too slow for a per-edit hook, so it runs before commit and in CI.

## CI Gate

`cargo fmt --all -- --check`, `cargo clippy --all-targets -- -D warnings`, `cargo nextest run`, `cargo deny check`. Run cargo-mutants on changed code (`--in-diff`) rather than the whole crate.
