---
trigger: glob
globs: **/*.java
---

# Java Security

> This file extends [common/security.md](../common/security.md) with Java-specific content.

## Secrets Management

- Never hardcode API keys, tokens, or credentials in source code
- Use environment variables: `System.getenv("API_KEY")`
- Use a secret manager (Vault, AWS Secrets Manager) for production secrets
- Keep local config files with secrets in `.gitignore`

```java
// BAD
private static final String API_KEY = "sk-abc123...";

// GOOD — environment variable
String apiKey = System.getenv("PAYMENT_API_KEY");
Objects.requireNonNull(apiKey, "PAYMENT_API_KEY must be set");
```

## SQL Injection Prevention

- Always use parameterized queries. Never concatenate user input into SQL
- Use `PreparedStatement` or your framework's parameterized query API
- Validate and sanitize any input used in native queries

```java
// BAD — SQL injection via string concatenation
Statement stmt = conn.createStatement();
String sql = "SELECT * FROM orders WHERE name = '" + name + "'";
stmt.executeQuery(sql);

// GOOD — PreparedStatement with parameterized query
PreparedStatement ps = conn.prepareStatement("SELECT * FROM orders WHERE name = ?");
ps.setString(1, name);

// GOOD — JDBC template
jdbcTemplate.query("SELECT * FROM orders WHERE name = ?", mapper, name);
```

## Input Validation

- Validate all user input at system boundaries before processing
- Use Bean Validation (`@NotNull`, `@NotBlank`, `@Size`) on DTOs when using a validation framework
- Sanitize file paths and user-provided strings before use
- Reject input that fails validation with clear error messages

```java
// Validate manually in plain Java
public Order createOrder(String customerName, BigDecimal amount) {
    if (customerName == null || customerName.isBlank()) {
        throw new IllegalArgumentException("Customer name is required");
    }
    if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
        throw new IllegalArgumentException("Amount must be positive");
    }
    return new Order(customerName, amount);
}
```

## Authentication and Authorization

- Never implement custom auth crypto. Use established libraries
- Store passwords with bcrypt or Argon2, never MD5/SHA1
- Enforce authorization checks at service boundaries
- Clear sensitive data from logs. Never log passwords, tokens, or PII

## Dependency Security

- Run `mvn dependency:tree` or `./gradlew dependencies` to audit transitive dependencies
- Use OWASP Dependency-Check or Snyk to scan for known CVEs
- Keep dependencies updated: set up Dependabot or Renovate

## Error Messages

- Never expose stack traces, internal paths, or SQL errors in API responses
- Map exceptions to safe, generic client messages at handler boundaries
- Log detailed errors server-side; return generic messages to clients

```java
// Log the detail; let the exception mapper emit a generic RFC 9457 problem
try {
    return orderService.findById(id);
} catch (OrderNotFoundException ex) {
    log.warn("Order not found: id={}", id);
    throw ex;  // mapper renders 404 application/problem+json, no internals
} catch (Exception ex) {
    log.error("Unexpected error processing order id={}", id, ex);
    throw new InternalServerErrorException();  // generic 500 problem, never ex.getMessage()
}
```

## References

See `rules/java/spring.md` (Security) for Spring Security `SecurityFilterChain` patterns.
See `rules/common/security.md` for the general security checklist.

## Sources

- Secrets management: OWASP, "Secrets Management Cheat Sheet", https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- Externalized configuration: Adam Wiggins, *The Twelve-Factor App*, "III. Config", 2011, https://12factor.net/config
- SQL injection prevention: OWASP, "SQL Injection Prevention Cheat Sheet", https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
- Input validation: OWASP, "Input Validation Cheat Sheet", https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
- Bean Validation: Eclipse Foundation, Jakarta Bean Validation, https://jakarta.ee/specifications/bean-validation/
- Password hashing: OWASP, "Password Storage Cheat Sheet", https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- Authorization checks: OWASP, "API1:2023 Broken Object Level Authorization", OWASP API Security Top 10, 2023, https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/
- No secrets or PII in logs: OWASP, "Logging Cheat Sheet", https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- Dependency scanning: OWASP, Dependency-Check, https://owasp.org/www-project-dependency-check/
- Error messages: MITRE, "CWE-209: Generation of Error Message Containing Sensitive Information", https://cwe.mitre.org/data/definitions/209.html
- Problem Details: IETF, RFC 9457, 2023, https://www.rfc-editor.org/rfc/rfc9457
