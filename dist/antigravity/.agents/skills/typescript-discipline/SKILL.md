---
name: typescript-discipline
description: TypeScript and NestJS standards, DI and module-boundary rules, strict typing. Load when reading, writing, or reviewing .ts files or NestJS modules.
---

# TypeScript Discipline Router

Where the rules live: after `scripts/sync-editors.py --tools claude`, Claude Code loads the path-scoped ones from `.claude/rules/kanon/` when you touch matching files. The unscoped `common/` ones are in `.claude/kanon/rules/core/common/`. Without a sync, read them from `../../rules/` relative to this skill's base directory (`common/` is in the kanon-core plugin, `typescript/` in kanon-ts).

Read only the rule files relevant to the task:

- `rules/common/` - cross-language rules (immutability, patterns, security, testing).
- `rules/typescript/` - TS specifics: coding-style, patterns, security, testing, hooks.
- `rules/typescript/nestjs.md` - NestJS module/DI/boundary rules.

Verifiers: typescript strict + typescript-eslint or Biome, dependency-cruiser for boundaries, knip for dead code, Stryker for mutation, fast-check for properties. For boundary review, dispatch the `nestjs-boundary-reviewer` agent.
