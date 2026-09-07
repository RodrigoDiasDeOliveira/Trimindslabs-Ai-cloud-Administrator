# ADR-002: Camada de Abstração Unificada para Provedores Multi-Cloud

## Status
Aceito (Accepted)

## Contexto
Cada provedor de nuvem (AWS, Azure, GCP, Oracle OCI) possui nomenclaturas, modelos de recursos e SDKs distintos (ex: EC2 vs Virtual Machine vs Compute Engine vs OCI Instance; S3 vs Blob Storage vs Cloud Storage vs Object Storage). Chamar APIs de nuvem sem padronização geraria código redundante e acoplado, dificultando a adição de novos provedores e a orquestração agnóstica via IA.

## Decisão
Implementar a interface `CloudProviderAdapter` com as operações normalizadas:
- `getProviderType()`
- `healthCheck()`
- `listResources(category, region)`
- `executeAction(resourceId, action, parameters)`
- `estimateCost(resourceType, size, region)`

Foram criados os adaptadores concretos:
- `AwsProviderAdapter`
- `AzureProviderAdapter`
- `GcpProviderAdapter`
- `OciProviderAdapter`

## Consequências
- **Positivas**:
  - O Agente de IA pode raciocinar e executar ferramentas com esquemas uniformes (`CloudResourceDto`, `ProviderStatusDto`).
  - Facilidade em adicionar ou alternar entre provedores de nuvem sem alterar a lógica central de governança.
  - Mock de testes e simulações de *Dry-Run* desacopladas da infraestrutura real.
