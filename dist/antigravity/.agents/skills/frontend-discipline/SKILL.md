---
name: frontend-discipline
description: Frontend (React/Next.js) standards, design quality, performance, and accessibility rules. Load when working on .tsx/.jsx components, styles, or Next.js routing.
---

# Frontend Discipline Router

Where the rules live: after `scripts/sync-editors.py --tools claude`, Claude Code loads the path-scoped ones from `.claude/rules/kanon/` when you touch matching files. The unscoped `common/` ones are in `.claude/kanon/rules/core/common/`. Without a sync, read them from `../../rules/` relative to this skill's base directory (`common/` is in the kanon-core plugin, `typescript/` in kanon-ts).

Read only the rule files relevant to the task:

- `rules/web/` - coding-style, design-quality, patterns, performance, security, testing, hooks.
- `rules/frontend.md` - repo-level frontend conventions.
- `rules/typescript/` - applies to all TS/TSX.

Verifiers: eslint (next/react plugins) or Biome, dependency-cruiser for component-layer boundaries, knip for unused components/exports. For visual/design generation quality, prefer the official frontend-design plugin.
