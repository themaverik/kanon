---
applyTo: "services/**/*.java,shared/**/*.java"
---

# Java Service Rules

## Style

- Constructor injection only — no field-level `@Autowired`
- `@Transactional` on all service methods that modify data
- Google Java Style Guide naming conventions
- Prefer immutability — use `final` fields
- Public methods before private

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

## Sources

- Dependency injection: Martin Fowler, "Inversion of Control Containers and the Dependency Injection pattern", 2004, https://martinfowler.com/articles/injection.html
- Google Java Style Guide: Google, Google Java Style Guide, https://google.github.io/styleguide/javaguide.html
- Minimize mutability: Joshua Bloch, *Effective Java*, 3rd ed., Addison-Wesley, 2018, Item 17
- Service discovery: Chris Richardson, "Pattern: Service registry", microservices.io, https://microservices.io/patterns/service-registry.html
- Database per service: Chris Richardson, "Pattern: Database per service", microservices.io, https://microservices.io/patterns/data/database-per-service.html
- Evolutionary database design: Pramod Sadalage & Martin Fowler, "Evolutionary Database Design", 2003, https://martinfowler.com/articles/evodb.html
- Flyway versioned migrations: Redgate, "Versioned migrations", Flyway documentation, https://documentation.red-gate.com/flyway/flyway-concepts/migrations/versioned-migrations
- Structured logging: OpenTelemetry, "Logs Data Model", OpenTelemetry specification, https://opentelemetry.io/docs/specs/otel/logs/data-model/
- Parameterized queries: OWASP, "SQL Injection Prevention Cheat Sheet", https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
- Least privilege: Jerome H. Saltzer & Michael D. Schroeder, "The Protection of Information in Computer Systems", Proceedings of the IEEE 63(9), 1975, doi:10.1109/PROC.1975.9939
