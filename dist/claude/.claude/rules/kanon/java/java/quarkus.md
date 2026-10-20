---
paths:
  - "**/*.java"
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
- Verification beats review: wire BlockHound in tests where reactive paths exist; treat its output as the ruling. *(Kanōn)*

## Use the platform
- Test infra via Dev Services, not hand-managed containers in test setup.
- Panache repositories/entities over boilerplate DAOs unless a documented reason exists.
- Resilience via `@Retry/@Timeout/@CircuitBreaker/@Fallback` (SmallRye Fault Tolerance), not hand-rolled retry loops.
- Health/metrics via extensions; `@QuarkusTest` + continuous testing in dev.

## Architecture tests
- Freeze recurring findings as Taikai/ArchUnit rules (e.g. `*Service` classes are `@ApplicationScoped`; `*Resource` depends only on services). A rule in the build outranks a rule in review comments. *(Kanōn)*

## Native image (when enabled)
- Reflection needs `@RegisterForReflection`; no runtime classpath scanning.

## Sources

- Contexts and Dependency Injection: Eclipse Foundation, Jakarta Contexts and Dependency Injection, https://jakarta.ee/specifications/cdi/
- Dependency injection: Martin Fowler, "Inversion of Control Containers and the Dependency Injection pattern", 2004, https://martinfowler.com/articles/injection.html
- Externalized configuration: Adam Wiggins, *The Twelve-Factor App*, "III. Config", 2011, https://12factor.net/config
- Never block the event loop: Eclipse Vert.x, "Golden Rule - Don't Block the Event Loop", Vert.x Core documentation, https://vertx.io/docs/vertx-core/java/#golden_rule
- Virtual threads: OpenJDK, JEP 444, 2023, https://openjdk.org/jeps/444
- Blocking-call detection: Project Reactor, BlockHound, https://github.com/reactor/BlockHound
- Dev Services: Quarkus, "Dev Services Overview", https://quarkus.io/guides/dev-services
- MicroProfile Fault Tolerance: Eclipse MicroProfile, MicroProfile Fault Tolerance, https://microprofile.io/specifications/fault-tolerance/
- Circuit breaker: Michael T. Nygard, *Release It!*, Pragmatic Bookshelf, 2007
- Continuous testing: Quarkus, "Continuous Testing", https://quarkus.io/guides/continuous-testing
- Architecture tests as fitness functions: Neal Ford, Rebecca Parsons & Patrick Kua, *Building Evolutionary Architectures*, O'Reilly, 2017
