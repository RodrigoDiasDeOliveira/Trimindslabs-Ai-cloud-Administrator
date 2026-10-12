# Architecture Decision Records — AI Cloud Administrator

| ADR | Decision | Status | Date |
|---|---|---|---|
| ADR-001 | Primary Runtime Boundary: Node/Express and Auxiliary Spring Boot | PROPOSED | 2026-10-11 |
| ADR-002 | No Implied Provider Execution or Simulated Success | PROPOSED | 2026-10-11 |
| ADR-003 | In-Memory State and Deployment Evidence Boundary | PROPOSED | 2026-10-11 |

These records document the current implementation and decisions that still require explicit owner acceptance. A proposed ADR is not an accepted architecture decision.


## Related legacy ADR directory

A second directory, `docs/adrs/`, contains five older records covering the Spring Boot migration, provider abstraction, agent tool-calling guardrails, RBAC/audit compliance, and deployment/observability.

These two directories are **not yet consolidated**. Until the owner reviews the history and confirms whether the older records remain active, superseded, or historical, do not treat the numbered ADRs across both directories as one continuous accepted decision sequence. The current `docs/adr/` records describe the present Node/Express primary runtime boundary and explicitly remain PROPOSED; the existence of the older ADRs does not imply that the Spring Boot migration or all listed provider integrations are currently active.

Follow-up required:
1. Compare each older ADR's decision and status with the current source tree.
2. Record supersession links where one decision replaces another.
3. Preserve decision history when choosing a canonical directory; do not delete or silently renumber ADRs.
