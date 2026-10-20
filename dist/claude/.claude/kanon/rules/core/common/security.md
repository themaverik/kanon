# Security Guidelines

## Mandatory Security Checks

Before every commit:
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized HTML)
- [ ] CSRF protection enabled
- [ ] Authentication/authorization verified
- [ ] Rate limiting on all endpoints
- [ ] Error messages don't leak sensitive data

## Secret Management

- Keep secrets out of source code
- Read them from environment variables or a secret manager
- Validate that required secrets are present at startup
- Rotate any secrets that may have been exposed

## Node/npm Dependency Security (all Node/npm projects)

Run these checks before `npm install` / `npm ci` / `npm update`
(or yarn/pnpm equivalents), never install blind:

- [ ] Check the package manager version itself (`npm --version`, `node --version`)
      against known compromised releases and CVEs.
- [ ] Screen the lockfile for versions tied to known supply-chain attacks
      (e.g. the Sept 2025 "Qix" chalk/debug/ansi-styles compromise, the
      "Shai-Hulud" self-replicating worm). Verify no installed version matches
      a known-malicious release.
- [ ] Run `npm audit` and review high/critical advisories.
- [ ] Run `npm audit signatures` to verify registry signatures/provenance:
      flags tampered or unsigned packages.
- [ ] Distinguish supply-chain malware (block, investigate) from ordinary
      CVEs in legitimate packages (assess real exploitability for the project).

If any compromised/malicious version is found: STOP, do not install, follow
the Security Response Protocol below.

## Security Response Protocol

If security issue found:
1. STOP immediately
2. Get a read-only review from `architect-review` plus the stack reviewer *(Kanōn)*
3. Fix CRITICAL issues before continuing
4. Rotate any exposed secrets
5. Review entire codebase for similar issues

## Sources

- Secret management: OWASP, "Secrets Management Cheat Sheet", https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- Environment-based configuration: Adam Wiggins, *The Twelve-Factor App*, 2011, "III. Config", https://12factor.net/config
- Registry signatures and provenance: npm, "Verifying registry signatures", https://docs.npmjs.com/verifying-registry-signatures
- Shai-Hulud worm: CISA, "Widespread Supply Chain Compromise Impacting npm Ecosystem", 2025, https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem
- Security response: NIST, SP 800-61 Rev. 3, "Incident Response Recommendations and Considerations for Cybersecurity Risk Management", 2025, https://csrc.nist.gov/pubs/sp/800/61/r3/final
