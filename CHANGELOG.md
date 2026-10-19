# Changelog

## 1.0.0 (Aug 2026)

Standards and rule files reconciled:

- Errors are RFC 9457 Problem Details (`application/problem+json`), replacing the old `ApiResponse` envelope in `common/patterns.md`, `java/patterns.md` and `typescript/patterns.md`.
- ADRs follow MADR `ADR-NNN-<slug>.md` with an auto-maintained `index.md`.
- Compose files use `docker-compose.<qualifier>.yml`, kept deliberately over the newer `compose.yaml` spec name.
- Quarkus schema strategy is `quarkus.hibernate-orm.schema-management.strategy`. `database.generation` is deprecated.
- A NestJS backend-TS standard is planned. Until then, `rules/typescript/nestjs.md` governs.
