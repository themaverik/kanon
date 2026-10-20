---
paths:
  - "**/*.rs"
---
# axum Services

> Applies when the crate depends on axum. Extends [patterns.md](patterns.md).

- Handlers are thin: extract, call a domain service, map the result. No business logic in handlers.
- Shared state goes in one `AppState` passed with `State<_>`. No globals.
- Errors implement `IntoResponse` once, producing RFC 9457 Problem Details (`application/problem+json`). Handlers return `Result<_, AppError>`.
- Validate request bodies at the edge (`validator` or a parse-into-type extractor).
- Cross-cutting concerns (tracing, timeouts, CORS, request limits) are `tower` layers, not handler code.
- Test routers in-process with `tower::ServiceExt::oneshot`, without binding a port.
