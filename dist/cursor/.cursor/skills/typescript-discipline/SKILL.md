---
name: typescript-discipline
description: TypeScript and NestJS standards, DI and module-boundary rules, strict typing. Load when reading, writing, or reviewing .ts files or NestJS modules.
---

# TypeScript Discipline Router

Read only the rule files relevant to the task, from the plugin's `rules/` directory:

- `rules/common/` - cross-language rules (immutability, patterns, security, testing).
- `rules/typescript/` - TS specifics: coding-style, patterns, security, testing, hooks.
- `rules/typescript/nestjs.md` - NestJS module/DI/boundary rules.

Verifiers: typescript strict + typescript-eslint or Biome, dependency-cruiser for boundaries, knip for dead code, Stryker for mutation, fast-check for properties. For boundary review, dispatch the `nestjs-boundary-reviewer` agent.
