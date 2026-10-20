# Git Conventions

Reference file for branch naming and commit message conventions.
Read this file when creating branches or composing commit messages.

## Branch Naming Conventions

Branches carry the ticket key: `<type>/<TICKET>-<short-slug>`. *(Kanōn)*

- Types: `feat`, `fix`, `chore`, `refactor`, `docs`
- Examples: `feat/PAY-482-idempotency-guard`, `fix/AUTH-91-login-timeout`

**Rules**:
- The default main branch name will be `main` unless specified
- Use lowercase letters and hyphens (kebab-case) after the ticket key
- Keep names concise but descriptive
- Avoid special characters except hyphens and forward slashes

## Commit Message Style

The `commit-craft` skill is the authority. In short:

```
PROJ-123: <imperative one-liner, <=72 chars>

<One or two sentences, or 2-5 one-line points for a large change.>
```

**Rules**:
- Every commit carries the ticket key; the `ticket-guard` hook enforces it *(Kanōn)*
- Use imperative mood ("add" not "added" or "adds")
- Don't end the subject with a period
- Body explains what and why, not how
- Do not include AI tool attribution in commit messages *(Kanōn)*

## Ignoring Files

When initialising a new project, always ask whether to use `.gitignore` or `.git/info/exclude` before creating either: *(Kanōn)*

```
How should ignored files be managed for this project?

(1) .gitignore -- committed to the repo, visible to everyone
    Use for: open source projects, shared teams, standard exclusions
             (node_modules, build/, .env.example pattern)

(2) .git/info/exclude -- local only, never committed or pushed
    Use for: proprietary/private repos, personal tooling exclusions,
             personal tool configs (LLM.md, .claude/settings.local.json)

(3) Both -- .gitignore for standard exclusions, .git/info/exclude
    for private/personal exclusions that should not be visible
```

**When to use each**:

| Scenario | Recommendation |
|----------|---------------|
| Open source project | `.gitignore` — transparency expected |
| Private/proprietary repo | `.git/info/exclude` — hides internal tooling from repo history |
| Team project | `.gitignore` for shared rules + `.git/info/exclude` for personal exclusions |
| Personal solo project | Either — prefer `.git/info/exclude` if repo may go public later |
| CI/CD pipelines | `.gitignore` — exclude files must be visible to build systems |

**What goes where (when using both)**:

`.gitignore` — shared, committed:
```gitignore
# Dependencies & build
node_modules/
dist/
build/
target/

# Environment
.env*
!.env.example
*.log

# OS
.DS_Store
Thumbs.db
```

`.git/info/exclude` — local only, never pushed:
```
# Personal LLM tooling (CLAUDE.md and .claude/settings.json stay committed)
LLM.md
.claude/settings.local.json

# IDE personal config
.idea/
.vscode/

# Personal scripts
scripts/personal/
```

**Note**: `.git/info/exclude` uses the same syntax as `.gitignore` but only applies to your local working copy. It is never committed, pushed, or visible to other contributors.

## Task Status Markers

Work-item status lives in the ticket system, not in repo files. *(Kanōn)*

| Marker | Status | Rule |
|--------|--------|------|
| `[ ]` | Pending | Not yet started |
| `[~]` | In Progress | Started but incomplete -- always note what remains |
| `[x]` | Completed | Done and committed -- always note the commit hash |
| `[!]` | Blocked | Cannot proceed -- always note the reason and what resolves it |

Example:
```markdown
- [x] Extract the idempotency guard *(commit: abc1234)*
- [~] Move webhook handlers onto the guard *(payments done, refunds pending)*
- [ ] Drop the payload-hash dedupe table
- [!] Remove the legacy retry worker *(blocked: depends on the queue migration)*
```

## ADR Commits

Architecture Decision Records always commit with the code they relate to: *(Kanōn)*

```
AUTH-12: add Keycloak OAuth2 integration

JWT auth via Keycloak instead of custom auth, per docs/adr/ADR-003-keycloak-auth.md.
```

Retroactive ADR commits use:
```
AUTH-12: add ADR-003 keycloak auth decision (retroactive)
```

## Sources

- Commit message form: Tim Pope, "A Note About Git Commit Messages", 2008, https://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html; Git, "Submitting Patches", https://git-scm.com/docs/SubmittingPatches
- gitignore and `.git/info/exclude`: Git, "gitignore", https://git-scm.com/docs/gitignore
- Architecture Decision Records: Michael Nygard, "Documenting Architecture Decisions", 2011, https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
