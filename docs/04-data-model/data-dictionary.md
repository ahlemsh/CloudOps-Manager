# Data Dictionary

Detailed field definitions for all 10 entities in the CloudOps Manager data model.

---

## Enumerations

| Enum | Values |
|------|--------|
| `Role` | `ADMIN`, `DEVOPS`, `VIEWER` |
| `ProjectStatus` | `ACTIVE`, `ARCHIVED`, `SUSPENDED` |
| `EnvironmentType` | `DEVELOPMENT`, `STAGING`, `PRODUCTION` |
| `ServerStatus` | `PROVISIONING`, `RUNNING`, `STOPPED`, `MAINTENANCE`, `TERMINATED` |
| `ApplicationStatus` | `DEPLOYING`, `RUNNING`, `STOPPED`, `FAILED`, `ROLLING_BACK` |
| `MetricType` | `CPU`, `RAM`, `DISK`, `NETWORK_IN`, `NETWORK_OUT` |
| `AlertOperator` | `GT` (>), `GTE` (>=), `LT` (<), `LTE` (<=) |
| `AlertSeverity` | `INFO`, `WARNING`, `CRITICAL` |
| `AlertStatus` | `TRIGGERED`, `ACKNOWLEDGED`, `RESOLVED`, `CLOSED`, `ESCALATED` |

---

## USER

Represents a platform user account with an assigned role.

| Field | Type | Nullable | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | PK | Unique identifier |
| `email` | VARCHAR(255) | No | — | UNIQUE, NOT NULL | Login identifier and communication address |
| `passwordHash` | VARCHAR(255) | No | — | NOT NULL | bcrypt hash of the user's password |
| `firstName` | VARCHAR(100) | No | — | NOT NULL | User's given name |
| `lastName` | VARCHAR(100) | No | — | NOT NULL | User's family name |
| `role` | `Role` enum | No | `VIEWER` | NOT NULL | Platform role determining permissions |
| `isActive` | BOOLEAN | No | `true` | NOT NULL | Deactivated accounts cannot authenticate |
| `createdAt` | TIMESTAMPTZ | No | `NOW()` | NOT NULL | Record creation timestamp |
| `updatedAt` | TIMESTAMPTZ | No | `NOW()` | NOT NULL | Last update timestamp (auto-managed by Prisma) |

---

## PROJECT

A top-level organizational unit grouping environments, servers, and applications.

| Field | Type | Nullable | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | PK | Unique identifier |
| `name` | VARCHAR(150) | No | — | NOT NULL | Human-readable project name |
| `description` | TEXT | Yes | NULL | — | Optional project description |
| `status` | `ProjectStatus` enum | No | `ACTIVE` | NOT NULL | Project lifecycle status |
| `ownerId` | UUID | No | — | FK → USER.id, NOT NULL | User who owns and administers the project |
| `createdAt` | TIMESTAMPTZ | No | `NOW()` | NOT NULL | Record creation timestamp |
| `updatedAt` | TIMESTAMPTZ | No | `NOW()` | NOT NULL | Last update timestamp |

---

## PROJECT_MEMBER

Junction table recording which users are members of which projects.

| Field | Type | Nullable | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | PK | Unique identifier |
| `projectId` | UUID | No | — | FK → PROJECT.id, NOT NULL | The project this membership belongs to |
| `userId` | UUID | No | — | FK → USER.id, NOT NULL | The user who is a member |
| `assignedAt` | TIMESTAMPTZ | No | `NOW()` | NOT NULL | When the user was added to the project |

**Unique constraint:** `(projectId, userId)` — a user can only be a member of a given project once.

---

## ENVIRONMENT

A named deployment context (Development, Staging, Production) within a project.

| Field | Type | Nullable | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | PK | Unique identifier |
| `name` | VARCHAR(100) | No | — | NOT NULL | Display name for the environment |
| `type` | `EnvironmentType` enum | No | — | NOT NULL | Deployment tier |
| `projectId` | UUID | No | — | FK → PROJECT.id, NOT NULL | The project this environment belongs to |
| `createdAt` | TIMESTAMPTZ | No | `NOW()` | NOT NULL | Record creation timestamp |

---

## SERVER

Represents a VPS or VM in the infrastructure inventory.

| Field | Type | Nullable | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | PK | Unique identifier |
| `name` | VARCHAR(150) | No | — | NOT NULL | Display name for the server |
| `provider` | VARCHAR(100) | No | — | NOT NULL | Hosting provider (e.g., Hetzner, AWS, DigitalOcean) |
| `region` | VARCHAR(100) | No | — | NOT NULL | Provider region or datacenter (e.g., `eu-west-1`) |
| `ipAddress` | VARCHAR(45) | No | — | NOT NULL | Public IP address (IPv4 or IPv6) |
| `cpuCores` | INTEGER | No | — | NOT NULL, > 0 | Number of virtual CPU cores |
| `ramGb` | DECIMAL(8,2) | No | — | NOT NULL, > 0 | RAM in gigabytes |
| `storageGb` | DECIMAL(10,2) | No | — | NOT NULL, > 0 | Storage in gigabytes |
| `status` | `ServerStatus` enum | No | `PROVISIONING` | NOT NULL | Lifecycle status |
| `environmentId` | UUID | No | — | FK → ENVIRONMENT.id, NOT NULL | The environment this server belongs to |
| `createdAt` | TIMESTAMPTZ | No | `NOW()` | NOT NULL | Record creation timestamp |
| `updatedAt` | TIMESTAMPTZ | No | `NOW()` | NOT NULL | Last update timestamp |

