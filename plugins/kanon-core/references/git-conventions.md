# Git Conventions

Reference file for branch naming and commit message conventions.
Read this file when creating branches or composing commit messages.

## Branch Naming Conventions

Follow these patterns for branch names:

- **Feature branches**: `feature/<short-description>`
  - Example: `feature/user-authentication`
- **Bug fixes**: `fix/<issue-description>`
  - Example: `fix/login-timeout`
- **Hotfixes**: `hotfix/<critical-issue>`
  - Example: `hotfix/security-patch`
- **Refactoring**: `refactor/<scope>`
  - Example: `refactor/database-layer`
- **Documentation**: `docs/<topic>`
  - Example: `docs/api-endpoints`
- **Experimental/Research**: `experiment/<feature-name>`
  - Example: `experiment/new-algorithm`

**Rules**:
- The default main branch name will be `main` unless specified
- Use lowercase letters and hyphens (kebab-case)
- Keep names concise but descriptive
- Avoid special characters except hyphens and forward slashes

## Commit Message Style

Follow **Conventional Commits** specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring without changing functionality
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Changes to build system, tooling, or developer environment config
- `ci`: Changes to CI/CD configuration
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverting a previous commit

**Examples**:
```
feat(auth): add OAuth2 login support

fix(api): resolve timeout issue in user endpoint

docs(readme): update installation instructions

build(claude): add knowledge-query and adr-manager skills

build(claude): move Playwright MCP to project-level settings
```

**Rules**:
- Use lowercase for type and scope
- Subject line max 50 characters
- Use imperative mood ("add" not "added" or "adds")
- Don't end subject with a period
- Body and footer are optional -- use when context adds value
- Body should explain what and why, not how
- Reference issue numbers in footer when applicable
- For multiple commits, keep point-wise short descriptions for clarity
- Do not include AI tool attribution in commit messages

## Ignoring Files

When initialising a new project, always ask whether to use `.gitignore` or `.git/info/exclude` before creating either:

```
How should ignored files be managed for this project?

(1) .gitignore -- committed to the repo, visible to everyone
    Use for: open source projects, shared teams, standard exclusions
             (node_modules, build/, .env.example pattern)

(2) .git/info/exclude -- local only, never committed or pushed
    Use for: proprietary/private repos, personal tooling exclusions,
             hiding internal tool configs (LLM.md, .claude/, etc.)

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
# LLM tooling
LLM.md
CLAUDE.md
.claude/

# IDE personal config
.idea/
.vscode/

# Personal scripts
scripts/personal/
```

**Note**: `.git/info/exclude` uses the same syntax as `.gitignore` but only applies to your local working copy. It is never committed, pushed, or visible to other contributors.

## Task Status Markers

Work-item status lives in the ticket system, not in repo files.

| Marker | Status | Rule |
|--------|--------|------|
| `[ ]` | Pending | Not yet started |
| `[~]` | In Progress | Started but incomplete -- always note what remains |
| `[x]` | Completed | Done and committed -- always note the commit hash |
| `[!]` | Blocked | Cannot proceed -- always note the reason and what resolves it |

Example:
```markdown
- [x] Delete com.example.* package in Finance *(commit: abc1234)*
- [~] Delete com.example.* package in Procurement *(VendorController done, ProcurementController pending)*
- [ ] Fix RestServiceDelegate blocking issue
- [!] Remove HR embedded Flowable *(blocked: depends on RestServiceDelegate fix)*
```

## ADR Commits

Architecture Decision Records always commit with the code they relate to:

```
feat(auth): add Keycloak OAuth2 integration

Implements JWT-based auth via Keycloak. Decision to use Keycloak over
custom auth documented in docs/adr/ADR-003-keycloak-auth.md.
```

Retroactive ADR commits use:
```
docs(adr): add ADR-003 keycloak auth decision (retroactive)
```
