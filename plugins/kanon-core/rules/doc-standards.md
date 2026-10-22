---
paths:
  - "**/*.md"
  - "docs/**"
---

# Documentation Standards

Read `.kanon/references/documentation-standards.md` for full conventions.

## Critical Rules

- No icons or emojis unless explicitly stated *(Kanōn)*
- Exception: status indicators in README.md only
  (done, in progress, not started, new release, declined)
- File naming: kebab-case for config/reference files, hyphenated Title-Case for docs/ files *(Kanōn)*
- Exception: GitHub and open-source standard files keep their names (README, CHANGELOG, CONTRIBUTING,
  LICENSE, COPYING, NOTICE, CODE_OF_CONDUCT, SECURITY, SUPPORT ...), as do names a tool looks up
  (CLAUDE.md, AGENTS.md, SKILL.md, DESIGN.md, PRODUCT.md, index.md). Vendored trees keep upstream
  names: list them in `.docnames-exempt`
- Enforced by `doc-name-check.py`: the doc-name-guard hook (Write and Bash), pre-commit and CI.
  ALL-CAPS names such as `WEB-DESIGN-NOTICE.md` fail
- Exception: ADR files follow MADR standard: `ADR-NNN-<kebab-slug>.md` (uppercase prefix)
- Document titles: Title Case inside the file
- `docs/adr/index.md` is auto-maintained. Never edit directly
- README.md stays concise and follows the org repo-standard README template where one
  exists (e.g. quarkus-backend-repo-standard.md §18): what it is, how to run it,
  configuration, links into docs/. Link out rather than duplicate
- Architecture/setup docs (not research or deep-dive): focused, points of max 3-4 lines with a summary line, diagrams, Open Sans at standard/small size. Full rule: reference section "Architecture and Setup Documents". *(Kanōn)*

## Sources

- MADR: Oliver Kopp, Olaf Zimmermann et al., "Markdown Architectural Decision Records", https://adr.github.io/madr/
