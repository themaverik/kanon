---
applyTo: "**/*.md,docs/**"
---

# Documentation Standards

Read `.claude/references/documentation-standards.md` for full conventions.

## Critical Rules

- No icons or emojis unless explicitly stated
- Exception: status indicators in README.md only
  (done, in progress, not started, new release, declined)
- File naming: kebab-case for config/reference files, hyphenated Title-Case for docs/ files
- Exception: README.md, CHANGELOG.md, LICENSE, CONTRIBUTING.md keep standard names
- Exception: ADR files follow MADR standard — `ADR-NNN-<kebab-slug>.md` (uppercase prefix)
- Document titles: Title Case inside the file
- `docs/adr/index.md` is auto-maintained — never edit directly
- README.md stays concise and follows the org repo-standard README template where one
  exists (e.g. quarkus-backend-repo-standard.md §18): what it is, how to run it,
  configuration, links into docs/ — link out rather than duplicate
- Architecture/setup docs (not research or deep-dive): focused, points of max 3-4 lines with a summary line, diagrams, Open Sans at standard/small size. Full rule: reference section "Architecture and Setup Documents".
