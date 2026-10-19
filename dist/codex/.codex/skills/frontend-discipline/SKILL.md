---
name: frontend-discipline
description: Frontend (React/Next.js) standards, design quality, performance, and accessibility rules. Load when working on .tsx/.jsx components, styles, or Next.js routing.
---

# Frontend Discipline Router

Read only the rule files relevant to the task, from the plugin's `rules/` directory:

- `rules/web/` - coding-style, design-quality, patterns, performance, security, testing, hooks.
- `rules/frontend.md` - repo-level frontend conventions.
- `rules/typescript/` - applies to all TS/TSX.

Verifiers: eslint (next/react plugins) or Biome, dependency-cruiser for component-layer boundaries, knip for unused components/exports. For visual/design generation quality, prefer the official frontend-design plugin.
