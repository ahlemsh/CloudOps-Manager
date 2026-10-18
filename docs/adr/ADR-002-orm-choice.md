# ADR-002: ORM Choice

**Date:** 2024-10-18
**Status:** Accepted

---

## Context

The NestJS backend needs an ORM or query builder for all interactions with PostgreSQL. The two leading TypeScript-native options for NestJS projects are **Prisma** and **TypeORM**. A decision is needed before Phase 2 (data modeling and migrations).

---

## Decision

Use **Prisma** as the ORM for CloudOps Manager.

The Prisma schema lives at `apps/backend/prisma/schema.prisma`. Development migrations run with `prisma migrate dev`. Production deployments apply migrations with `prisma migrate deploy` during container startup.

---

## Rationale

**Type safety**
Prisma generates a fully typed client from `schema.prisma`. Every query, including relations, aggregations, and nested writes, is typed end-to-end with no runtime surprises. TypeORM relies on decorators and runtime reflection, which creates a gap between what TypeScript infers and what actually executes at the database layer.

**Migration reliability**
`prisma migrate dev` produces a clear, deterministic diff between schema versions and generates SQL migration files that can be reviewed in PRs. TypeORM's migration story — particularly with complex relations and the `synchronize: true` footgun — has well-documented reliability issues in production environments.

**Schema as source of truth**
`schema.prisma` is the single authoritative data model. There is no duplication between entity class definitions and migration files. Changes to the schema are always reflected in the generated client immediately.

**Developer experience**
The Prisma client provides IDE autocomplete on every field, relation, and filter option, including deeply nested `include` and `select` clauses. This substantially reduces errors and the need for runtime debugging during development.

**NestJS integration**
The `PrismaService` pattern (extending `PrismaClient`, implementing `OnModuleInit` and `OnModuleDestroy`) is well-established in the NestJS ecosystem with comprehensive documentation and community support.

---

## Consequences

- `schema.prisma` is the canonical data model source. All entity changes start here.
- The generated `@prisma/client` package must not be committed; it is regenerated at build time.
- `prisma migrate dev` is used during local development; `prisma migrate deploy` is used in CI/CD and container startup.
- Prisma does not support every PostgreSQL-specific feature directly (e.g., custom types, NOTIFY/LISTEN). Raw queries via `prisma.$queryRaw` are available as an escape hatch.
- Migrating away from Prisma in the future would require rewriting all data access code — a deliberate, non-trivial effort.

---

## Alternatives Considered

**TypeORM (rejected)**
- Decorator-based entity definitions create a disconnect between TypeScript types and actual DB schema that TypeScript cannot catch.
- Migration generation with complex polymorphic relations has known reliability issues.
- Type inference on joined queries is weaker; result types often need manual casting.
- The `synchronize: true` option is a production footgun with no equivalent safe default.

**Drizzle ORM (deferred)**
- A promising lightweight alternative with strong type safety.
- The ecosystem and community support are less mature than Prisma's for NestJS specifically.
- Deferred for consideration in a future architecture review.

**Raw SQL with `pg` / `node-postgres` (rejected)**
- Eliminates type safety and schema management tooling entirely.
- Appropriate for performance-critical hotpaths but not suitable as the primary data access strategy.
