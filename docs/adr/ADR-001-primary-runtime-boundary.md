# ADR-001: Primary Runtime Boundary — Node/Express and Auxiliary Spring Boot

- **Status:** PROPOSED
- **Date:** 2026-10-11

## Context

The root package/build and container path describe a React/Vite frontend served with a Node.js/Express HTTP runtime. The repository also contains Spring Boot code and earlier architectural references to it. Source presence alone does not prove that the Spring Boot application is built or deployed by the current release path.

## Decision proposed

Document Node.js/Express as the current primary runtime for the existing root build path. Treat Spring Boot as auxiliary/legacy unless the owner explicitly chooses a migration and updates build, tests, container, workflow, and deployment evidence together.

## Consequences

- README and deployment records distinguish current runtime from alternate code.
- No claim is made that the current Cloud Run revision uses either runtime until its image digest and revision are verified.
- This ADR remains proposed pending owner confirmation.
