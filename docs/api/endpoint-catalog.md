# REST API Endpoint Catalog

Full Swagger/OpenAPI documentation will be available at `/api/docs` once the backend is running (Phase 2+).

---

## API Conventions

**Base URL:** `/api/v1`

**Authentication:** All protected routes require `Authorization: Bearer <access_token>` in the request header.

**Standard error response format:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/servers"
}
```

**Paginated response envelope:**
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

**Common query parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Records per page (default: 20, max: 100) |
| `search` | string | Full-text search across name/description fields |
| `sortBy` | string | Field to sort by (e.g., `createdAt`) |
| `sortOrder` | `asc` \| `desc` | Sort direction (default: `desc`) |

---

## Authentication (5 endpoints)

| Method | Path | Description | Auth Required | Role |
|--------|------|-------------|---------------|------|
| `POST` | `/auth/login` | Authenticate with email + password; returns access token and sets refresh cookie | No | — |
| `POST` | `/auth/register` | Create a new user account | Yes | Admin |
| `POST` | `/auth/refresh` | Exchange refresh token cookie for a new access token (rotates refresh token) | No (cookie) | — |
| `POST` | `/auth/logout` | Invalidate the current refresh token and clear cookie | Yes | Any |
| `GET` | `/auth/me` | Get the authenticated user's profile | Yes | Any |

### POST /auth/login
**Request body:**
```json
{ "email": "user@example.com", "password": "securepassword" }
```
**Response 200:**
```json
{
  "accessToken": "eyJ...",
  "user": { "id": "uuid", "email": "user@example.com", "firstName": "Jane", "role": "DEVOPS" }
}
```
**Cookie set:** `refreshToken` (httpOnly, Secure, SameSite=Strict, 7d expiry)

---

## Users (4 endpoints)

| Method | Path | Description | Role | Query Params |
|--------|------|-------------|------|--------------|
| `GET` | `/users` | List all users with pagination | Admin | `page`, `limit`, `search`, `role` |
| `GET` | `/users/:id` | Get a specific user by ID | Admin | — |
| `PATCH` | `/users/:id` | Update a user (role, isActive, name) | Admin | — |
| `DELETE` | `/users/:id` | Deactivate (soft delete) a user account | Admin | — |

---

## Projects (6 endpoints)

| Method | Path | Description | Role | Query Params |
|--------|------|-------------|------|--------------|
| `GET` | `/projects` | List projects with pagination and filters | Any authenticated | `page`, `limit`, `search`, `status` |
| `POST` | `/projects` | Create a new project | Admin, DevOps | — |
| `GET` | `/projects/:id` | Get project detail with environments and member count | Any authenticated | — |
| `PATCH` | `/projects/:id` | Update project name, description, or status | Admin, DevOps | — |
| `DELETE` | `/projects/:id` | Delete a project (and cascade environments) | Admin | — |
| `POST` | `/projects/:id/members` | Add a user to a project as a member | Admin, DevOps | — |

### POST /projects/:id/members
**Request body:**
```json
{ "userId": "uuid" }
```
**Response 201:**
```json
{ "id": "uuid", "projectId": "uuid", "userId": "uuid", "assignedAt": "2024-01-01T00:00:00Z" }
```

---

## Servers (6 endpoints)

| Method | Path | Description | Role | Query Params |
|--------|------|-------------|------|--------------|
| `GET` | `/servers` | List servers with pagination and filters | Any authenticated | `page`, `limit`, `search`, `status`, `provider`, `region`, `environmentId` |
| `POST` | `/servers` | Register a new server | Admin, DevOps | — |
| `GET` | `/servers/:id` | Get server detail with latest metric snapshot | Any authenticated | — |
| `PATCH` | `/servers/:id` | Update server properties or status | Admin, DevOps | — |
| `DELETE` | `/servers/:id` | Remove a server record | Admin, DevOps | — |
| `GET` | `/servers/:id/status` | Get current server status and uptime summary | Any authenticated | — |

### POST /servers
**Request body:**
```json
{
  "name": "prod-web-01",
  "provider": "Hetzner",
  "region": "eu-central",
  "ipAddress": "95.216.1.100",
  "cpuCores": 4,
  "ramGb": 8,
  "storageGb": 80,
  "environmentId": "uuid"
}
```
**Response 201:** Full server object with `status: "PROVISIONING"`.

---

## Applications (5 endpoints)

| Method | Path | Description | Role | Query Params |
|--------|------|-------------|------|--------------|
| `GET` | `/applications` | List applications with filters | Any authenticated | `page`, `limit`, `status`, `serverId`, `environmentId` |
| `POST` | `/applications` | Create a new application record | Admin, DevOps | — |
| `GET` | `/applications/:id` | Get application detail | Any authenticated | — |
| `PATCH` | `/applications/:id` | Update application version, status, or server | Admin, DevOps | — |
| `DELETE` | `/applications/:id` | Remove an application record | Admin, DevOps | — |

---

## Metrics (3 endpoints)

| Method | Path | Description | Role | Query Params |
|--------|------|-------------|------|--------------|
| `GET` | `/servers/:id/metrics` | Get paginated metric history for a server | Any authenticated | `page`, `limit`, `from` (ISO timestamp), `to` (ISO timestamp) |
| `GET` | `/servers/:id/metrics/latest` | Get the most recent metric snapshot for a server | Any authenticated | — |
| `GET` | `/servers/:id/metrics/availability` | Get availability percentage calculated from metric history | Any authenticated | `from`, `to` |

### GET /servers/:id/metrics
**Example query:** `GET /servers/uuid/metrics?from=2024-01-01T00:00:00Z&to=2024-01-02T00:00:00Z&page=1&limit=50`

**Response 200 (paginated):**
```json
{
  "data": [
    {
      "id": "uuid",
      "serverId": "uuid",
      "cpuPercent": 45.2,
      "ramPercent": 62.1,
      "diskPercent": 30.0,
      "networkInKbps": 1024.5,
      "networkOutKbps": 512.3,
      "recordedAt": "2024-01-01T12:00:00Z"
    }
  ],
  "meta": { "total": 2880, "page": 1, "limit": 50, "totalPages": 58 }
}
```

---

## Alert Rules (3 endpoints)

| Method | Path | Description | Role | Query Params |
|--------|------|-------------|------|--------------|
| `GET` | `/alert-rules` | List all alert rules | Any authenticated | `page`, `limit`, `serverId`, `isActive` |
| `POST` | `/alert-rules` | Create a new alert rule | Admin, DevOps | — |
| `DELETE` | `/alert-rules/:id` | Delete an alert rule (also deactivates it) | Admin | — |

### POST /alert-rules
**Request body:**
```json
{
  "name": "High CPU Warning",
  "serverId": "uuid",
  "metricType": "CPU",
  "operator": "GT",
  "threshold": 85.0,
  "severity": "WARNING"
}
```
**Response 201:** Full alert rule object with `isActive: true`.

---

## Alerts (4 endpoints)

| Method | Path | Description | Role | Query Params |
|--------|------|-------------|------|--------------|
| `GET` | `/alerts` | List active and historical alerts with filters | Any authenticated | `page`, `limit`, `status`, `severity`, `serverId`, `from`, `to` |
| `GET` | `/alerts/:id` | Get alert detail including rule and server info | Any authenticated | — |
| `PATCH` | `/alerts/:id/acknowledge` | Acknowledge an alert (status → ACKNOWLEDGED) | Admin, DevOps | — |
| `GET` | `/alerts/history` | Get closed/resolved alert history | Any authenticated | `page`, `limit`, `severity`, `serverId`, `from`, `to` |

### PATCH /alerts/:id/acknowledge
**Request body:** (empty — user is extracted from JWT)
**Response 200:**
```json
{
  "id": "uuid",
  "status": "ACKNOWLEDGED",
  "acknowledgedBy": "uuid",
  "acknowledgedAt": "2024-01-01T12:05:00Z"
}
```

---

## Dashboard (2 endpoints)

| Method | Path | Description | Role | Query Params |
|--------|------|-------------|------|--------------|
| `GET` | `/dashboard/summary` | Global counters: servers by status, active alerts, app status summary | Any authenticated | `projectId`, `environmentId` |
| `GET` | `/dashboard/metrics` | Latest metric snapshots for all active servers (for chart rendering) | Any authenticated | `projectId`, `environmentId` |

### GET /dashboard/summary
**Response 200:**
```json
{
  "servers": {
    "total": 12,
    "running": 9,
    "stopped": 2,
    "maintenance": 1
  },
  "alerts": {
    "active": 3,
    "critical": 1,
    "warning": 2,
    "info": 0
  },
  "applications": {
    "running": 18,
    "failed": 1,
    "deploying": 2
  },
  "generatedAt": "2024-01-01T12:00:00Z"
}
```

---

## Health Check (1 endpoint)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| `GET` | `/health` | Returns service health and database connectivity status | No |

**Response 200:**
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" }
  },
  "error": {},
  "details": {
    "database": { "status": "up" }
  }
}
```

---

## Total: 29 documented endpoints

| Module | Count |
|--------|-------|
| Authentication | 5 |
| Users | 4 |
| Projects | 6 |
| Servers | 6 |
| Applications | 5 |
| Metrics | 3 |
| Alert Rules | 3 |
| Alerts | 4 |
| Dashboard | 2 |
| Health | 1 |
| **Total** | **39** |
