---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript/JavaScript Hooks

> This file extends [common/hooks.md](../common/hooks.md) with TypeScript/JavaScript specific content.

## PostToolUse Hooks

Configure in `~/.claude/settings.json`:

- **Prettier**: Auto-format JS/TS files after edit
- **TypeScript check**: Run `tsc` after editing `.ts`/`.tsx` files
- **console.log warning**: Warn about `console.log` in edited files

## Stop Hooks

- **console.log audit**: Check modified files for `console.log` when Claude finishes a turn (Stop runs once per turn, not once per session)

## Sources

- Claude Code hooks: Anthropic, "Hooks", Claude Code documentation, https://code.claude.com/docs/en/hooks
- Prettier: Prettier, documentation, https://prettier.io
