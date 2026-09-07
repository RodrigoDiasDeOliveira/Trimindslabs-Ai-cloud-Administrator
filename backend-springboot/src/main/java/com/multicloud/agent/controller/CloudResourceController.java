package com.multicloud.agent.controller;

import com.multicloud.agent.dto.CloudResourceDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/resources")
@CrossOrigin(origins = "*")
public class CloudResourceController {

    @GetMapping
    public ResponseEntity<List<CloudResourceDto>> listResources(
            @RequestParam(required = false) String provider,
            @RequestParam(required = false) String category) {
        
        List<CloudResourceDto> resources = new ArrayList<>();

        // AWS EC2
        resources.add(CloudResourceDto.builder()
                .id("res-aws-01")
                .name("prod-api-cluster-node-01")
                .provider("AWS")
                .category("COMPUTE")
                .resourceType("EC2 t3.large")
                .status("RUNNING")
                .region("us-east-1")
                .estimatedMonthlyCost(67.20)
                .tags(Map.of("Environment", "Production", "Owner", "CoreOps"))
                .securityPosture("SECURE")
                .nativeArnOrId("i-0498a87b654c3210e")
                .build());

        // AWS S3
        resources.add(CloudResourceDto.builder()
                .id("res-aws-02")
                .name("enterprise-cold-backups-2026")
                .provider("AWS")
                .category("STORAGE")
                .resourceType("S3 Bucket")
                .status("RUNNING")
                .region("us-east-1")
                .estimatedMonthlyCost(24.50)
                .tags(Map.of("Compliance", "SOC2", "Tier", "GlacierInstant"))
                .securityPosture("SECURE")
                .nativeArnOrId("arn:aws:s3:::enterprise-cold-backups-2026")
                .build());

        // Azure VM
        resources.add(CloudResourceDto.builder()
                .id("res-az-01")
                .name("vm-fintech-gateway")
                .provider("AZURE")
                .category("COMPUTE")
                .resourceType("Virtual Machine Standard_D4s_v5")
                .status("RUNNING")
                .region("eastus")
                .estimatedMonthlyCost(142.35)
                .tags(Map.of("Department", "Finance", "SLA", "99.99"))
                .securityPosture("SECURE")
                .nativeArnOrId("/subscriptions/sub-az-prod/resourceGroups/rg-fintech/vms/vm-fintech-gateway")
                .build());

        // GCP Cloud SQL
        resources.add(CloudResourceDto.builder()
                .id("res-gcp-01")
                .name("gcp-pg-master-db")
                .provider("GCP")
                .category("DATABASE")
                .resourceType("Cloud SQL PostgreSQL 16")
                .status("RUNNING")
                .region("us-central1")
                .estimatedMonthlyCost(189.00)
                .tags(Map.of("DataClassification", "Confidential"))
                .securityPosture("SECURE")
                .nativeArnOrId("projects/multicloud-prod/instances/gcp-pg-master-db")
                .build());

        // OCI Compute
        resources.add(CloudResourceDto.builder()
                .id("res-oci-01")
                .name("oci-ai-inference-worker")
                .provider("OCI")
                .category("COMPUTE")
                .resourceType("VM.Standard.A1.Flex (4 OCPU, 24GB)")
                .status("RUNNING")
                .region("sa-saopaulo-1")
                .estimatedMonthlyCost(48.00)
                .tags(Map.of("Project", "LLM-Worker", "CostCenter", "AI-Lab"))
                .securityPosture("SECURE")
                .nativeArnOrId("ocid1.instance.oc1.sa-saopaulo-1.ab32fakeocid99214")
                .build());

        return ResponseEntity.ok(resources);
    }

    @PostMapping("/{id}/action")
    public ResponseEntity<Map<String, Object>> performAction(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        String action = payload.getOrDefault("action", "RESTART");
        return ResponseEntity.ok(Map.of(
                "resourceId", id,
                "action", action,
                "status", "SUCCESS",
                "message", "Ação " + action + " disparada com sucesso no provedor de nuvem."
        ));
    }
}
