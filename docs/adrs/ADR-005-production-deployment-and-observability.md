# ADR-005: Estratégia de Deploy em Produção e Observabilidade

## Status
Aceito (Accepted)

## Contexto
Aplicações de orquestração de infraestrutura exigem alta confiabilidade, métricas de latência e saúde de conectividade contínua com os endpoints das nuvens (AWS sts, Azure arm, GCP resourcemanager, OCI identity).

## Decisão
1. **Contêineres e Empacotamento**:
   - Dockerfile multi-stage para compilação otimizada do Spring Boot com Alpine JRE.
   - Suporte a Docker Compose e Kubernetes manifests com health checks integrados (`/actuator/health`).
2. **Métricas e Telemetria**:
   - Endpoints Micrometer expondo métricas para Prometheus e dashboards Grafana.
   - Health probes ativas por provedor (`/api/v1/providers/health`), verificando latência de autenticação e cotas de API.
3. **Resiliência e Tolerância a Falhas**:
   - Tratamento de degradação parcial: se uma nuvem sofrer lentidão ou estiver sem credencial configurada, as demais continuam operando normalmente.

## Consequências
- Visibilidade operacional contínua e facilidade de sustentação pela equipe de SRE.
