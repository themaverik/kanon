---
applyTo: "**/*.java"
---

# Quarkus Rules

> Extends java/patterns.md. Applies when the build is Quarkus (io.quarkus in pom/gradle).

## CDI, not Spring stereotypes
- Bean-defining annotations: `@ApplicationScoped` default for stateless services. Don't mix frameworks in a Quarkus module: no Spring's `@Service/@Component/@Autowired/@Value` here (Spring repos use rules/java/spring.md).
- Constructor injection preferred; `@Inject` fields only in tests.
- Config via `@ConfigProperty` / `@ConfigMapping`, never hand-read env vars in code.

## Reactive discipline (CRITICAL)
- Never block the event loop: no JDBC, blocking REST clients, `Uni.await()`, or `Thread.sleep` on Vert.x event-loop threads.
- To do blocking work from a reactive endpoint: `@Blocking`, or `@RunOnVirtualThread` (JDK 21+), or `runSubscriptionOn(executor)`.
- Reactive endpoints use reactive persistence (Hibernate Reactive / Panache reactive), not classic JDBC.
- Verification beats review: wire BlockHound in tests where reactive paths exist; treat its output as the ruling.

## Use the platform
- Test infra via Dev Services, not hand-managed containers in test setup.
- Panache repositories/entities over boilerplate DAOs unless a documented reason exists.
- Resilience via `@Retry/@Timeout/@CircuitBreaker/@Fallback` (SmallRye Fault Tolerance), not hand-rolled retry loops.
- Health/metrics via extensions; `@QuarkusTest` + continuous testing in dev.

## Architecture tests
- Freeze recurring findings as Taikai/ArchUnit rules (e.g. `*Service` classes are `@ApplicationScoped`; `*Resource` depends only on services). A rule in the build outranks a rule in review comments.

## Native image (when enabled)
- Reflection needs `@RegisterForReflection`; no runtime classpath scanning.
