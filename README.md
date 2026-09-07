# AI MultiCloud Agent — Enterprise Multi-Cloud AI Platform

Plataforma corporativa de orquestração de infraestrutura multi-cloud com agentes de IA autônomos e assistidos para **AWS**, **Microsoft Azure**, **Google Cloud Platform (GCP)**, **Oracle Cloud Infrastructure (OCI)** e **Novos Provedores Dinâmicos**.

Totalmente auditada e pronta para produção com:
- **Backend Enterprise**: Spring Boot 3.3 (Java 21) com Spring Security RBAC.
- **Frontend Moderno**: React 19 (TypeScript / Tailwind CSS) com suporte a i18n e múltiplos temas.
- **Camada de Gateway & Proxy**: Node/Express integrado para orquestração híbrida e streaming.
- **Motor de IA & FinOps**: Gemini 3.8 Flash com cálculo rigoroso de *Blast Radius Protection* e trilha de auditoria imutável (SHA-256).

> **Nota de Conformidade:** Toda a documentação técnica detalhada, relatórios de auditoria e ADRs estão localizados exclusivamente no diretório interno `/docs/` e não são expostos na interface gráfica do usuário final.

---

## 🏗️ Arquitetura do Sistema

```
                         ┌────────────────────────────────────────────────────────┐
                         │              React 19 Frontend Dashboard               │
                         │    - i18n (PT, EN, ES)                                 │
                         │    - 3 Temas: Dark, Midnight, Light                    │
                         │    - RBAC Visual (Admin, Dev, Observer)                │
                         │    - Interface de Cadastro Dinâmico de Nuvens          │
                         └───────────────────────────┬────────────────────────────┘
                                                     │ REST / JSON (Porta 3000)
                                                     ▼
                         ┌────────────────────────────────────────────────────────┐
                         │         Express Gateway & Embedded AI Runtime          │
                         │    - Proxy reverso transparente                        │
                         │    - Autenticação e RBAC Guardrails                    │
                         │    - Orquestração Gemini 3.8 Flash                     │
                         └───────────────────────────┬────────────────────────────┘
                                                     │ Proxy / mTLS (Porta 8080)
                                                     ▼
                         ┌────────────────────────────────────────────────────────┐
                         │            Spring Boot 3.3 Enterprise Backend          │
                         │    - Spring Security (BCrypt, InMemory/JPA RBAC)       │
                         │    - AuthController (/api/v1/auth/login, /me)          │
                         │    - ProviderHealthController (/api/v1/providers)      │
                         │    - Blast Radius Safety Engine (ADR-003)              │
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

## 🔐 Controle de Acesso Baseado em Perfis (Spring Boot Security RBAC)

O sistema implementa autenticação via Spring Security com três perfis de acesso bem definidos:

| Usuário | Senha Padrão | Role | Permissões & Restrições |
|---|---|---|---|
| **admin** | `admin123` | `ROLE_ADMIN` | Acesso total irrestrito: aprovação de Blast Radius, parada/início de recursos críticos, cadastro de novas nuvens e exportação de auditoria. |
| **dev** | `dev123` | `ROLE_DEV` | Acesso operacional padrão: consulta de inventário, solicitação de orquestrações e ações de desenvolvimento. Requer aprovação de Blast Radius para operações de alto impacto. |
| **observer** | `observer123` | `ROLE_OBSERVER` | Acesso estritamente somente leitura (*Read-Only*): visualização de dashboards, custos e inventário. Todas as ações destrutivas ou aprovações são bloqueadas pelo sistema. |

### Endpoints de Autenticação
- `POST /api/v1/auth/login`: Autentica credenciais e emite token JWT com perfil e lista de permissões.
- `GET /api/v1/auth/me`: Valida token ativo e retorna dados do usuário autenticado.

---

## 🌐 Internacionalização (i18n)

A aplicação conta com suporte nativo e instantâneo a três idiomas:
1. **Português (Brasil)** — `pt`
2. **Inglês (Estados Unidos)** — `en`
3. **Espanhol (América Latina / Espanha)** — `es`

A troca é realizada através do seletor presente no cabeçalho superior e persiste a preferência no navegador do operador (`localStorage`).

---

## 🎨 Temas Visuais da Aplicação

O operador pode alternar entre três modos de fundo e contraste:
1. **Dark (Slate Profundo)**: Fundo escuro balanceado (`#020617`), ideal para operações contínuas em ambientes NOC / Cloud Ops.
2. **Midnight (Azul Noturno)**: Fundo azul-marinho profundo (`#0b0f19`) com realces em índigo e contraste intermediário.
3. **Light (Claro Corporativo)**: Fundo cinza-claro corporativo (`#f1f5f9`), com bordas nítidas e máxima legibilidade sob luz natural.

---

## ☁️ Cadastro e Configuração Dinâmica de Provedores de Nuvem

Através do botão **"+ Adicionar Nuvem"** (disponível no cabeçalho e nos painéis de visão geral e configurações), o operador pode conectar novas contas de nuvem com:
- **Seleção do Provedor**: AWS, Microsoft Azure, Google Cloud (GCP), Oracle Cloud (OCI), Alibaba Cloud, IBM Cloud ou Provedor Personalizado (OpenStack, VMware, etc.).
- **Região Padrão**: Definição da região primária de implantação.
- **Seleção Granular de Recursos (via Checkbox)**: Permite habilitar/desabilitar serviços específicos conforme disponibilidade da conta (Computação / VMs, Armazenamento de Objetos, Bancos de Dados Relacionais, Redes Virtuais / VPC, Funções Serverless, Segurança & IAM, Clusters Kubernetes).
- **Campos Dinâmicos de Configuração**: O formulário adapta automaticamente os campos de entrada conforme o provedor selecionado (ex: Access Key / Secret Key para AWS; Tenant ID, Client ID e Secret para Azure; Project ID e JSON Key para GCP; Tenancy OCID e Fingerprint para OCI).

---

## 🔒 Auditoria de Segurança & Decisões Arquiteturais (ADRs)

A documentação detalhada das decisões técnicas e auditoria de vulnerabilidades está em `/docs/`:
- `docs/audit/SECURITY_AND_ARCHITECTURE_AUDIT.md`: Relatório de auditoria de segurança, vulnerabilidades do repositório base e plano de ação de produção.
- `docs/adrs/ADR-001-migration-to-springboot-and-react.md`: Migração da pilha legada para Spring Boot e React.
- `docs/adrs/ADR-002-multi-cloud-provider-abstraction-layer.md`: Camada desacoplada de adaptadores de nuvem.
- `docs/adrs/ADR-003-ai-agent-tool-calling-and-safety-guardrails.md`: Proteção contra execuções destrutivas com cálculo de *Blast Radius*.
- `docs/adrs/ADR-004-rbac-and-security-audit-compliance.md`: Trilha de auditoria criptográfica e perfis de acesso.
- `docs/adrs/ADR-005-production-deployment-and-observability.md`: Estratégia de observabilidade, métricas e telemetria.

---

## 🚀 Como Executar

### 1. Aplicação Completa (Frontend React 19 + Gateway na Porta 3000)
```bash
npm install
npm run dev
```
Acesse `http://localhost:3000`.

### 2. Microserviço Backend Spring Boot 3.3 (Porta 8080)
```bash
cd backend-springboot
mvn clean package -DskipTests
java -jar target/ai-multicloud-agent-backend-1.0.0.jar
```
Ou com Docker Compose:
```bash
cd backend-springboot
docker-compose up -d
```
