---
trigger: glob
globs: **/*.java
---

# Spring Boot Rules

> Extends java/patterns.md. Applies when the build is Spring Boot (org.springframework.boot in pom/gradle). Spring Boot 3.x idioms; Spring stereotypes and `@Autowired` are correct here, Quarkus/CDI annotations are not.

## Beans and injection
- Constructor injection only; a single constructor needs no `@Autowired`. No field or setter injection, in tests either (use `@MockitoBean`/`@Autowired` on test fields only where the slice requires it).
- Stereotypes by role: `@Service` for logic, `@Repository` for persistence, `@RestController` for web, `@Configuration` for wiring. No stray `@Component` on everything.
- Config via `@ConfigurationProperties` records with `@Validated`, not scattered `@Value`. Bind once, inject the typed object.
- Never `new` a bean that needs injection; never look beans up through `ApplicationContext`.

## Transactions
- `@Transactional` on service methods, not controllers or repositories. Read paths use `readOnly = true`.
- Self-invocation trap: a call from one method to another on `this` bypasses the proxy, so the annotation is ignored. Move the target to another bean or restructure; the same applies to `@Async` and `@Cacheable`.
- `@Transactional` on private or final methods does nothing.

## Web layer
- Controllers translate HTTP to service calls and nothing else; no business logic, no entities in responses (map to DTO records).
- One `@RestControllerAdvice` renders errors as RFC 9457 `ProblemDetail` (`spring.mvc.problemdetails.enabled=true` or extend `ResponseEntityExceptionHandler`). No custom error envelope; never leak `ex.getMessage()` on a 500.
- Validate inbound DTOs with `@Valid` and Bean Validation at the edge.

## Spring Data and JPA
- `spring.jpa.open-in-view=false`; load what the use case needs inside the service transaction.
- N+1: fetch associations deliberately (`@EntityGraph`, join fetch, DTO projections). Verify by counting queries in a test, not by reading code.
- Associations default to lazy; never expose entities across the transaction boundary.
- Schema changes via Flyway/Liquibase; never `ddl-auto=update` outside throwaway local use.

## Security
- Declare a `SecurityFilterChain` bean with `HttpSecurity`; `WebSecurityConfigurerAdapter` is removed. Use `authorizeHttpRequests` and lambda DSL.
- Default deny: authenticate everything, then open specific paths. Method security (`@PreAuthorize`) on services for object-level rules.
- Never disable CSRF for browser-session apps; for stateless token APIs disable it explicitly and say why.

## Testing
- Slice tests first: `@WebMvcTest` (controller + MockMvc), `@DataJpaTest` (repositories), `@JsonTest`. `@SpringBootTest` sparingly, for wiring and a few end-to-end paths.
- Real databases and brokers via Testcontainers with `@ServiceConnection`, not H2 pretending to be Postgres.
- Use MockMvc for servlet apps and `WebTestClient` for WebFlux or full-server tests.

## Concurrency
- JDK 21+: `spring.threads.virtual.enabled=true` runs request handling and `@Async` on virtual threads. Avoid long `synchronized` blocks around blocking calls (pinning); use `ReentrantLock`.
- Don't mix WebFlux and blocking JDBC on the same path; pick one model per service.

## Architecture tests
- Freeze recurring findings as ArchUnit/Taikai rules (e.g. controllers don't depend on repositories; `@Transactional` appears only in the service package). A rule in the build outranks a rule in review comments.
