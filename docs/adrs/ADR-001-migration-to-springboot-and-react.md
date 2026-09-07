# ADR-001: Migração da Arquitetura para Spring Boot e React

## Status
Aceito (Accepted)

## Contexto
O projeto original utilizava uma implementação experimental em Python com FastMCP, Typer CLI e uma interface Streamlit rudimentar com componentes não integrados. Em cenários corporativos que demandam alta concorrência, tipagem estrita, integração com sistemas legados, observabilidade avançada e conformidade de governança corporativa, o ecossistema anterior apresentava gargalos significativos de manutenibilidade e segurança.

## Decisão
1. **Backend**: Adotar **Java 21 / Spring Boot 3.3+** como fundação enterprise do backend. O Spring Boot oferece:
   - Gerenciamento robusto de transações e injeção de dependências.
   - Ecossistema maduro para segurança corporativa (Spring Security, JWT, OAuth2).
   - SDKs oficiais e estáveis para os quatro grandes provedores de nuvem (AWS Java SDK v2, Azure SDK for Java, Google Cloud Client Libraries, OCI Java SDK).
   - Observabilidade nativa através do Spring Boot Actuator e Micrometer.
2. **Frontend**: Adotar **React 19 com TypeScript e Tailwind CSS**, permitindo:
   - Renderização reativa de alto desempenho para monitoramento em tempo real.
   - Interface com experiência de usuário superior, modularidade de componentes e responsividade.
   - Separação clara entre a lógica de apresentação e a orquestração de nuvem.

## Consequências
- **Positivas**:
  - Segurança enterprise e conformidade com auditorias de TI.
  - Tipagem forte ponta a ponta eliminando erros de runtime em operações críticas de nuvem.
  - UI moderna, fluida e amigável para operadores de SRE e FinOps.
- **Mitigações**:
  - Para garantir a execução imediata em contêineres de desenvolvimento e ambientes leves, o sistema inclui um runtime server-side integrado em Node/Express compatível com as mesmas rotas do Spring Boot.
