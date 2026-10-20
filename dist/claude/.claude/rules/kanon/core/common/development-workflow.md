---
paths:
  - "**/*.java"
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.py"
  - "**/*.go"
  - "**/*.rs"
---
# Development Workflow

> General planning and TDD practice is not restated here. Use superpowers (`brainstorming`,
> `writing-plans`, `test-driven-development`) or Matt Pocock's skills (`to-spec`, `tdd`). This file holds only the
> steps Kanōn adds before [git-workflow.md](./git-workflow.md).

Pick the scope tier first (see `CLAUDE.md`). Trivial changes skip to the build gate. *(Kanōn)*

1. **Ticket.** No Standard/Milestone work starts without a ticket key. The ticket is the single
   source of work-item truth: no PRD, roadmap or task-list files in the repo. *(Kanōn)*
2. **Plan in the ticket.** State assumptions, success criteria and the verifier that proves each
   one. Contract or schema changes go to `backend-architect`. Decisions become ticket-linked ADRs. *(Kanōn)*
3. **Mutation evidence.** Run mutation testing on the changed code. Kill or document survivors
   (see [testing.md](./testing.md)). *(Kanōn)*
4. **Read-only review.** `architect-review` plus the stack reviewer. Reviewers never edit. *(Kanōn)*
   Address CRITICAL and HIGH issues before merging.
5. **Commit.** `PROJ-123:` subjects per the `commit-craft` skill.

## Sources

- Test-driven development: Kent Beck, *Test-Driven Development: By Example*, 2002
- Architecture Decision Records: Michael Nygard, "Documenting Architecture Decisions", 2011, https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- Mutation testing: Richard DeMillo, Richard Lipton and Frederick Sayward, "Hints on Test Data Selection: Help for the Practicing Programmer", 1978, doi:10.1109/C-M.1978.218136
