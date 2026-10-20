---
trigger: glob
globs: **/*.tsx,**/*.ts,**/*.css
---

> This file extends [common/hooks.md](../common/hooks.md) with web-specific hook recommendations.

# Web Hooks

## Recommended PostToolUse Hooks

Prefer project-local tooling. Do not wire hooks to remote one-off package execution.

### Format on Save

Use the project's existing formatter entrypoint after edits:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "pnpm prettier --write \"$(jq -r .tool_input.file_path)\"" }]
      }
    ]
  }
}
```

Hooks receive the tool input as JSON on stdin; the edited path is `tool_input.file_path`.
Equivalent local commands via `yarn prettier` or `npm exec prettier --` are fine when they use repo-owned dependencies.

### Lint Check

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "pnpm eslint --fix \"$(jq -r .tool_input.file_path)\"" }]
      }
    ]
  }
}
```

### Type Check

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "pnpm tsc --noEmit --pretty false" }]
      }
    ]
  }
}
```

### CSS Lint

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "pnpm stylelint --fix \"$(jq -r .tool_input.file_path)\"" }]
      }
    ]
  }
}
```

## PreToolUse Hooks

### Guard File Size *(Kanōn)*

Block oversized writes from tool input content, not from a file that may not exist yet:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [{ "type": "command", "command": "node -e \"let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);const c=i.tool_input?.content||'';const lines=c.split('\\n').length;if(lines>800){console.error('[Hook] BLOCKED: File exceeds 800 lines ('+lines+' lines)');console.error('[Hook] Split into smaller modules');process.exit(2)}console.log(d)})\"" }]
      }
    ]
  }
}
```

## Build Verification

Run `pnpm build` before commit or in CI. A `Stop` hook runs every time Claude finishes a turn, so a build there runs once per reply.

## Ordering

Recommended order:
1. format
2. lint
3. type check
4. build verification (pre-commit or CI)

## Sources

- Claude Code hooks: Anthropic, "Hooks", Claude Code documentation, https://code.claude.com/docs/en/hooks
- Prettier: Prettier, documentation, https://prettier.io
- ESLint: ESLint, documentation, https://eslint.org
- Stylelint: Stylelint, documentation, https://stylelint.io
