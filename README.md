# AI MultiCloud Agent — Enterprise Multi-Cloud AI Platform

> ⚠️ **Status do Projeto: MVP / Work in Progress**  
> Esta plataforma encontra-se atualmente em estágio de **MVP (Produto Mínimo Viável) / Trabalho em Progresso**. A arquitetura corporativa, camada de abstração unificada, políticas de segurança OPA, trilha de auditoria encadeada com SHA-256 e resiliência com Circuit Breaker estão ativas e com cobertura abrangente de testes automatizados.

---

## 📄 Licença do Projeto
- **Licença Padrão:** **MIT License** (consistente e unificada em todo o repositório).
- **Resolução de Inconsistência:** Quaisquer referências prévias a GPL-2.0 foram expressamente descontinuadas. O projeto adota a licença permissiva **MIT**, permitindo integração corporativa flexível e conformidade com ambientes de nuvem pública e privada.

---

## 🔄 Evolução e Descontinuação do Streamlit
O protótipo legada em Streamlit/Python foi formalmente **descontinuado e substituído** pelo frontend corporativo de alto desempenho em **React 19 (TypeScript, Tailwind CSS)** acoplado ao gateway **Express + Spring Boot 3.3 Security**.
- **Por que a migração foi necessária?** O Streamlit não suportava o modelo reativo de streaming de eventos de IA, personalização de múltiplos temas de contraste, internacionalização nativa (PT/EN/ES), nem a governança visual de blast radius com RBAC granular em tempo real.

---

## 🏗️ Arquitetura do Sistema

```
                         ┌────────────────────────────────────────────────────────┐
                         │              React 19 Frontend Dashboard               │
                         │    - i18n (Português, Inglês, Espanhol)                │
                         │    - 3 Temas: Escuro Profundo, Midnight, Claro         │
                         │    - RBAC Visual: Admin, Dev, Observer, FinOps         │
                         │    - IaC & Nuvem Studio (Criar, Ajustar e Subir)       │
                         │    - Interface de Cadastro Dinâmico de Nuvens          │
                         └───────────────────────────┬────────────────────────────┘
                                                     │ REST / JSON (Porta 3000)
                                                     ▼
                         ┌────────────────────────────────────────────────────────┐
                         │         Express Gateway & Embedded AI Runtime          │
                         │    - Proxy reverso transparente                        │
                         │    - Circuit Breaker + Tenacity Exponential Backoff    │
                         │    - OpenTelemetry Distributed Tracing (Spans)         │
                         │    - Open Policy Agent (OPA) Gatekeeper Engine         │
                         │    - Ledger Criptográfico Imutável (SHA-256 Chaining)  │
                         │    - Motor Gemini 3.8 Flash com Guardrails             │
                         └───────────────────────────┬────────────────────────────┘
                                                     │ Proxy / mTLS (Porta 8080)
                                                     ▼
                         ┌────────────────────────────────────────────────────────┐
                         │            Spring Boot 3.3 Enterprise Backend          │
                         │    - Spring Security (BCrypt, InMemory/JPA RBAC)       │
                         │    - AuthController (/api/v1/auth/login, /me)          │
                         │    - ProviderHealthController (/api/v1/providers)      │
                         │    - Blast Radius Safety Engine                        │
                         │    - Trilha Imutável de Auditoria (ADR-004)            │
                         └───────────────────────────┬────────────────────────────┘
                                                     │ Cloud SDKs & APIs
         ┌──────────────┬────────────────────────────┼──────────────┬──────────────┬──────────────┐
         ▼              ▼                            ▼              ▼              ▼              ▼
      ┌─────┐       ┌────────┐                    ┌─────┐        ┌─────┐       ┌────────┐     ┌───────┐
      │ AWS │       │ Azure  │                    │ GCP │        │ OCI │       │ Custom │     │Gemini │
      └─────┘       └────────┘                    └─────┘        └─────┘       └────────┘     └───────┘
```

---

## 🧪 Cobertura de Testes Automatizados (15 Testes em 5 Suítes)
O projeto conta com suítes de testes unitários e de integração com mocks dos SDKs:
1. **Unified Multi-Cloud Abstraction (`tests/unifiedCloudAdapter.test.ts`)**:
   - Criação de VM em modo Dry-Run sem mutação de inventário.
   - Provisionamento real de VM após validação.
   - Término de recurso em Dry-Run calculando economia FinOps.
   - Health probe real leve com medição de latência de endpoints.
2. **Circuit Breaker & Tenacity Retry (`tests/circuitBreaker.test.ts`)**:
   - Transição de estados: CLOSED ➔ OPEN após limite consecutivo de falhas.
   - Tentativas automáticas com jitter e backoff exponencial (`retryWithTenacity`).
