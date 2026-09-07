# ADR-003: Orquestração de Agente de IA com Tool-Calling e Guardrails de Segurança

## Status
Aceito (Accepted)

## Contexto
Agentes de IA operando infraestrutura em nuvem correm o risco de:
1. Alucinar nomes de recursos ou IDs incorretos.
2. Executar ações destrutivas acidentais (exclusão de banco de dados, encerramento de nós de produção, alteração indiscriminada de Security Groups).
3. Provocar custos descontrolados através de provisionamentos superdimensionados.

## Decisão
1. **Tool Calling Estruturado**: O agente utiliza chamadas de função com tipagem estrita de parâmetros JSON.
2. **Blast Radius Calculator**: Cada ferramenta recebe uma classificação de risco:
   - `LOW` (operações somente-leitura e diagnósticos): Executadas diretamente.
   - `MEDIUM` (criação de recursos isolados ou restarts): Executadas com log de auditoria prioritário.
   - `HIGH / CRITICAL` (parada de instâncias, deleção de volumes, destruição de buckets): Requerem aprovação explícita em 2 etapas pelo operador (*Human-in-the-Loop*).
3. **Dry-Run Engine**: O agente sempre projeta o impacto da operação antes de confirmar sua aplicação real.

## Consequências
- Prevenção ativa de incidentes de indisponibilidade causados por comandos imprecisos de IA.
- Transparência total para o operador de infraestrutura com relatório de risco antes da confirmação.
