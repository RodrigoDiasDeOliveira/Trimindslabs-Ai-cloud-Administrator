import { CloudResource, IacFile, PolicyViolation, OpaEvaluationResult } from '../types';

/**
 * Open Policy Agent (OPA) / Gatekeeper Style Policy Engine
 * Evaluates infrastructure changes, configurations, and active resources against security & FinOps rules.
 */
export class OpaPolicyEngine {
  private static COMPLIANT_REGIONS = [
    'us-east-1', 'us-west-2', 'sa-east-1',
    'eastus', 'brazilsouth',
    'us-central1', 'southamerica-east1',
    'sa-saopaulo-1', 'us-ashburn-1', 'global'
  ];

  /**
   * Evaluates a cloud resource or provisioning plan
   */
  static evaluateResource(resource: Partial<CloudResource>): OpaEvaluationResult {
    const violations: PolicyViolation[] = [];

    // OPA-SEC-001: Check for open ingress / unencrypted ports
    const nameLower = (resource.name || '').toLowerCase();
    const typeLower = (resource.resourceType || '').toLowerCase();

    // OPA-SEC-002: Mandatory encryption at rest
    if (resource.category === 'STORAGE' || resource.category === 'DATABASE') {
      const hasEncryption = resource.tags?.['Encryption']?.includes('KMS') ||
        resource.tags?.['Compliance']?.includes('SOC2') ||
        nameLower.includes('kms') ||
        nameLower.includes('encrypted') ||
        resource.securityPosture === 'SECURE';

      if (!hasEncryption) {
        violations.push({
          policyId: 'OPA-SEC-002',
          policyName: 'Criptografia em Repouso Mandatória (CMEK / KMS / SSE)',
          severity: 'HIGH',
          message: `O recurso ${resource.name || 'alvo'} (${resource.category}) não possui tag ou configuração explícita de chave criptográfica KMS gerenciada.`,
          resourceName: resource.name
        });
      }
    }

    // OPA-FIN-001: Budget Guardrail ($500 cap)
    if (resource.estimatedMonthlyCost && resource.estimatedMonthlyCost > 500) {
      violations.push({
        policyId: 'OPA-FIN-001',
        policyName: 'Limite de Orçamento por Recurso Individual (Cap $500/mês)',
        severity: 'MEDIUM',
        message: `O custo mensal estimado de $${resource.estimatedMonthlyCost.toFixed(2)} excede o teto padrão de $500 sem prévia aprovação de FinOps.`,
        resourceName: resource.name
      });
    }

    // OPA-TAG-001: Mandatory Tagging Schema (Environment, Owner)
    const tags = resource.tags || {};
    if (!tags['Environment'] || (!tags['Owner'] && !tags['CostCenter'] && !tags['Department'])) {
      violations.push({
        policyId: 'OPA-TAG-001',
        policyName: 'Padrão Corporativo de Tagging Mandatório',
        severity: 'LOW',
        message: `Faltam tags obrigatórias de governança (Environment e Owner/Department) no recurso ${resource.name}.`,
        resourceName: resource.name
      });
    }

    // OPA-GEO-001: Multi-cloud Region Geo-fencing
    if (resource.region && !this.COMPLIANT_REGIONS.includes(resource.region.toLowerCase())) {
      violations.push({
        policyId: 'OPA-GEO-001',
        policyName: 'Restrição de Localidade e Geo-fencing Multi-Cloud',
        severity: 'HIGH',
        message: `A região "${resource.region}" não faz parte da lista corporativa de zonas permitidas de compliance.`,
        resourceName: resource.name
      });
    }

    // Calculate score
    let score = 100;
    for (const v of violations) {
      if (v.severity === 'CRITICAL') score -= 30;
      else if (v.severity === 'HIGH') score -= 20;
      else if (v.severity === 'MEDIUM') score -= 10;
      else if (v.severity === 'LOW') score -= 5;
    }
    score = Math.max(0, score);

    return {
      allowed: violations.filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH').length === 0,
      violations,
      complianceScore: score,
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Evaluates IaC code (Terraform, YAML, JSON) using pattern inspection
   */
  static evaluateIacCode(iac: IacFile): OpaEvaluationResult {
    const violations: PolicyViolation[] = [];
    const content = iac.content || '';

    // OPA-SEC-001: Ingress 0.0.0.0/0 on port 22 or 3389
    const openSshRegex = /cidr_blocks\s*=\s*\[.*0\.0\.0\.0\/0.*\][\s\S]*?(from_port\s*=\s*22|to_port\s*=\s*22|3389)/i;
    const openIngressRegex = /0\.0\.0\.0\/0/g;

    if (openSshRegex.test(content) || (content.includes('0.0.0.0/0') && (content.includes('22') || content.includes('3389')))) {
      violations.push({
        policyId: 'OPA-SEC-001',
        policyName: 'Proibição de Ingress SSH/RDP Aberto para o Mundo (0.0.0.0/0)',
        severity: 'CRITICAL',
        message: 'Regra de Security Group ou Firewall permitindo acesso SSH (22) ou RDP (3389) irrestrito a partir da internet pública!',
        resourceName: iac.name
      });
    }

    // OPA-SEC-002: Check for unencrypted S3 / EBS / Disks
    if (content.includes('aws_s3_bucket') && !content.includes('server_side_encryption_configuration') && !content.includes('kms_master_key_id')) {
      violations.push({
        policyId: 'OPA-SEC-002',
        policyName: 'Criptografia em Repouso Mandatória para Armazenamento S3/Blob',
        severity: 'HIGH',
        message: 'Bucket declarado sem bloco explícito de criptografia SSE-KMS ou SSE-S3.',
        resourceName: iac.name
      });
    }

    // OPA-SEC-003: Public S3 ACL
    if (content.includes('acl = "public-read"') || content.includes('acl = "public-read-write"')) {
      violations.push({
        policyId: 'OPA-SEC-003',
        policyName: 'Bloqueio de Buckets com ACL Pública',
        severity: 'CRITICAL',
        message: 'Atributo acl = "public-read" detectado. Viola política de proteção de dados sensíveis!',
        resourceName: iac.name
      });
    }

    // OPA-TAG-001: Tagging verification in IaC
    if (!content.includes('tags =') && !content.includes('"Environment"') && !content.includes('labels:')) {
      violations.push({
        policyId: 'OPA-TAG-001',
        policyName: 'Padrão Mandatório de Tags no Código IaC',
        severity: 'LOW',
        message: 'A declaração do recurso não especifica o mapa corporativo de tags (Environment, Owner).',
        resourceName: iac.name
      });
    }

    let score = 100;
    for (const v of violations) {
      if (v.severity === 'CRITICAL') score -= 30;
      else if (v.severity === 'HIGH') score -= 20;
      else if (v.severity === 'MEDIUM') score -= 10;
      else if (v.severity === 'LOW') score -= 5;
    }
    score = Math.max(0, score);

    return {
      allowed: violations.filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH').length === 0,
      violations,
      complianceScore: score,
      evaluatedAt: new Date().toISOString()
    };
  }
}
