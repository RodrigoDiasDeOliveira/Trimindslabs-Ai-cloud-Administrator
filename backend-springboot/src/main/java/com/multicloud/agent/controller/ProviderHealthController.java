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
            ProviderStatusDto.builder()
                    .provider("AWS")
                    .status("HEALTHY")
                    .defaultRegion("us-east-1")
                    .activeResourcesCount(14)
                    .latencyMs(42)
                    .credentialsValid(true)
                    .availableServices(List.of("EC2", "S3", "RDS", "VPC", "IAM", "Lambda"))
                    .build(),
            ProviderStatusDto.builder()
                    .provider("AZURE")
                    .status("HEALTHY")
                    .defaultRegion("eastus")
                    .activeResourcesCount(8)
                    .latencyMs(56)
                    .credentialsValid(true)
                    .availableServices(List.of("Virtual Machines", "Blob Storage", "Azure SQL", "VNet"))
                    .build(),
            ProviderStatusDto.builder()
                    .provider("GCP")
                    .status("HEALTHY")
                    .defaultRegion("us-central1")
                    .activeResourcesCount(11)
                    .latencyMs(38)
                    .credentialsValid(true)
                    .availableServices(List.of("Compute Engine", "Cloud Storage", "Cloud SQL", "GKE"))
                    .build(),
            ProviderStatusDto.builder()
                    .provider("OCI")
                    .status("HEALTHY")
                    .defaultRegion("sa-saopaulo-1")
                    .activeResourcesCount(6)
                    .latencyMs(49)
                    .credentialsValid(true)
                    .availableServices(List.of("Compute", "Object Storage", "Autonomous DB", "VCN"))
                    .build()
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
        List<String> services = (List<String>) payload.getOrDefault("selectedServices", List.of("Compute", "Storage"));

        ProviderStatusDto newProvider = ProviderStatusDto.builder()
                .provider(provider)
                .status("HEALTHY")
                .defaultRegion(region)
                .activeResourcesCount(services.size())
                .latencyMs((int) (Math.random() * 40 + 25))
                .credentialsValid(true)
                .availableServices(services)
                .build();

        providers.removeIf(p -> p.getProvider().equalsIgnoreCase(provider));
        providers.add(newProvider);

        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Provedor " + provider + " cadastrado com sucesso via Spring Boot Security",
                "provider", newProvider
        ));
    }
}
