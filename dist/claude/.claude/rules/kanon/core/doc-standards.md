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
- Exception: README.md, CHANGELOG.md, LICENSE, CONTRIBUTING.md keep standard names
- Exception: ADR files follow MADR standard: `ADR-NNN-<kebab-slug>.md` (uppercase prefix)
- Document titles: Title Case inside the file
- `docs/adr/index.md` is auto-maintained. Never edit directly
- README.md stays concise and follows the org repo-standard README template where one
  exists (e.g. quarkus-backend-repo-standard.md §18): what it is, how to run it,
  configuration, links into docs/. Link out rather than duplicate
- Architecture/setup docs (not research or deep-dive): focused, points of max 3-4 lines with a summary line, diagrams, Open Sans at standard/small size. Full rule: reference section "Architecture and Setup Documents". *(Kanōn)*

## Sources

- MADR: Oliver Kopp, Olaf Zimmermann et al., "Markdown Architectural Decision Records", https://adr.github.io/madr/
