# Entity Relationship Diagram

```mermaid
erDiagram
    USER {
        uuid id PK
        string email UK
        string passwordHash
        string firstName
        string lastName
        enum role
        boolean isActive
        timestamp createdAt
        timestamp updatedAt
    }

    PROJECT {
        uuid id PK
        string name
        string description
        enum status
        uuid ownerId FK
        timestamp createdAt
        timestamp updatedAt
    }

    PROJECT_MEMBER {
        uuid id PK
        uuid projectId FK
        uuid userId FK
        timestamp assignedAt
    }

    ENVIRONMENT {
        uuid id PK
        string name
        enum type
        uuid projectId FK
        timestamp createdAt
    }

    SERVER {
        uuid id PK
        string name
        string provider
        string region
        string ipAddress
        int cpuCores
        float ramGb
        float storageGb
        enum status
        uuid environmentId FK
        timestamp createdAt
        timestamp updatedAt
    }

    APPLICATION {
        uuid id PK
        string name
        string version
        enum status
        uuid serverId FK
        uuid environmentId FK
        timestamp deployedAt
        timestamp updatedAt
    }

    METRIC {
        uuid id PK
        uuid serverId FK
        float cpuPercent
        float ramPercent
        float diskPercent
        float networkInKbps
        float networkOutKbps
        timestamp recordedAt
    }

    ALERT_RULE {
        uuid id PK
        string name
        uuid serverId FK
        enum metricType
        enum operator
        float threshold
        enum severity
        boolean isActive
        timestamp createdAt
    }

    ALERT {
        uuid id PK
        uuid alertRuleId FK
        uuid serverId FK
        enum status
        enum severity
        string message
        uuid acknowledgedBy FK
        timestamp triggeredAt
        timestamp acknowledgedAt
        timestamp resolvedAt
    }

    USER ||--o{ PROJECT : "owns"
    USER ||--o{ PROJECT_MEMBER : "member of"
    PROJECT ||--o{ PROJECT_MEMBER : "has"
    PROJECT ||--o{ ENVIRONMENT : "contains"
    ENVIRONMENT ||--o{ SERVER : "hosts"
    SERVER ||--o{ APPLICATION : "runs"
    SERVER ||--o{ METRIC : "generates"
    SERVER ||--o{ ALERT_RULE : "has"
    ALERT_RULE ||--o{ ALERT : "triggers"
    USER ||--o{ ALERT : "acknowledges"
```

## Relationship Summary

| Relationship | Cardinality | Description |
|-------------|-------------|-------------|
| USER → PROJECT | 1 : 0..* | A user can own zero or more projects |
| USER → PROJECT_MEMBER | 1 : 0..* | A user can be a member of multiple projects |
| PROJECT → PROJECT_MEMBER | 1 : 0..* | A project can have multiple members |
| PROJECT → ENVIRONMENT | 1 : 1..* | A project must have at least one environment |
| ENVIRONMENT → SERVER | 1 : 0..* | An environment hosts zero or more servers |
| SERVER → APPLICATION | 1 : 0..* | A server runs zero or more applications |
| SERVER → METRIC | 1 : 0..* | A server generates metric records over time |
| SERVER → ALERT_RULE | 1 : 0..* | A server can have multiple alert rules configured |
| ALERT_RULE → ALERT | 1 : 0..* | An alert rule can trigger multiple alerts over its lifetime |
| USER → ALERT | 1 : 0..* | A user can acknowledge zero or more alerts |
