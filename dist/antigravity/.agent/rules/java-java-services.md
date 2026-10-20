---
trigger: glob
globs: services/**/*.java,shared/**/*.java
---

# Java Service Rules

## Style

- Constructor injection only — no field-level `@Autowired`
- `@Transactional` on all service methods that modify data
- Google Java Style Guide naming conventions
- Prefer immutability — use `final` fields
- Files under 300 lines; public methods before private

## Service Boundaries

- Check the shared module for an existing base class or helper before writing a new one
- Never hardcode service URLs — use `@Value` or service discovery
- Schema-per-service — never query another service's schema directly
- All schema changes via Flyway: `V<version>__<description>.sql`

## Error Handling

- Never fail silently
- Use specific exception types with context in messages
- Log at appropriate level: debug / info / warn / error (structured JSON)

## Security

- Never commit secrets — use environment variables
- Validate and sanitize all user input
- Use parameterized queries — no string concatenation in SQL
- Least privilege on all permissions
