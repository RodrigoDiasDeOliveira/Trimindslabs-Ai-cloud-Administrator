# SEC-PLAN-003 — Credenciais administrativas e sessões

**Data:** 2026-11-13  
**Status:** proposta documental, sem implementação.  
**Escopo:** protótipo sem URL ativa confirmada pelo responsável; não foi comprovada exposição pública nem realizada verificação dinâmica.

## Evidências

Fonte: [`server.ts`](https://github.com/RodrigoDiasDeOliveira/Trimindslabs-Ai-cloud-Administrator/blob/main/server.ts).

- Linhas 233–245: comentário identifica credencial bootstrap temporária; `ADMIN_USERNAME` e `ADMIN_PASSWORD` possuem valores fixos no código.
- Linhas 253–262: sessões são identificadas por token gerado com `randomUUID()`, armazenado em `Map` de memória; não há expiração ou revogação por usuário visível nessas funções.
- Linhas 265–292: login concede perfil administrativo mediante credencial fixa; middleware `app.use('/api', ...)` exige Bearer token para APIs operacionais subsequentes, exceto rotas `/auth/`.
- Linhas 576–600 e 1256–1287: ações em recursos e execução por agente verificam autenticação, `WRITE` e `EXECUTE_CRITICAL` para `TERMINATE`. **Esses controles positivos devem ser preservados.**
- A checagem de `confirmationToken` observada na execução do agente valida apenas um prefixo quando o campo é fornecido; isso não demonstra um protocolo de aprovação forte. Sua necessidade e abrangência devem ser avaliadas separadamente.

## Riscos condicionais

- Se a aplicação for publicada com credencial bootstrap fixa, uma pessoa que conheça o código poderá obter sessão administrativa.
- Sessões em memória sem expiração/revogação demonstradas aumentam a duração de acesso caso um token seja comprometido.
- A existência de verificações de permissão em algumas ações não prova cobertura de todas as operações críticas.
- Sem confirmação de deploy e configuração, **não** classificar como incidente ativo.

## Requisitos para futura PR de código

1. **Fail closed em produção:** remover credencial administrativa fixa do fluxo produtivo; exigir identidade/segredo externos adequadamente protegidos, sem fallback.
2. **Bootstrap controlado:** se necessário para desenvolvimento, isolar por configuração explícita, não permitir acesso a provedores/recursos reais e identificar visualmente modo DEMO.
3. **Sessões:** definir TTL, expiração, revogação e logout no servidor; preservar geração imprevisível de tokens e impedir vazamento em logs.
4. **Autorização:** manter middleware de sessão e checks `WRITE`/`EXECUTE_CRITICAL`; inventariar e testar outras operações de impacto (IaC deploy, backup, provider connect, agente).
5. **Aprovação humana:** definir contrato verificável de confirmação para operações destrutivas, vinculado a ator, recurso, ação, validade e consumo único; não confiar em prefixo de token ou parâmetro opcional como prova de aprovação.
6. **Observabilidade:** logs de autenticação, autorização e aprovação sem segredos ou credenciais.
7. Aprovar ADR de identidade, gestão de sessão e autorização de ações antes de implementar; preservar interfaces e adaptadores existentes.

## Critérios de aceitação

| ID | Cenário | Resultado esperado |
|---|---|---|
| CLOUD-SEC-001 | Produção sem configuração de autenticação segura | Inicialização ou operação privilegiada recusada |
| CLOUD-SEC-002 | Tentativa com credencial bootstrap conhecida | Rejeitada em produção |
| CLOUD-SEC-003 | Requisição sem sessão ou com token inválido | 401 |
| CLOUD-SEC-004 | Token expirado ou revogado | 401 |
| CLOUD-SEC-005 | Perfil sem `WRITE` tenta modificar recurso | 403 |
| CLOUD-SEC-006 | Perfil sem `EXECUTE_CRITICAL` tenta `TERMINATE` | 403 |
| CLOUD-SEC-007 | Ação destrutiva sem aprovação válida quando exigida pela política | Não executada; evidência registrada |
| CLOUD-SEC-008 | Tentativa de reutilizar aprovação | Rejeitada |
| CLOUD-SEC-009 | IaC, backup, conexão de provedores e agente | Matriz de permissões validada por testes |
| CLOUD-SEC-010 | Regressão e revisão | Fluxos autorizados preservados; testes executados, commit identificado e revisão humana |

## Execução futura

1. Inventariar rotas e operações reais, incluindo fronteira entre simulação e execução em provedor.
2. Aprovar ADR sobre bootstrap, identidade, sessões e aprovação de ações destrutivas.
3. Implementar em PR independente com testes de segurança negativos e regressão.
4. Reauditar commit e configuração de deploy antes de qualquer mudança de status.

**Não objetivos desta PR:** alterar código, credenciais reais, API, UI, infraestrutura, workflow, deploy ou estado `NOT_MEASURED`. Esta especificação não substitui auditoria dinâmica nem comprova segurança.
