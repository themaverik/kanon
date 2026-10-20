---
trigger: glob
globs: **/*.java,**/*.ts,**/*.tsx,**/*.js,**/*.py,**/*.go,**/*.rs
---

# Performance Optimization

## Context Window Management

Avoid last 20% of context window for: *(Kanōn)*
- Large-scale refactoring
- Feature implementation spanning multiple files
- Debugging complex interactions

Lower context sensitivity tasks:
- Single-file edits
- Independent utility creation
- Documentation updates
- Simple bug fixes

## Thinking and Effort

Thinking is always on for Opus 5.5, Sonnet 5.5 and the Fable models; the thinking toggle and a thinking-token budget have no effect on them. The effort level sets how much they think, and so the cost and latency of a turn. Set it with `/effort`, `--effort`, or `effort` in a skill or subagent's frontmatter. Ctrl+O shows the thinking output.

## Sources

- Extended thinking: Anthropic, "Model configuration", https://code.claude.com/docs/en/model-config
- Plan Mode: Anthropic, "Common workflows", https://code.claude.com/docs/en/common-workflows
