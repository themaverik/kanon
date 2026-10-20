# Code Review Standards

## Purpose

Code review ensures quality, security, and maintainability before code is merged. This rule defines when and how to conduct code reviews.

## When to Review

**MANDATORY review triggers:**

- After writing or modifying code
- Before any commit to shared branches
- When security-sensitive code is changed (auth, payments, user data)
- When architectural changes are made
- Before merging pull requests

**Pre-Review Requirements:**

Before requesting review, ensure:

- All automated checks (CI/CD) are passing
- Merge conflicts are resolved
- Branch is up to date with target branch

## Review Checklist

Before marking code complete:

- [ ] Code is readable and well-named
- [ ] Functions are focused (<50 lines) *(Kanōn)*
- [ ] Files are cohesive (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Errors are handled explicitly
- [ ] No hardcoded secrets or credentials
- [ ] No console.log or debug statements
- [ ] Tests exist for new functionality
- [ ] Mutation testing shows no undocumented survivors in changed code *(Kanōn)*

## Security Review Triggers

**STOP and get a read-only security review (`architect-review` plus the stack reviewer) when:** *(Kanōn)*

- Authentication or authorization code
- User input handling
- Database queries
- File system operations
- External API calls
- Cryptographic operations
- Payment or financial code

## Review Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| CRITICAL | Security vulnerability or data loss risk | **BLOCK** - Must fix before merge |
| HIGH | Bug or significant quality issue | **WARN** - Should fix before merge |
| MEDIUM | Maintainability concern | **INFO** - Consider fixing |
| LOW | Style or minor suggestion | **NOTE** - Optional |

## Agent Usage

Use these agents for code review:

| Agent | Purpose |
|-------|---------|
| **architect-review** | Layering, boundaries, SOLID, distributed-systems patterns |
| **quarkus-reviewer** / **spring-reviewer** | Java framework idioms, CDI/Spring, JPA, security config |
| **nestjs-boundary-reviewer** | TypeScript module boundaries, DI, dead exports |
| **failure-mode-engineer** | Failure scenarios, property tests, mutation testing |

## Review Workflow

```
1. Run git diff to understand changes
2. Check security checklist first
3. Review code quality checklist
4. Run relevant tests
5. Run mutation testing on the changed code
6. Use appropriate agent for detailed review
```

## Approval Criteria

- **Approve**: No CRITICAL or HIGH issues
- **Warning**: Only HIGH issues (merge with caution)
- **Block**: CRITICAL issues found

## Integration with Other Rules

This rule works with:

- [testing.md](testing.md) - Test evidence requirements
- [security.md](security.md) - Security checklist
- [git-workflow.md](git-workflow.md) - Commit standards

## Sources

- Code review: Michael Fagan, "Design and Code Inspections to Reduce Errors in Program Development", 1976, doi:10.1147/sj.153.0182; Google, "Engineering Practices: Code Review", https://google.github.io/eng-practices/review/
- Continuous integration: Martin Fowler, "Continuous Integration", https://martinfowler.com/articles/continuousIntegration.html
- Mutation testing: Richard DeMillo, Richard Lipton and Frederick Sayward, "Hints on Test Data Selection: Help for the Practicing Programmer", 1978, doi:10.1109/C-M.1978.218136
- SOLID: Robert C. Martin, *Agile Software Development: Principles, Patterns, and Practices*, 2002
