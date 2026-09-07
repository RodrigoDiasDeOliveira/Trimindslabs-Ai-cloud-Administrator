package com.multicloud.agent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

public class AgentDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatRequest {
        private String prompt;
        private String sessionToken;
        private boolean autoApproveSafeActions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatResponse {
        private String reply;
        private String status; // SUCCESS, AWAITING_APPROVAL, FAILED
        private List<ToolCallDto> invokedTools;
        private BlastRadiusDto blastRadius;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ToolCallDto {
        private String toolName;
        private String provider;
        private Map<String, Object> arguments;
        private String result;
        private boolean success;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlastRadiusDto {
        private String riskLevel; // LOW, MEDIUM, CRITICAL
        private boolean requiresApproval;
        private String description;
        private List<String> affectedResources;
        private String confirmationToken;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExecuteToolRequest {
        private String toolName;
        private String provider;
        private Map<String, Object> parameters;
        private String confirmationToken;
    }
}
