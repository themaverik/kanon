---
applyTo: "**"
---

# Common Patterns

## Skeleton Projects

When implementing new functionality:
1. Search for battle-tested skeleton projects *(Kanōn)*
2. Use parallel agents to evaluate options:
   - Security assessment
   - Extensibility analysis
   - Relevance scoring
   - Implementation planning
3. Clone best match as foundation
4. Iterate within proven structure

## Design Patterns

### Repository Pattern

Encapsulate data access behind a consistent interface:
- Define standard operations: findAll, findById, create, update, delete
- Concrete implementations handle storage details (database, API, file, etc.)
- Business logic depends on the abstract interface, not the storage mechanism
- Enables easy swapping of data sources and simplifies testing with mocks

### API Response Format

- Errors follow RFC 9457 Problem Details (`application/problem+json`):
  `type`, `title`, `status`, `detail`, `instance`, produced at the framework's
  exception-handler boundary, never ad hoc per endpoint. Do not invent a custom
  error envelope.
- Success responses are plain DTOs. No wrapper envelope. *(Kanōn)*
- Paginated responses carry one consistent metadata shape (total, page, size).

## Sources

- Repository: Martin Fowler, *Patterns of Enterprise Application Architecture*, 2002, https://martinfowler.com/eaaCatalog/repository.html
- Problem Details: IETF, RFC 9457, 2023, https://www.rfc-editor.org/rfc/rfc9457
- Data Transfer Object: Martin Fowler, *Patterns of Enterprise Application Architecture*, 2002, https://martinfowler.com/eaaCatalog/dataTransferObject.html
