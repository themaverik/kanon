---
name: rust-discipline
description: Rust standards: errors, async, unsafe, testing, cargo verifiers. Load when reading, writing, or reviewing .rs files or Cargo.toml.
---

# Rust Discipline Router

Where the rules live: after `scripts/sync-editors.py --tools claude`, Claude Code loads the path-scoped ones from `.claude/rules/kanon/` when you touch matching files. The unscoped `common/` ones are in `.claude/kanon/rules/core/common/`. Without a sync, read them from `../../rules/` relative to this skill's base directory (`common/` is in the kanon-core plugin, `rust/` in kanon-rust).

Read only the rule files relevant to the task:

- `rules/common/` - cross-language rules (immutability, patterns, security, testing).
- `rules/rust/` - Rust specifics: coding-style, patterns, security, testing, hooks.
- `rules/rust/axum.md` - axum service rules, when the crate depends on axum.

Verifiers: clippy with `-D warnings`, rustfmt, cargo-deny, cargo-nextest, proptest, cargo-mutants for mutation, insta for snapshots. For review, dispatch the `rust-reviewer` agent.
