---
trigger: glob
globs: **/*.rs,**/Cargo.toml
---

# Rust Security

> This file extends [common/security.md](../common/security.md) with Rust specific content.

## Supply Chain

- `cargo deny check` in CI covers advisories (RustSec), licenses, banned crates and duplicate versions. Commit `deny.toml`.
- Commit `Cargo.lock` for binaries and services.
- Review new dependencies for maintenance, `unsafe` use and `build.rs` side effects before adding them.

## unsafe

- Every `unsafe` block has a `// SAFETY:` comment naming the invariant it relies on.
- Crates that need no `unsafe` declare `#![forbid(unsafe_code)]`.
- Run Miri on code with `unsafe` where the test suite allows it.

## Secrets and Input

- Secrets come from the environment or a secret manager. Wrap them in `secrecy::SecretString` so they don't reach logs or `Debug` output.
- Bound every size read from untrusted input before allocating.
- Use `sqlx` or another parameterized query API. Never build SQL with `format!`.

## Agent Support

- Use **rust-reviewer** plus `architect-review` for security-sensitive changes.
