package com.multicloud.agent.controller;

import com.multicloud.agent.dto.AgentDtos;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/agent")
@CrossOrigin(origins = "*")
public class AgentOrchestratorController {

    @PostMapping("/chat")
    public ResponseEntity<AgentDtos.ChatResponse> chat(@RequestBody AgentDtos.ChatRequest request) {
        String prompt = request.getPrompt() != null ? request.getPrompt().toLowerCase() : "";

        // Check for destructive actions
        boolean isDestructive = prompt.contains("stop") || prompt.contains("delete") || 
                                prompt.contains("terminate") || prompt.contains("destroy") ||
                                prompt.contains("parar") || prompt.contains("excluir");

        if (isDestructive && !request.isAutoApproveSafeActions()) {
            AgentDtos.BlastRadiusDto blastRadius = AgentDtos.BlastRadiusDto.builder()
                    .riskLevel("CRITICAL")
                    .requiresApproval(true)
                    .description("Tentativa de modificação/interrupção destrutiva de recurso de infraestrutura.")
                    .affectedResources(List.of("arn:aws:ec2:us-east-1:123456789012:instance/i-09ab7654321cd"))
                    .confirmationToken(UUID.randomUUID().toString())
                    .build();

            return ResponseEntity.ok(AgentDtos.ChatResponse.builder()
                    .reply("Ação com alto raio de impacto detectada. Por razões de governança e segurança (ADR-003), a interrupção requer aprovação manual do operador.")
                    .status("AWAITING_APPROVAL")
                    .invokedTools(Collections.emptyList())
                    .blastRadius(blastRadius)
                    .build());
        }

        // Standard tool execution response
        AgentDtos.ToolCallDto toolCall = AgentDtos.ToolCallDto.builder()
                .toolName("multi_cloud_resource_query")
                .provider("ALL")
                .arguments(Map.of("query", prompt))
                .result("Query executada com sucesso em 4 nuvens (AWS, Azure, GCP, OCI).")
                .success(true)
                .build();

        return ResponseEntity.ok(AgentDtos.ChatResponse.builder()
                .reply("Orquestração concluída. Foram avaliados recursos em AWS, Azure, Google Cloud e Oracle Cloud de acordo com as políticas de governança.")
                .status("SUCCESS")
                .invokedTools(List.of(toolCall))
                .build());
    }

    @PostMapping("/execute")
    public ResponseEntity<AgentDtos.ChatResponse> executeTool(@RequestBody AgentDtos.ExecuteToolRequest request) {
        AgentDtos.ToolCallDto toolCall = AgentDtos.ToolCallDto.builder()
                .toolName(request.getToolName())
                .provider(request.getProvider())
                .arguments(request.getParameters())
                .result("Comando executado com sucesso e registrado na trilha de auditoria.")
                .success(true)
                .build();

        return ResponseEntity.ok(AgentDtos.ChatResponse.builder()
                .reply("Operação confirmada e executada pelo agente.")
                .status("SUCCESS")
                .invokedTools(List.of(toolCall))
                .build());
    }
}
