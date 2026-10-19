---
applyTo: "**"
---

# Security Guidelines

## Mandatory Security Checks

Before ANY commit:
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized HTML)
- [ ] CSRF protection enabled
- [ ] Authentication/authorization verified
- [ ] Rate limiting on all endpoints
- [ ] Error messages don't leak sensitive data

## Secret Management

- NEVER hardcode secrets in source code
- ALWAYS use environment variables or a secret manager
- Validate that required secrets are present at startup
- Rotate any secrets that may have been exposed

## Node/npm Dependency Security (ALL Node/npm projects)

ALWAYS run these checks BEFORE `npm install` / `npm ci` / `npm update`
(or yarn/pnpm equivalents) — never install blind:

- [ ] Check the package manager version itself (`npm --version`, `node --version`)
      against known compromised releases and CVEs.
- [ ] Screen the lockfile for versions tied to known supply-chain attacks
      (e.g. the Sept 2025 "Qix" chalk/debug/ansi-styles compromise, the
      "Shai-Hulud" self-replicating worm). Verify no installed version matches
      a known-malicious release.
- [ ] Run `npm audit` and review high/critical advisories.
- [ ] Run `npm audit signatures` to verify registry signatures/provenance —
      flags tampered or unsigned packages.
- [ ] Distinguish supply-chain malware (block, investigate) from ordinary
      CVEs in legitimate packages (assess real exploitability for the project).

If any compromised/malicious version is found: STOP, do not install, follow
the Security Response Protocol below.

## Security Response Protocol

If security issue found:
1. STOP immediately
2. Use **security-reviewer** agent
3. Fix CRITICAL issues before continuing
4. Rotate any exposed secrets
5. Review entire codebase for similar issues
