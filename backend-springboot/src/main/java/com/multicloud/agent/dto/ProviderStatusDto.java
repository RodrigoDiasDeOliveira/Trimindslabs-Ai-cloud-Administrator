package com.multicloud.agent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderStatusDto {
    private String provider;
    private String status; // HEALTHY, CONNECTED, DEGRADED, NOT_CONFIGURED
    private String defaultRegion;
    private int activeResourcesCount;
    private long latencyMs;
    private boolean credentialsValid;
    private List<String> availableServices;
}
