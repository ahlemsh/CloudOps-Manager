# Sequence Diagrams

Four key interaction flows in CloudOps Manager.

---

## 1. Login with JWT

```mermaid
sequenceDiagram
    title Login with JWT — Access Token + Refresh Token Issuance

    actor User
    participant Browser
    participant Frontend
    participant API as NestJS API
    participant AuthService
    participant UserRepo as UserRepository
    participant JWTService

    User->>Browser: Enter email + password, click Login
    Browser->>Frontend: Submit login form
    Frontend->>API: POST /api/v1/auth/login { email, password }
    Note over API: Route is @Public() — JwtAuthGuard skipped
    API->>AuthService: validateUser(email, password)
    AuthService->>UserRepo: findByEmail(email)
    UserRepo-->>AuthService: User record (with passwordHash)
    AuthService->>AuthService: bcrypt.compare(password, passwordHash)
    alt Invalid credentials
        AuthService-->>API: throw UnauthorizedException
        API-->>Frontend: 401 Unauthorized
        Frontend-->>Browser: Show error message
    else Valid credentials
        AuthService->>JWTService: sign({ sub: userId, role }) → accessToken (15m)
        AuthService->>JWTService: sign({ sub: userId }) → refreshToken (7d)
        AuthService-->>API: { accessToken, refreshToken, user }
        API-->>Frontend: 200 OK { accessToken, user } + Set-Cookie: refreshToken (httpOnly)
        Frontend->>Frontend: Store accessToken in memory
        Frontend-->>Browser: Redirect to /dashboard
    end
```

---

## 2. Create a Server

```mermaid
sequenceDiagram
    title Create a Server — Auth + RBAC + Persistence

    actor DevOps
    participant Browser
    participant Frontend
    participant API as NestJS API
    participant AuthGuard as JwtAuthGuard
    participant RolesGuard
    participant Controller as ServersController
    participant Service as ServersService
    participant Repo as ServerRepository
    participant DB as PostgreSQL

    DevOps->>Browser: Fill server form, click Save
    Browser->>Frontend: Submit form data
    Frontend->>API: POST /api/v1/servers { name, provider, region, ip, cpu, ram, storage, environmentId } Bearer: accessToken
    API->>AuthGuard: Validate JWT
    AuthGuard->>AuthGuard: Verify token signature + expiry
    alt Token invalid or expired
        AuthGuard-->>API: throw UnauthorizedException
        API-->>Frontend: 401 Unauthorized
    else Token valid
        AuthGuard-->>API: Inject user payload into request
        API->>RolesGuard: Check @Roles(ADMIN, DEVOPS)
        RolesGuard->>RolesGuard: Compare request.user.role with allowed roles
        alt Role not allowed
            RolesGuard-->>API: throw ForbiddenException
            API-->>Frontend: 403 Forbidden
        else Role allowed
            RolesGuard-->>API: Pass
            API->>Controller: createServer(createServerDto, currentUser)
            Controller->>Service: create(dto)
            Service->>Service: Validate environmentId exists
            Service->>Repo: save({ ...dto, status: PROVISIONING })
            Repo->>DB: INSERT INTO servers ...
            DB-->>Repo: Saved server record
            Repo-->>Service: Server entity
            Service-->>Controller: Server entity
            Controller-->>API: 201 Created { server }
            API-->>Frontend: 201 Created { server }
            Frontend-->>Browser: Show new server in list
        end
    end
```

---

## 3. Metric Ingestion and Alert Triggering

```mermaid
sequenceDiagram
    title Metric Ingestion and Alert Triggering — Scheduler Flow

    participant Scheduler
    participant MetricsService
    participant ServerRepo as ServerRepository
    participant MetricRepo as MetricRepository
    participant AlertRuleRepo as AlertRuleRepository
    participant AlertService
    participant AlertRepo as AlertRepository

    loop Every 30 seconds (configurable)
        Scheduler->>MetricsService: collectAll()
        MetricsService->>ServerRepo: findActive() → servers with status RUNNING
        ServerRepo-->>MetricsService: [ Server, ... ]

        loop For each active server
            MetricsService->>MetricsService: generateSimulatedMetrics(server)
            Note over MetricsService: Generate plausible CPU%, RAM%, disk%, network values
            MetricsService->>MetricRepo: save({ serverId, cpu, ram, disk, net, recordedAt: now })
            MetricRepo-->>MetricsService: Saved Metric

            MetricsService->>AlertRuleRepo: findActiveByServer(serverId)
            AlertRuleRepo-->>MetricsService: [ AlertRule, ... ]

            loop For each active alert rule
                MetricsService->>MetricsService: evaluateRule(rule, metric)
                alt Threshold breached
                    MetricsService->>AlertService: createAlert(rule, metric, server)
                    AlertService->>AlertRepo: save({ alertRuleId, serverId, severity, status: TRIGGERED, triggeredAt: now })
                    AlertRepo-->>AlertService: Saved Alert
                    AlertService-->>MetricsService: Alert created
                else Threshold not breached
                    Note over MetricsService: No action
                end
            end
        end
    end
```

---

## 4. View Dashboard

```mermaid
sequenceDiagram
    title View Dashboard — Parallel Data Aggregation

    actor Viewer
    participant Browser
    participant Frontend
    participant API as NestJS API
    participant AuthGuard as JwtAuthGuard
    participant Controller as DashboardController
    participant Service as DashboardService
    participant ServerRepo as ServerRepository
    participant AlertRepo as AlertRepository
    participant AppRepo as ApplicationRepository
    participant MetricRepo as MetricRepository

    Viewer->>Browser: Navigate to /dashboard
    Browser->>Frontend: Load dashboard page
    Frontend->>API: GET /api/v1/dashboard/summary Bearer: accessToken
    API->>AuthGuard: Validate JWT
    AuthGuard-->>API: Valid — inject user
    API->>Controller: getSummary(currentUser, filters?)
    Controller->>Service: getSummary(userId, filters)

    par Parallel data fetching
        Service->>ServerRepo: countByStatus()
        ServerRepo-->>Service: { total, running, stopped, ... }
    and
        Service->>AlertRepo: countActive()
        AlertRepo-->>Service: { critical, warning, info }
    and
        Service->>AppRepo: countByStatus()
        AppRepo-->>Service: { running, failed, deploying }
    and
        Service->>MetricRepo: getLatestPerServer()
        MetricRepo-->>Service: [ { serverId, cpu, ram, recordedAt }, ... ]
    end

    Service->>Service: Aggregate all results into summary DTO
    Service-->>Controller: DashboardSummaryDto
    Controller-->>API: 200 OK { summary }
    API-->>Frontend: 200 OK { summary }
    Frontend->>Frontend: Render counters, status badges, and metric charts
    Frontend-->>Browser: Display dashboard
    Note over Frontend: Auto-refresh triggered again in 30s
```