---

## APPLICATION

A software workload deployed on a server.

| Field | Type | Nullable | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | PK | Unique identifier |
| `name` | VARCHAR(150) | No | — | NOT NULL | Application name |
| `version` | VARCHAR(50) | No | — | NOT NULL | Deployed version string (e.g., `1.4.2`, `main-abc1234`) |
| `status` | `ApplicationStatus` enum | No | `DEPLOYING` | NOT NULL | Deployment lifecycle status |
| `serverId` | UUID | No | — | FK → SERVER.id, NOT NULL | The server hosting this application |
| `environmentId` | UUID | No | — | FK → ENVIRONMENT.id, NOT NULL | The environment this application is deployed to |
| `deployedAt` | TIMESTAMPTZ | Yes | NULL | — | Timestamp of the most recent deployment |
| `updatedAt` | TIMESTAMPTZ | No | `NOW()` | NOT NULL | Last record update timestamp |

---

## METRIC

A single time-series data point recording resource usage for a server.

| Field | Type | Nullable | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | PK | Unique identifier |
| `serverId` | UUID | No | — | FK → SERVER.id, NOT NULL | The server this metric belongs to |
| `cpuPercent` | DECIMAL(5,2) | No | — | NOT NULL, 0–100 | CPU utilization percentage |
| `ramPercent` | DECIMAL(5,2) | No | — | NOT NULL, 0–100 | RAM utilization percentage |
| `diskPercent` | DECIMAL(5,2) | No | — | NOT NULL, 0–100 | Disk utilization percentage |
| `networkInKbps` | DECIMAL(12,2) | No | — | NOT NULL, ≥ 0 | Inbound network bandwidth in kbps |
| `networkOutKbps` | DECIMAL(12,2) | No | — | NOT NULL, ≥ 0 | Outbound network bandwidth in kbps |
| `recordedAt` | TIMESTAMPTZ | No | `NOW()` | NOT NULL | Timestamp when the metric was captured |

**Index:** `(serverId, recordedAt DESC)` for efficient time-range queries.

---

## ALERT_RULE

A configurable rule that defines conditions for automatic alert creation.

| Field | Type | Nullable | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | PK | Unique identifier |
| `name` | VARCHAR(150) | No | — | NOT NULL | Human-readable rule name |
| `serverId` | UUID | No | — | FK → SERVER.id, NOT NULL | The server this rule monitors |
| `metricType` | `MetricType` enum | No | — | NOT NULL | Which metric this rule evaluates |
| `operator` | `AlertOperator` enum | No | — | NOT NULL | Comparison direction (GT, GTE, LT, LTE) |
| `threshold` | DECIMAL(10,2) | No | — | NOT NULL | Numeric threshold value |
| `severity` | `AlertSeverity` enum | No | — | NOT NULL | Severity of alerts this rule produces |
| `isActive` | BOOLEAN | No | `true` | NOT NULL | Inactive rules are not evaluated by the scheduler |
| `createdAt` | TIMESTAMPTZ | No | `NOW()` | NOT NULL | Record creation timestamp |

---

## ALERT

An alert record created when a metric breaches an alert rule's threshold.

| Field | Type | Nullable | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | PK | Unique identifier |
| `alertRuleId` | UUID | No | — | FK → ALERT_RULE.id, NOT NULL | The rule that triggered this alert |
| `serverId` | UUID | No | — | FK → SERVER.id, NOT NULL | The server that generated the alert |
| `status` | `AlertStatus` enum | No | `TRIGGERED` | NOT NULL | Current alert lifecycle status |
| `severity` | `AlertSeverity` enum | No | — | NOT NULL | Inherited from the triggering alert rule |
| `message` | TEXT | No | — | NOT NULL | Auto-generated human-readable description of the breach |
| `acknowledgedBy` | UUID | Yes | NULL | FK → USER.id | User who acknowledged this alert |
| `triggeredAt` | TIMESTAMPTZ | No | `NOW()` | NOT NULL | When the alert was first created |
| `acknowledgedAt` | TIMESTAMPTZ | Yes | NULL | — | When the alert was acknowledged |
| `resolvedAt` | TIMESTAMPTZ | Yes | NULL | — | When the underlying issue was resolved |

**Index:** `(serverId, status)` for efficient active alert queries. `(triggeredAt DESC)` for history ordering.
