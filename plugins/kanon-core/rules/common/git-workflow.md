# Git Workflow

## Commit Message Format
```
PROJ-123: <imperative one-liner>

<optional body>
```

The `commit-craft` skill is the authority. No AI attribution footers. *(Kanōn)*

## Pull Request Workflow

When creating PRs:
1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Title the PR `PROJ-123: <summary>` and link the ticket *(Kanōn)*
4. Include test plan with TODOs
5. Push with `-u` flag if new branch, only after explicit confirmation *(Kanōn)*

> For the full development process (planning, TDD, code review) before git operations,
> see [development-workflow.md](./development-workflow.md).

## Sources

- Test-driven development: Kent Beck, *Test-Driven Development: By Example*, 2002
