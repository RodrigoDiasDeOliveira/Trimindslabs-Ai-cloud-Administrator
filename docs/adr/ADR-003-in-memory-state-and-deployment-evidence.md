# ADR-003: In-Memory State and Deployment Evidence Boundary

- **Status:** PROPOSED
- **Date:** 2026-10-11

## Context

The current runtime stores sessions, inventory, and audit state in memory. Container replacement or scaling can lose this state. A successful CI run or the presence of a Dockerfile does not establish which image is serving Cloud Run traffic.

## Decision proposed

Describe current state as ephemeral until a durable persistence adapter is implemented. Record deployment evidence using service, project, region, revision, image digest, source commit, traffic allocation, and verification timestamp. Do not claim a current deployment from CI evidence alone.

## Consequences

- Restart/scale durability remains an explicit production gap.
- Deployment status requires independent GCP verification.
- This ADR remains proposed pending owner confirmation.