3. **Open Policy Agent - OPA Gatekeeper (`tests/opaPolicy.test.ts`)**:
   - Bloqueio imediato de código Terraform com porta SSH 22 aberta para `0.0.0.0/0` (`OPA-SEC-001`).
   - Aprovação de templates seguros com criptografia KMS (`OPA-SEC-002`).
4. **Multi-Cloud Backup & Disaster Recovery (`tests/backupManager.test.ts`)**:
   - Listagem e cálculo de SLAs de RPO (Recovery Point Objective) e RTO (Recovery Time Objective).
   - Execução de backup com replicação cruzada e hash SHA-256.
   - Simulação de drill de restauração sem parada de produção.
5. **Ledger de Auditoria Criptográfico (`tests/auditCryptoChain.test.ts`)**:
   - Encadeamento sequencial de blocos com hash SHA-256 e `previousHash`.
   - Detecção matemática de qualquer adulteração ou injeção retroativa na trilha.

Para rodar todos os testes:
```bash
npm test
```

---

## 🛠️ Interface "IaC & Nuvem Studio" (Criar, Ajustar e Subir para a Nuvem)
Localizada na aba **"IaC & Nuvem Studio"** do painel:
1. **Criar e Selecionar Modelos**: Suporte a Terraform (`main.tf`), ARM Templates / JSON e Kubernetes YAML para AWS, Azure, GCP e OCI.
2. **Ajustar Parâmetros**: Controles dinâmicos para alternar tipo de instância, região, criptografia KMS e regras de firewall/SSH.
3. **Validar OPA**: Avaliação contra regras de compliance antes de qualquer toque na nuvem.
4. **Simulação Dry-Run**: Gera o plano de impacto e cálculo de Blast Radius e FinOps sem custos.
5. **Subir para Nuvem**: Deploy imediato com registro na trilha de auditoria e integração com inventário ao vivo.
6. **Matriz de Backup e DR**: Monitoramento de réplicas cruzadas entre nuvens com acionamento de Drills e medição de RTO.

---

## 🤖 Integração com MCP (Model Context Protocol) para Claude, Cursor e Continue

O arquivo de configuração está disponível em `/mcp/multicloud-mcp.json`.

### 1. Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "ai-multicloud-agent": {
      "command": "node",
      "args": ["dist/server.cjs"],
      "env": {
        "PORT": "3000",
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 2. Cursor IDE (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "multicloud-ops": {
      "url": "http://localhost:3000/api/agent/chat",
      "transport": "http"
    }
  }
}
```

### 3. Continue (`~/.continue/config.json`)
```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "npx",
          "args": ["tsx", "server.ts"]
        }
      }
    ]
  }
}
```

---

## 🔐 Controle de Acesso Baseado em Perfis (Spring Boot Security RBAC)

| Usuário | Senha Padrão | Role | Permissões & Restrições |
|---|---|---|---|
| **admin** | `admin123` | `ROLE_ADMIN` | Acesso total irrestrito: aprovação de Blast Radius, parada/início de recursos críticos, cadastro de novas nuvens e exportação de auditoria. |
| **dev** | `dev123` | `ROLE_DEV` | Acesso operacional padrão: consulta de inventário, solicitação de orquestrações e ações de desenvolvimento. Requer aprovação de Blast Radius para operações de alto impacto. |
| **observer** | `observer123` | `ROLE_OBSERVER` | Acesso estritamente somente leitura (*Read-Only*): visualização de dashboards, custos e inventário. Todas as ações destrutivas ou aprovações são bloqueadas pelo sistema. |
| **finops** | `finops123` | `ROLE_FINOPS` | Especialista em custos: visualização consolidada de faturamento e recomendações de Savings Plans. |

---

## 🌐 Internacionalização (i18n) e Temas Visuais
- **Idiomas:** Português (Brasil - `pt`), Inglês (`en`) e Espanhol (`es`), com persistência local.
- **Temas de Contraste:** 
  1. **Escuro Profundo (`dark`)**: Slate 950 otimizado para operações NOC 24/7.
  2. **Midnight (`midnight`)**: Marinho profundo (`#0b0f19`) de contraste balanceado.
  3. **Claro Corporativo (`light`)**: Fundo claro executivo para relatórios e luz natural.

---

## 🚀 Como Executar

### 1. Aplicação Completa (Frontend React 19 + Gateway na Porta 3000)
```bash
npm install
npm run dev
```
Acesse `http://localhost:3000`.

### 2. Executar Suíte de Testes
```bash
npm test
```

### 3. Microserviço Backend Spring Boot 3.3 (Porta 8080)
```bash
cd backend-springboot
mvn clean package -DskipTests
java -jar target/ai-multicloud-agent-backend-1.0.0.jar
```
