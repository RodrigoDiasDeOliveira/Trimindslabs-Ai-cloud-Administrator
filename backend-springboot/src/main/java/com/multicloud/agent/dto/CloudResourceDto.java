package com.multicloud.agent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CloudResourceDto {
    private String id;
    private String name;
    private String provider; // AWS, AZURE, GCP, OCI
    private String category; // COMPUTE, STORAGE, DATABASE, NETWORKING, SECURITY
    private String resourceType; // e.g. "EC2 Instance", "S3 Bucket", "Cloud SQL"
    private String status; // RUNNING, STOPPED, PROVISIONING, DEGRADED
    private String region;
    private Double estimatedMonthlyCost;
    private Map<String, String> tags;
    private String securityPosture; // SECURE, WARNING, NON_COMPLIANT
    private String nativeArnOrId;
}
