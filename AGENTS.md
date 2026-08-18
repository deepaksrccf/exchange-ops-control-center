# AGENTS.md

Conventions and guardrails for AI coding agents working in this repository.

## Project context

Exchange Operations Control Center is a **fictional, portfolio-only** simulation of
exchange market-operations tooling. It is not affiliated with, and does not reproduce,
any real exchange's systems.

## Hard guardrails

1. **Synthetic data only.** Never introduce licensed market data, real exchange feeds,
   vendor symbology, or any dataset with redistribution restrictions. All venues,
   symbols, prices and events must be obviously fictional.
2. **No secrets.** Never write credentials, API keys, tokens, certificates, or
   connection strings with real passwords into the repository. Configuration comes from
   environment variables, documented in `.env.example` with placeholder values.
3. **No employer or proprietary material.** Do not copy proprietary trading logic,
   internal source code, or confidential documentation into prompts or files.
4. **No wildcard CORS** in any non-development configuration. Origins are an explicit
   allow-list supplied by `APP_CORS_ALLOWED_ORIGINS`.
5. **Do not commit or push.** Stage nothing automatically. Leave the working tree for
   human review.
6. **Respect the phase boundary.** Phase 1 excludes WebSockets, AG Grid, authentication
   and deployment automation. Do not add them unless the phase roadmap is updated.

## Repository layout

```
backend/    Spring Boot service (Java 21, Maven)
frontend/   React + TypeScript SPA (Vite)
docs/       Architecture and process documentation
.github/    CI workflows
```

## Backend conventions

- Java package root: `com.deepak.exchangeops`.
- Package-by-layer under a feature-free root: `config`, `controller`, `domain`, `dto`,
  `exception`, `mapper`, `repository`, `service`.
- **Entities never cross the controller boundary.** Controllers accept and return
  records in `dto`; `mapper` classes translate.
- Schema changes go in a new Flyway migration under
  `backend/src/main/resources/db/migration` using `V<n>__snake_case.sql`. Never edit an
  applied migration. `spring.jpa.hibernate.ddl-auto` stays `validate` outside tests.
- All timestamps are `Instant` and stored as `timestamptz` in UTC.
- Validate every request body with Bean Validation annotations; validation failures must
  surface through the shared `GlobalExceptionHandler`.
- Log with SLF4J. Log identifiers and counts, never request bodies, credentials or
  personal data.
- Formatting is enforced by Spotless (`mvn spotless:apply`).

## Frontend conventions

- TypeScript `strict`. No `any` in committed code; prefer `unknown` plus narrowing.
- Server state belongs to TanStack Query. Zustand holds UI-only state (theme, sidebar).
- All network access goes through `src/api/client.ts`; no direct `axios` usage in
  components.
- Components are function components with named exports. Files are `PascalCase.tsx` for
  components, `camelCase.ts` otherwise.
- Every interactive control needs an accessible name. Tests query by role and label, not
  by CSS class or test id where a semantic query works.
- Formatting is Prettier; linting is ESLint. Both run in CI.

## Testing expectations

AI-generated code is held to the same bar as hand-written code.

- Backend: service unit tests (Mockito), repository integration tests (Testcontainers),
  controller tests (MockMvc), validation tests, error-handler tests.
- Frontend: component, routing, query-state, and loading/empty/error tests with React
  Testing Library.
- Test data is deterministic. No `Math.random()`, no `Instant.now()` assertions without a
  fixed clock.

## Definition of done for an agent-authored change

- [ ] `cd backend && mvn -B verify` passes.
- [ ] `cd frontend && npm run lint && npm run format:check && npm test && npm run build` passes.
- [ ] New behaviour has tests.
- [ ] No new secret, credential, or licensed-data reference.
- [ ] Docs updated when API, schema, or commands change.
- [ ] Change reviewed by a human before commit.
