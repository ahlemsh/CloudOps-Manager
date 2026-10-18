# Non-Functional Requirements

---

## Security

- **JWT access tokens** expire after 15 minutes and are signed with `JWT_SECRET`.
- **Refresh tokens** expire after 7 days, are signed with `JWT_REFRESH_SECRET`, and are delivered in an `httpOnly`, `Secure`, `SameSite=Strict` cookie to prevent XSS access.
- **Password hashing** uses bcrypt with a minimum of 12 salt rounds. Plaintext passwords are never stored or logged.
- **RBAC** is enforced server-side on every protected endpoint using NestJS Guards. Client-side checks are supplemental only.
- **Input validation** is applied on all endpoints via a global `ValidationPipe` configured with `whitelist: true` and `forbidNonWhitelisted: true`.
- **CORS** is configured to whitelist only the frontend origin (`NEXT_PUBLIC_API_URL`). All other origins are rejected.
- **No secrets in repository** — all sensitive values are managed through environment variables; only `.env.example` with placeholder values is committed.

---

## Performance

- API p95 response time must be under **300ms** under normal operating load (single VPS deployment, up to 20 concurrent users).
- Dashboard auto-refresh interval must not exceed **30 seconds** to keep metric data reasonably current without overloading the backend.
- Metric history queries must be **paginated** with a maximum page size of 100 records to prevent unbounded result sets.
- Database queries on list endpoints must use indexed fields for filtering and sorting.

---

## Usability

- The UI must be **responsive** and usable on mobile, tablet, and desktop. Minimum supported breakpoints: 640px (sm), 768px (md), 1024px (lg).
- All asynchronous operations must display a **loading state** (spinner or skeleton loader) while the request is in flight.
- Form validation failures must be communicated with **inline error messages** adjacent to the relevant field.
- All list views must render an **empty state** component (with a call to action) when no records exist.
- The application must remain functional with **JavaScript disabled** for static/server-rendered pages (Next.js SSR/SSG where applicable).

---

## Maintainability

- All code must be written in **TypeScript strict mode** (`"strict": true` in `tsconfig.json`). No `any` types in production code without explicit justification in a comment.
- **ESLint** with `@typescript-eslint` rules and **Prettier** are enforced in both apps. CI blocks merges with lint errors.
- **Test coverage** for backend services must meet or exceed **70%** (lines). Coverage reports are generated on every CI run.
- The backend must follow a **modular NestJS architecture** — one module per domain (auth, users, projects, servers, applications, metrics, alerts, dashboard). Cross-module dependencies are injected, not hard-coded.
- The frontend must not contain **business logic** — all data transformation happens in the API layer or dedicated utility functions.

---

## Observability

- The backend must emit **structured JSON logs** using NestJS's built-in logger. Log lines include: timestamp, log level, context (module name), and message.
- A **`/health`** endpoint must return the service status and database connectivity status. Used by Docker health checks.
- A **request/response logging middleware** logs every inbound request (method, path, status code, duration) at INFO level.

---

## Deployability

- A single `docker compose up` command must start all required services (database, backend, frontend, reverse proxy).
- All runtime configuration is injected via **environment variables**. No hardcoded values in application code.
- **Database migrations** run automatically at backend startup using `prisma migrate deploy` — no manual migration steps required.
- The system must be deployable on any Linux VPS with Docker and Docker Compose installed, without cloud-provider-specific tooling.
