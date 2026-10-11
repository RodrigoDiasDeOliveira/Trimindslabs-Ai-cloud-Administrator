# ADR-002: No Implied Provider Execution or Simulated Success

- **Status:** PROPOSED
- **Date:** 2026-10-11

## Context

The application includes real AWS SDK paths when credentials and permissions are configured, while Azure, GCP, and OCI lifecycle adapters are not configured in the documented implementation. AI analysis and dry-run planning are not infrastructure execution.

## Decision proposed

Provider operations may be reported as successful only when a real configured adapter returns verified evidence. AI output and dry-run plans must remain non-mutating. Missing adapters must return an explicit not-configured state.

## Consequences

- Provider status must be capability-specific.
- Demo mode must remain read-only.
- Future adapters require tests and documented least-privilege credentials before being marked operational.
- This ADR remains proposed pending owner confirmation.
