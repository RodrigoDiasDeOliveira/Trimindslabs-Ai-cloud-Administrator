# ADR-004: Controle de Acesso Baseado em Funções (RBAC) e Trilha de Auditoria Imutável

## Status
Aceito (Accepted)

## Contexto
Normas regulatórias (PCI-DSS, SOC 2, HIPAA, LGPD) exigem que qualquer intervenção em ambientes de computação e dados seja atribuível a um indivíduo ou serviço autenticado, com registro detalhado e imutável de data/hora, origem, comando e parâmetros.

## Decisão
1. **Perfis de Acesso (RBAC)**:
   - `ROLE_ADMIN`: Acesso irrestrito a configurações de credenciais, aprovação de alto risco e auditoria global.
   - `ROLE_DEVOPS`: Execução de ações de provisionamento e alteração de instâncias mediante confirmação de guardrail.
   - `ROLE_AUDITOR`: Acesso exclusivo de visualização ao catálogo de recursos, métricas de conformidade e logs.
2. **Audit Ledger**:
   - Todo comando (emitido via IA ou via console web) gera um registro de auditoria com: ID da transação, Usuário, Função, Provedor de Nuvem, Recurso, Ação, Assinatura de integridade e Código de Retorno.

## Consequências
- Total rastreabilidade operacional e conformidade com requisitos de segurança corporativa.
