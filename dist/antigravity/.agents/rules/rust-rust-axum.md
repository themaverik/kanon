---
trigger: glob
globs: **/*.rs
---

# axum Services

> Applies when the crate depends on axum. Extends [patterns.md](patterns.md).

- Handlers are thin: extract, call a domain service, map the result. No business logic in handlers.
- Shared state goes in one `AppState` passed with `State<_>`. No globals.
- Errors implement `IntoResponse` once, producing RFC 9457 Problem Details (`application/problem+json`). Handlers return `Result<_, AppError>`.
- Validate request bodies at the edge (`validator` or a parse-into-type extractor).
- Cross-cutting concerns (tracing, timeouts, CORS, request limits) are `tower` layers, not handler code.
- Test routers in-process with `tower::ServiceExt::oneshot`, without binding a port.

## Sources

- Problem Details: IETF, RFC 9457, 2023, https://www.rfc-editor.org/rfc/rfc9457
- Input validation: OWASP, "Input Validation Cheat Sheet", https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
- Middleware layers: Tower project, tower crate documentation, https://docs.rs/tower
