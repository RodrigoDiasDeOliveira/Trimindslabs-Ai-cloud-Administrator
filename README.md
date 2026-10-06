# Trimindslabs AI Cloud Administrator

> **Estado:** MVP operacional / Work in Progress — preparado para validação de deploy, com capacidades reais explicitamente separadas das que ainda estão `NOT_CONFIGURED`.

Plataforma React + TypeScript + Express para administração multi-cloud, inventário, governança, observabilidade, auditoria encadeada e orquestração assistida por IA.

## Estado operacional real

### Configurado / operacional
- React 19 + TypeScript + Vite no frontend.
- Express como runtime HTTP, frontend e backend no mesmo processo.
- Autenticação por sessão em memória; credenciais de produção vêm de variáveis de ambiente/secrets.
- Um único perfil `demo/demo` pode existir somente com `DEMO_MODE=true`; é somente leitura.
- AWS: health probe via STS, descoberta de instâncias EC2 e ações START/STOP/RESTART/TERMINATE através dos SDKs reais.
- Motor interno de políticas de governança para avaliação de recursos e IaC.
- Dry-run explícito para planejamento de operações destrutivas; não altera estado do provedor.
- Auditoria com encadeamento SHA-256 e verificação de integridade.
- Tracing interno de operações.

### NOT_CONFIGURED / ainda não operacional
- Azure, GCP e OCI: sem adapter real de lifecycle/health conectado nesta versão.
- Deploy de IaC: validação/política disponíveis; execução Terraform/native ainda não conectada.
- Backup e Disaster Recovery cross-cloud: sem adapter real de armazenamento/provedor e sem agendamento persistente.
- Persistência de inventário, sessões e auditoria: atualmente em memória; reinício/escala do Cloud Run perde esse estado.
- Relatórios de FinOps: somente dados efetivamente presentes no inventário são calculados; nenhuma economia fixa é afirmada.
- Conformidade: o motor local avalia regras próprias; **não é uma instalação/runtime do OPA Gatekeeper**.

## Arquitetura atual

```
React 19 / TypeScript / Vite
          |
          v
Express API + AI orchestration + policy engine
          |
          +--> AWS SDKs (real, quando credentials estão configuradas)
          +--> Azure / GCP / OCI (NOT_CONFIGURED)
          +--> Gemini API (respostas de IA, sem mutação implícita)
          +--> SHA-256 audit chain
          +--> internal telemetry
```

Existe código legado/auxiliar Spring Boot no repositório, mas o caminho principal atual de execução é o runtime Node/Express. Ele não deve ser interpretado como um backend Spring obrigatório para o deploy atual.

## Princípio de execução

A plataforma não transforma planejamento, resposta de IA ou dry-run em execução real.

- **AI response:** gera análise/resposta; `infrastructureExecution=NOT_PERFORMED`.
- **Dry-run:** produz plano sem efeitos colaterais.
- **Real execution:** somente ocorre através de um adapter real configurado.
- **Provider sem adapter:** retorna `NOT_CONFIGURED` / `REAL_PROVIDER_ADAPTER_NOT_CONFIGURED`.
- Nenhum recurso fictício é criado para representar sucesso.

## Segurança

- Credenciais não são embutidas no frontend.
- Operações administrativas exigem sessão autenticada e permissões apropriadas.
- TERMINATE exige `EXECUTE_CRITICAL`.
- O perfil demo é read-only.
- Ações destrutivas podem ser interceptadas pelo guardrail e exigir aprovação humana.
- Não há credenciais padrão válidas no código.

> Para Cloud Run, recomenda-se Secret Manager para `GEMINI_API_KEY`, credenciais AWS e credenciais administrativas.

## Relatórios e governança

Os endpoints de governança e relatório distinguem:
- dados derivados do inventário real;
- dados ainda não configurados;
- resultados que exigem revisão;
- ausência de evidência.

Nenhuma economia anual, réplica cross-cloud, score de política ou status de auditoria é apresentado como realizado sem evidência runtime correspondente.

## Testes

Execute:

```bash
npm install
npm test
npm run lint
npm run build
```

A pipeline CI executa instalação, TypeScript, testes e build de produção.

## Execução local

```bash
npm install
npm run dev
```

Produção:

```bash
npm run build
NODE_ENV=production npm start
```

A aplicação usa `PORT` e escuta em `0.0.0.0`, compatível com Cloud Run.

## Dry-run

O projeto mantém **uma única capacidade explícita de simulação**: planejamento dry-run de operações destrutivas. Esse modo é claramente identificado e não altera recursos do provedor.

## MCP

Há artefatos de configuração relacionados a MCP no repositório, mas a implementação operacional principal descrita neste README é a API HTTP Express. Não se deve interpretar esses arquivos como prova de que um servidor FastMCP independente esteja ativo.

## Próximo estágio

Antes de declarar produção plena:

1. adicionar Dockerfile determinístico;
2. configurar secrets no Cloud Run;
3. decidir persistência externa para sessões/auditoria/inventário;
4. validar AWS com credenciais reais de menor privilégio;
5. manter Azure/GCP/OCI explicitamente `NOT_CONFIGURED` até seus adapters existirem;
6. executar testes pós-deploy contra endpoints reais.
