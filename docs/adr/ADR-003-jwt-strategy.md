# ADR-003: JWT Authentication Strategy

**Date:** 2024-10-18
**Status:** Accepted

---

## Context

CloudOps Manager uses a stateless REST API with role-based access control. An authentication token strategy must balance security (short exposure window on compromise), usability (avoid constant re-login), and protection against common web vulnerabilities (XSS, CSRF).

---

## Decision

Implement a **dual-token strategy**:

1. **Access token** — short-lived JWT (15 minutes), signed with `JWT_SECRET`. Sent in the `Authorization: Bearer <token>` header on every protected API request.
2. **Refresh token** — long-lived JWT (7 days), signed with `JWT_REFRESH_SECRET` (a separate secret). Stored in an `httpOnly`, `Secure`, `SameSite=Strict` cookie. Used only on `POST /auth/refresh`.

**Token rotation:** Every successful refresh call issues a new refresh token and invalidates the previous one. This limits the window of opportunity if a refresh token is intercepted.

---

## Rationale

**Short access token TTL (15 minutes)**
If an access token is stolen (e.g., via a compromised third-party script), the attacker's window is bounded. They cannot refresh it without the `httpOnly` cookie, which JavaScript cannot read.

**httpOnly cookie for refresh token**
Storing the refresh token in an `httpOnly` cookie makes it inaccessible to JavaScript. This eliminates the most common XSS vector for credential theft. The `SameSite=Strict` attribute prevents CSRF because the cookie is not sent on cross-site requests.

**Separate signing secrets**
Using different secrets for access and refresh tokens means that a compromise of one secret does not immediately enable issuance of the other token type.

**Stateless API with optional blacklist**
Access tokens are validated entirely by signature and expiry — no database lookup required. Refresh tokens can optionally be stored in the database (as a hash) to support immediate invalidation on logout or detected compromise, without making every request hit the database.

---

## Consequences

- The NestJS backend must configure two Passport strategies: `JwtStrategy` (access token) and `JwtRefreshStrategy` (refresh token).
- CORS configuration must include `credentials: true` to allow the browser to send the refresh cookie cross-origin.
- The frontend must implement a token refresh interceptor: when a 401 response is received, attempt one `POST /auth/refresh` call, then retry the original request.
- Access tokens are stored in memory only (not in `localStorage`) to prevent XSS theft. This means they are cleared on page reload — the refresh token cookie handles re-authentication transparently.

---

## Alternatives Considered

**Single long-lived JWT (rejected)**
- A 1-hour or 24-hour JWT is convenient but unrevocable without a blacklist database. If stolen, the attacker has the full TTL window. No security improvement over a session token with added implementation complexity.

**Server-side sessions (rejected)**
- Sessions require a shared session store (Redis or DB-backed) across all API instances. This contradicts the stateless API design, adds infrastructure complexity, and complicates horizontal scaling in future phases.

**OAuth2 / third-party identity provider (deferred)**
- Appropriate if the platform later needs SSO or external identity integration.
- At the current scale (internal tool, small team), implementing a full OAuth2 server adds unnecessary complexity. Deferred to a future phase.
