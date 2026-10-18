# Activity Diagram — Alert Lifecycle

Full flow from metric evaluation through alert creation, acknowledgement, escalation, and resolution.

```mermaid
flowchart TD
    START([Start: Scheduler fires]) --> COLLECT[Collect metric for server]
    COLLECT --> EVAL{Threshold\nbreached?}

    EVAL -- No --> IDLE([End: No action])
    EVAL -- Yes --> CREATE[AlertService creates Alert\nstatus: TRIGGERED]

    CREATE --> NOTIFY[Notify DevOps team\nvia dashboard alert feed]
    NOTIFY --> WAIT{DevOps\nacknowledges?}

    WAIT -- Yes --> ACK[Alert status → ACKNOWLEDGED\nRecord acknowledgedBy + timestamp]
    ACK --> INVESTIGATE[DevOps investigates issue]
    INVESTIGATE --> RESOLVED{Issue\nresolved?}

    RESOLVED -- Yes --> RES[Alert status → RESOLVED\nRecord resolvedAt]
    RES --> CLOSE[Alert status → CLOSED]
    CLOSE --> DONE([End: Incident closed])

    RESOLVED -- No --> MONITOR[Continue monitoring\nnext scheduler cycle]
    MONITOR --> COLLECT

    WAIT -- No / Timeout --> ESCALATE{Escalation\nrule exists?}

    ESCALATE -- Yes --> ESC[Alert status → ESCALATED\nNotify Admin]
    ESC --> WAIT

    ESCALATE -- No --> REMAIN[Alert remains TRIGGERED\nvisible in active alerts]
    REMAIN --> WAIT
```

## State Transitions Summary

| From | To | Trigger |
|------|----|---------|
| — | TRIGGERED | Metric breaches alert rule threshold |
| TRIGGERED | ACKNOWLEDGED | DevOps or Admin acknowledges the alert |
| TRIGGERED | ESCALATED | No acknowledgement within escalation timeout |
| ESCALATED | ACKNOWLEDGED | DevOps or Admin acknowledges the escalated alert |
| ACKNOWLEDGED | RESOLVED | DevOps marks the underlying issue as resolved |
| RESOLVED | CLOSED | System or Admin closes the resolved alert |
