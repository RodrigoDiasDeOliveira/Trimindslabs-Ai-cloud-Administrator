package com.multicloud.agent.controller;

import com.multicloud.agent.dto.ProviderStatusDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/v1/providers")
@CrossOrigin(origins = "*")
public class ProviderHealthController {

    private final List<ProviderStatusDto> providers = new CopyOnWriteArrayList<>(List.of(
            ProviderStatusDto.builder().provider("AWS").status("NOT_CONFIGURED").defaultRegion("us-east-1").activeResourcesCount(0).latencyMs(0).credentialsValid(false).availableServices(List.of("EC2","S3","RDS","VPC","IAM","Lambda")).build(),
            ProviderStatusDto.builder().provider("AZURE").status("NOT_CONFIGURED").defaultRegion("eastus").activeResourcesCount(0).latencyMs(0).credentialsValid(false).availableServices(List.of("Virtual Machines","Blob Storage","Azure SQL","VNet")).build(),
            ProviderStatusDto.builder().provider("GCP").status("NOT_CONFIGURED").defaultRegion("us-central1").activeResourcesCount(0).latencyMs(0).credentialsValid(false).availableServices(List.of("Compute Engine","Cloud Storage","Cloud SQL","GKE")).build(),
            ProviderStatusDto.builder().provider("OCI").status("NOT_CONFIGURED").defaultRegion("sa-saopaulo-1").activeResourcesCount(0).latencyMs(0).credentialsValid(false).availableServices(List.of("Compute","Object Storage","Autonomous DB","VCN")).build()
    ));

    @GetMapping("/status")
    public ResponseEntity<List<ProviderStatusDto>> getProviderStatus() {
        return ResponseEntity.ok(providers);
    }

    @PostMapping("/add")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addProvider(@RequestBody Map<String, Object> payload) {
        String provider = String.valueOf(payload.getOrDefault("provider", "CUSTOM_CLOUD")).toUpperCase();
        String region = String.valueOf(payload.getOrDefault("region", "global"));
        @SuppressWarnings("unchecked")
        List<String> services = (List<String>) payload.getOrDefault("selectedServices", List.of());

        ProviderStatusDto newProvider = ProviderStatusDto.builder()
                .provider(provider)
                .status("NOT_CONFIGURED")
                .defaultRegion(region)
                .activeResourcesCount(0)
                .latencyMs(0)
                .credentialsValid(false)
                .availableServices(services)
                .build();

        providers.removeIf(p -> p.getProvider().equalsIgnoreCase(provider));
        providers.add(newProvider);

        return ResponseEntity.ok(Map.of(
                "status", "REGISTERED_NOT_CONFIGURED",
                "message", "Provider registered without fabricated health or resource state",
                "provider", newProvider
        ));
    }
}
