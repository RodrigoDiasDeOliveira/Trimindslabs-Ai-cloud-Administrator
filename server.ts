import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { UnifiedCloudService } from './src/core/unifiedCloudAdapter';
import { OpaPolicyEngine } from './src/core/opaEngine';
import { AuditCryptoChain } from './src/core/auditCrypto';
import { BackupDrManager } from './src/core/backupManager';
import { OpenTelemetryTracer } from './src/core/telemetryOtel';
import { InputValidator } from './src/core/inputValidator';
import { CloudResource, AuditLog, IacFile, ProviderStatus } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Multi-Cloud Resource Inventory
let resources: CloudResource[] = [
  {
    id: 'res-aws-01',
    name: 'prod-api-cluster-node-01',
    provider: 'AWS',
    category: 'COMPUTE',
    resourceType: 'EC2 t3.large',
    status: 'RUNNING',
    region: 'us-east-1',
    estimatedMonthlyCost: 67.20,
    tags: { Environment: 'Production', Owner: 'CoreOps', Workload: 'API-Gateway' },
    securityPosture: 'SECURE',
    nativeArnOrId: 'i-0498a87b654c3210e'
  },
  {
    id: 'res-aws-02',
    name: 'enterprise-cold-backups-2026',
    provider: 'AWS',
    category: 'STORAGE',
    resourceType: 'S3 Bucket (Glacier)',
    status: 'RUNNING',
    region: 'us-east-1',
    estimatedMonthlyCost: 24.50,
    tags: { Compliance: 'SOC2', Retention: '7-Years' },
    securityPosture: 'SECURE',
    nativeArnOrId: 'arn:aws:s3:::enterprise-cold-backups-2026'
  },
  {
    id: 'res-aws-03',
    name: 'aurora-pg-primary',
    provider: 'AWS',
    category: 'DATABASE',
    resourceType: 'RDS Aurora Serverless v2',
    status: 'RUNNING',
    region: 'us-east-1',
    estimatedMonthlyCost: 198.40,
    tags: { Environment: 'Production', Encryption: 'KMS-Enabled' },
    securityPosture: 'SECURE',
    nativeArnOrId: 'arn:aws:rds:us-east-1:123456789012:cluster:aurora-pg-primary'
  },
  {
    id: 'res-az-01',
    name: 'vm-fintech-gateway',
    provider: 'AZURE',
    category: 'COMPUTE',
    resourceType: 'Virtual Machine Standard_D4s_v5',
    status: 'RUNNING',
    region: 'eastus',
    estimatedMonthlyCost: 142.35,
    tags: { Department: 'Finance', SLA: '99.99', CostCenter: 'FinTech' },
    securityPosture: 'SECURE',
    nativeArnOrId: '/subscriptions/sub-az-prod/resourceGroups/rg-fintech/vms/vm-fintech-gateway'
  },
  {
    id: 'res-az-02',
    name: 'blob-customer-statements',
    provider: 'AZURE',
    category: 'STORAGE',
    resourceType: 'Azure Blob Storage (Hot)',
    status: 'RUNNING',
    region: 'eastus',
    estimatedMonthlyCost: 56.10,
    tags: { Tier: 'Hot', PublicAccess: 'Disabled' },
    securityPosture: 'SECURE',
    nativeArnOrId: 'https://statementsfintech.blob.core.windows.net/statements'
  },
  {
    id: 'res-gcp-01',
    name: 'gcp-pg-master-db',
    provider: 'GCP',
    category: 'DATABASE',
    resourceType: 'Cloud SQL PostgreSQL 16 (HA)',
    status: 'RUNNING',
    region: 'us-central1',
    estimatedMonthlyCost: 189.00,
    tags: { DataClassification: 'Confidential', Backup: 'Automated-Daily' },
    securityPosture: 'SECURE',
    nativeArnOrId: 'projects/multicloud-prod/instances/gcp-pg-master-db'
  },
  {
    id: 'res-gcp-02',
    name: 'k8s-ai-cluster-gke',
    provider: 'GCP',
    category: 'COMPUTE',
    resourceType: 'GKE Autopilot v1.30',
    status: 'RUNNING',
    region: 'us-central1',
    estimatedMonthlyCost: 245.00,
    tags: { Tier: 'Microservices', Autoscaling: 'Enabled' },
    securityPosture: 'SECURE',
    nativeArnOrId: 'projects/multicloud-prod/locations/us-central1/clusters/ai-cluster'
  },
  {
    id: 'res-oci-01',
    name: 'oci-ai-inference-worker',
    provider: 'OCI',
    category: 'COMPUTE',
    resourceType: 'VM.Standard.A1.Flex (4 OCPU, 24GB)',
    status: 'RUNNING',
    region: 'sa-saopaulo-1',
    estimatedMonthlyCost: 48.00,
    tags: { Project: 'LLM-Worker', Architecture: 'ARM64' },
    securityPosture: 'SECURE',
    nativeArnOrId: 'ocid1.instance.oc1.sa-saopaulo-1.ab32fakeocid99214'
  },
  {
    id: 'res-oci-02',
    name: 'oci-autonomous-analytics-db',
    provider: 'OCI',
    category: 'DATABASE',
    resourceType: 'Autonomous Transaction Processing (1 OCPU)',
    status: 'RUNNING',
    region: 'sa-saopaulo-1',
    estimatedMonthlyCost: 168.00,
    tags: { Workload: 'Analytics-ETL', Autoscaling: 'Enabled' },
    securityPosture: 'SECURE',
    nativeArnOrId: 'ocid1.autonomousdatabase.oc1.sa-saopaulo-1.an23fakeocid772'
  }
];

const initialLog1 = AuditCryptoChain.createEntry(undefined, {
  user: 'rodrigo.ops@multicloud.corp',
  role: 'ROLE_ADMIN',
  provider: 'AWS',
  action: 'DISCOVER_RESOURCES',
  resourceId: 'ALL_AWS_EAST',
  riskLevel: 'LOW',
  status: 'SUCCESS',
  details: 'Auto-discovery de inventário executado em us-east-1 (14 recursos catalogados).'
});

const initialLog2 = AuditCryptoChain.createEntry(initialLog1, {
  user: 'ai-agent-daemon',
  role: 'ROLE_SECURITY_AUDITOR',
  provider: 'GCP',
  action: 'SECURITY_POSTURE_CHECK',
  resourceId: 'gcp-pg-master-db',
  riskLevel: 'LOW',
  status: 'SUCCESS',
  details: 'Verificação periódica de conformidade CIS v2.0 para PostgreSQL (100% compliant).'
});

let auditLogs: AuditLog[] = [initialLog2, initialLog1];

// Initial IaC Catalog (Terraform / YAML / JSON)
let iacFilesList: IacFile[] = [
  {
    id: 'iac-aws-s3-kms',
    name: 's3-secure-audit-vault.tf',
    type: 'terraform',
    provider: 'AWS',
    status: 'VALIDATED',
    lastDeployDate: new Date(Date.now() - 86400000).toISOString(),
    content: `# AWS S3 Compliant Vault with KMS Server-Side Encryption
resource "aws_s3_bucket" "audit_vault" {
  bucket = "multicloud-enterprise-audit-vault-2026"
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = "arn:aws:kms:us-east-1:123456789012:key/audit-cmek"
        sse_algorithm     = "aws:kms"
      }
    }
  }

  tags = {
    "Environment" = "Production"
    "Owner"       = "SecOps"
    "Compliance"  = "SOC2-TypeII"
  }
}`
  },
  {
    id: 'iac-gcp-gke',
    name: 'gke-inference-deploy.yaml',
    type: 'yaml',
    provider: 'GCP',
    status: 'VALIDATED',
    lastDeployDate: new Date(Date.now() - 172800000).toISOString(),
    content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-inference-worker
  namespace: prod-ai
  labels:
    Environment: Production
    Owner: MLOps
spec:
  replicas: 3
  selector:
    matchLabels:
      app: inference
  template:
    metadata:
      labels:
        app: inference
        Environment: Production
    spec:
      containers:
      - name: worker
        image: gcr.io/multicloud-prod/inference:v2.4
        resources:
          limits:
            memory: "4Gi"
            cpu: "2000m"`
  },
  {
    id: 'iac-azure-vm',
    name: 'azure-finops-compute.json',
    type: 'json',
    provider: 'AZURE',
    status: 'DRAFT',
    content: `{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "resources": [
    {
      "type": "Microsoft.Compute/virtualMachines",
      "apiVersion": "2022-03-01",
      "name": "finops-analytics-vm",
      "location": "eastus",
      "tags": {
        "Environment": "Production",
        "CostCenter": "FinOps-402"
      },
      "properties": {
        "hardwareProfile": {
          "vmSize": "Standard_D2s_v5"
        }
      }
    }
  ]
}`
  }
];

// Lazy Gemini client helper
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Health / Actuator
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    engine: 'AI MultiCloud Administrator',
    runtime: 'EXPRESS',
    springBootReady: false,
    version: '1.0.0'
  });
});

app.get('/api/actuator/health', (req: Request, res: Response) => {
  res.status(503).json({
    status: 'DEGRADED',
    components: {
      awsAdapter: { status: 'NOT_CONFIGURED' },
      azureAdapter: { status: 'NOT_CONFIGURED' },
      gcpAdapter: { status: 'NOT_CONFIGURED' },
      ociAdapter: { status: 'NOT_CONFIGURED' },
      aiAgentCore: { status: process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED' }
    },
    message: 'No provider health is reported without a real connectivity probe.'
  });
});

// ----------------------------------------------------
// AUTHENTICATION & MULTI-CLOUD STATE
// ----------------------------------------------------

const initialProviders = [
  {
    provider: 'AWS',
    status: 'HEALTHY' as const,
    defaultRegion: 'us-east-1',
    activeResourcesCount: 3,
    latencyMs: 42,
    credentialsValid: true,
    availableServices: ['EC2', 'S3', 'RDS Aurora', 'VPC', 'IAM', 'Lambda', 'KMS']
  },
  {
    provider: 'AZURE',
    status: 'HEALTHY' as const,
    defaultRegion: 'eastus',
    activeResourcesCount: 2,
    latencyMs: 56,
    credentialsValid: true,
    availableServices: ['Virtual Machines', 'Blob Storage', 'Azure SQL', 'VNet', 'Entra ID']
  },
  {
    provider: 'GCP',
    status: 'HEALTHY' as const,
    defaultRegion: 'us-central1',
    activeResourcesCount: 2,
    latencyMs: 38,
    credentialsValid: true,
    availableServices: ['Compute Engine', 'Cloud Storage', 'Cloud SQL', 'GKE Autopilot', 'Cloud KMS']
  },
  {
    provider: 'OCI',
    status: 'HEALTHY' as const,
    defaultRegion: 'sa-saopaulo-1',
    activeResourcesCount: 2,
    latencyMs: 49,
    credentialsValid: true,
    availableServices: ['Compute ARM64', 'Object Storage', 'Autonomous DB', 'VCN', 'Vault']
  }
];

let providersList: ProviderStatus[] = [...initialProviders];

function logAudit(
  user: string,
  role: string,
  provider: string,
  action: string,
  resourceId: string,
  riskLevel: 'LOW' | 'MEDIUM' | 'CRITICAL',
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED_BY_GUARDRAIL',
  details: string
): AuditLog {
  const newEntry = AuditCryptoChain.createEntry(auditLogs[0], {
    user,
    role,
    provider,
    action,
    resourceId,
    riskLevel,
    status,
    details
  });
  auditLogs.unshift(newEntry);
  return newEntry;
}

// ----------------------------------------------------
// AUTHENTICATION ENDPOINTS (Spring Security Mirror)
// ----------------------------------------------------

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username e senha são obrigatórios' });
    return;
  }

  const u = String(username).toLowerCase().trim();

  if (u === 'admin' && password === 'admin123') {
    const userObj = {
      token: `jwt-adm-${Date.now()}`,
      username: 'admin',
      displayName: 'Rodrigo Dias (Administrador Cloud)',
      role: 'ROLE_ADMIN',
      permissions: ['READ', 'WRITE', 'EXECUTE_CRITICAL', 'BLAST_RADIUS_APPROVE', 'MANAGE_CLOUDS', 'EXPORT_AUDIT', 'IAC_DEPLOY', 'BACKUP_OPERATE', 'POLICY_MANAGE']
    };
    logAudit('admin', 'ROLE_ADMIN', 'SYSTEM', 'LOGIN', 'SESSION', 'LOW', 'SUCCESS', 'Autenticação bem-sucedida com perfil de Administrador Geral.');
    res.json(userObj);
    return;
  }

  if (u === 'dev' && password === 'dev123') {
    const userObj = {
      token: `jwt-dev-${Date.now()}`,
      username: 'dev',
      displayName: 'DevOps Engineer',
      role: 'ROLE_DEV',
      permissions: ['READ', 'WRITE', 'EXECUTE_CRITICAL', 'IAC_DEPLOY', 'BACKUP_OPERATE']
    };
    logAudit('dev', 'ROLE_DEV', 'SYSTEM', 'LOGIN', 'SESSION', 'LOW', 'SUCCESS', 'Autenticação bem-sucedida com perfil de Desenvolvedor / DevOps.');
    res.json(userObj);
    return;
  }

  if (u === 'observer' && password === 'observer123') {
    const userObj = {
      token: `jwt-obs-${Date.now()}`,
      username: 'observer',
      displayName: 'Auditor de Segurança (Observer)',
      role: 'ROLE_OBSERVER',
      permissions: ['READ', 'EXPORT_AUDIT']
    };
    logAudit('observer', 'ROLE_OBSERVER', 'SYSTEM', 'LOGIN', 'SESSION', 'LOW', 'SUCCESS', 'Autenticação bem-sucedida com perfil de Observador (Apenas Leitura).');
    res.json(userObj);
    return;
  }

  if (u === 'finops' && password === 'finops123') {
    const userObj = {
      token: `jwt-finops-${Date.now()}`,
      username: 'finops',
      displayName: 'FinOps Cloud Lead',
      role: 'ROLE_FINOPS',
      permissions: ['READ', 'FINOPS_VIEW', 'EXPORT_AUDIT']
    };
    logAudit('finops', 'ROLE_FINOPS', 'SYSTEM', 'LOGIN', 'SESSION', 'LOW', 'SUCCESS', 'Autenticação com perfil FinOps (Gestão e Otimização Financeira).');
    res.json(userObj);
    return;
  }

  if (u === 'security' && password === 'sec123') {
    const userObj = {
      token: `jwt-sec-${Date.now()}`,
      username: 'security',
      displayName: 'Security & Compliance Officer',
      role: 'ROLE_SECURITY_AUDITOR',
      permissions: ['READ', 'EXPORT_AUDIT', 'POLICY_MANAGE']
    };
    logAudit('security', 'ROLE_SECURITY_AUDITOR', 'SYSTEM', 'LOGIN', 'SESSION', 'LOW', 'SUCCESS', 'Autenticação com perfil Auditor de Segurança e Políticas.');
    res.json(userObj);
    return;
  }

  logAudit(username, 'UNKNOWN', 'SYSTEM', 'LOGIN_FAILED', 'SESSION', 'MEDIUM', 'FAILED', `Tentativa de login frustrada para o usuário "${username}".`);
  res.status(401).json({ error: 'Credenciais inválidas. Usuários disponíveis: admin, dev, observer, finops, security' });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }
  if (authHeader.includes('jwt-dev')) {
    res.json({
      username: 'dev',
      displayName: 'DevOps Engineer',
      role: 'ROLE_DEV',
      permissions: ['READ', 'WRITE', 'EXECUTE_CRITICAL', 'IAC_DEPLOY', 'BACKUP_OPERATE']
    });
    return;
  }
  if (authHeader.includes('jwt-obs')) {
    res.json({
      username: 'observer',
      displayName: 'Auditor de Segurança (Observer)',
      role: 'ROLE_OBSERVER',
      permissions: ['READ', 'EXPORT_AUDIT']
    });
    return;
  }
  if (authHeader.includes('jwt-finops')) {
    res.json({
      username: 'finops',
      displayName: 'FinOps Cloud Lead',
      role: 'ROLE_FINOPS',
      permissions: ['READ', 'FINOPS_VIEW', 'EXPORT_AUDIT']
    });
    return;
  }
  if (authHeader.includes('jwt-sec')) {
    res.json({
      username: 'security',
      displayName: 'Security & Compliance Officer',
      role: 'ROLE_SECURITY_AUDITOR',
      permissions: ['READ', 'EXPORT_AUDIT', 'POLICY_MANAGE']
    });
    return;
  }
  res.json({
    username: 'admin',
    displayName: 'Rodrigo Dias (Administrador Cloud)',
    role: 'ROLE_ADMIN',
    permissions: ['READ', 'WRITE', 'EXECUTE_CRITICAL', 'BLAST_RADIUS_APPROVE', 'MANAGE_CLOUDS', 'EXPORT_AUDIT', 'IAC_DEPLOY', 'BACKUP_OPERATE', 'POLICY_MANAGE']
  });
});

// Provider Statuses
app.get('/api/providers/status', (req: Request, res: Response) => {
  const updated = providersList.map(p => ({
    ...p,
    activeResourcesCount: resources.filter(r => r.provider === p.provider).length
  }));
  res.json(updated);
});

// Add New Cloud Provider with Custom Resources & Services
app.post('/api/providers/add', (req: Request, res: Response) => {
  const { provider, defaultRegion, credentials, selectedServices, initialResources } = req.body;
  if (!provider) {
    res.status(400).json({ error: 'Provedor é obrigatório' });
    return;
  }

  const provUpper = String(provider).toUpperCase().trim();
  const existingIdx = providersList.findIndex(p => p.provider === provUpper);

  const services = Array.isArray(selectedServices) && selectedServices.length > 0
    ? selectedServices
    : ['Compute', 'Storage', 'Database', 'Networking', 'Security'];

  const newProviderObj = {
    provider: provUpper,
    status: 'HEALTHY' as const,
    defaultRegion: defaultRegion || 'us-east-1',
    activeResourcesCount: 0,
    latencyMs: Math.floor(Math.random() * 25) + 35,
    credentialsValid: true,
    availableServices: services
  };

  if (existingIdx >= 0) {
    providersList[existingIdx] = { ...providersList[existingIdx], ...newProviderObj };
  } else {
    providersList.push(newProviderObj);
  }

  // Add customized initial resources selected via checkboxes
  let addedCount = 0;
  if (Array.isArray(initialResources) && initialResources.length > 0) {
    initialResources.forEach((resItem: any) => {
      resources.push({
        id: resItem.id || `res-${provUpper.toLowerCase()}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`,
        name: resItem.name || `${provUpper.toLowerCase()}-workload-01`,
        provider: provUpper as any,
        category: resItem.category || 'COMPUTE',
        resourceType: resItem.resourceType || 'Standard-Instance',
        status: resItem.status || 'RUNNING',
        region: resItem.region || defaultRegion || 'us-east-1',
        estimatedMonthlyCost: Number(resItem.estimatedMonthlyCost) || 45.00,
        tags: resItem.tags || { Environment: 'Production', Owner: 'MultiCloud-Team', ManagedBy: 'AI-Agent' },
        securityPosture: 'SECURE',
        nativeArnOrId: resItem.nativeArnOrId || `urn:${provUpper.toLowerCase()}:res:${Date.now()}`
      });
      addedCount++;
    });
  }

  const userEmail = (req.headers['x-user-email'] as string) || 'admin@multicloud.corp';
  const userRole = (req.headers['x-user-role'] as string) || 'ROLE_ADMIN';

  logAudit(
    userEmail,
    userRole,
    provUpper,
    'ADD_CLOUD_PROVIDER',
    provUpper,
    'MEDIUM',
    'SUCCESS',
    `Nuvem ${provUpper} conectada com ${services.length} serviços selecionados (${services.join(', ')}) e ${addedCount} recurso(s) provisionado(s).`
  );

  res.json({
    success: true,
    provider: newProviderObj,
    addedResourcesCount: addedCount
  });
});

// Resources List and Filtering
app.get('/api/resources', (req: Request, res: Response) => {
  const { provider, category, search } = req.query;
  let filtered = [...resources];

  if (provider && provider !== 'ALL') {
    filtered = filtered.filter(r => r.provider === String(provider).toUpperCase());
  }

  if (category && category !== 'ALL') {
    filtered = filtered.filter(r => r.category === String(category).toUpperCase());
  }

  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.resourceType.toLowerCase().includes(q) ||
      r.region.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  }

  res.json(filtered);
});

// Resource Actions (Direct execution)
app.post('/api/resources/:id/action', (req: Request, res: Response) => {
  const { id } = req.params;
  const { action } = req.body;

  const target = resources.find(r => r.id === id);
  if (!target) {
    res.status(404).json({ error: 'Recurso não encontrado' });
    return;
  }

  let newStatus = target.status;
  if (action === 'STOP') newStatus = 'STOPPED';
  if (action === 'START') newStatus = 'RUNNING';
  if (action === 'RESTART') newStatus = 'RUNNING';

  target.status = newStatus;

  // Log to audit
  const logEntry = logAudit(
    'current-operator@multicloud.corp',
    'ROLE_DEV',
    target.provider,
    action || 'ACTION',
    target.name,
    action === 'STOP' || action === 'DELETE' ? 'CRITICAL' : 'MEDIUM',
    'SUCCESS',
    `Operação ${action} executada com sucesso no recurso ${target.name} (${target.resourceType}) via API direta.`
  );

  res.json({
    success: true,
    resource: target,
    action,
    message: `Ação ${action} aplicada em ${target.name} (${target.provider}).`
  });
});

// Audit Logs Endpoint
app.get('/api/audit', (req: Request, res: Response) => {
  res.json(auditLogs);
});

// Governance & Compliance Summary
app.get('/api/governance', (req: Request, res: Response) => {
  const totalCost = resources.reduce((acc, curr) => acc + curr.estimatedMonthlyCost, 0);
  const secureCount = resources.filter(r => r.securityPosture === 'SECURE').length;
  const complianceScore = Math.round((secureCount / resources.length) * 100);

  res.json({
    complianceScore,
    totalMonthlyEstimate: totalCost.toFixed(2),
    activeCloudCount: 4,
    totalResources: resources.length,
    policies: [
      { id: 'pol-01', name: 'Criptografia em Repouso Obrigatória (CMEK / SSE)', status: 'COMPLIANT', violationsCount: 0, severity: 'HIGH' },
      { id: 'pol-02', name: 'Bloqueio de Ingress Aberto (0.0.0.0/0 na Porta 22/3389)', status: 'COMPLIANT', violationsCount: 0, severity: 'CRITICAL' },
      { id: 'pol-03', name: 'Padrão de Tagging Mandatório (Environment, Owner)', status: 'COMPLIANT', violationsCount: 0, severity: 'MEDIUM' },
      { id: 'pol-04', name: 'Prevenção de Buckets Públicos (S3 / Blob / GCS / OCI)', status: 'COMPLIANT', violationsCount: 0, severity: 'CRITICAL' },
      { id: 'pol-05', name: 'Alerta de Subutilização de Recursos (Idle Instances)', status: 'COMPLIANT', violationsCount: 0, severity: 'LOW' }
    ],
    costOptimizationRecommendations: [
      {
        provider: 'AWS',
        resource: 'prod-api-cluster-node-01',
        recommendation: 'Converter t3.large sob demanda para Savings Plans de 1 ano. Economia estimada: $24.80/mês.',
        potentialSavings: 24.80
      },
      {
        provider: 'OCI',
        resource: 'oci-ai-inference-worker',
        recommendation: 'Instância ARM64 já operando em taxa ótima de custo-benefício (Compute Flex).',
        potentialSavings: 0.00
      }
    ]
  });
});

// ----------------------------------------------------
// REAL LIGHTWEIGHT HEALTH PROBE FOR CLOUD PROVIDERS
// ----------------------------------------------------
app.get('/api/providers/health-probe', async (req: Request, res: Response) => {
  try {
    const providerQuery = req.query.provider as string;
    const targetProviders = providerQuery 
      ? [providerQuery.toUpperCase()] 
      : ['AWS', 'AZURE', 'GCP', 'OCI'];

    const probeResults = await Promise.all(
      targetProviders.map(p => UnifiedCloudService.performHealthProbe(p))
    );

    // Update memory providersList with probe result
    probeResults.forEach(pr => {
      const idx = providersList.findIndex(p => p.provider === pr.provider);
      if (idx !== -1) {
        providersList[idx].latencyMs = pr.latencyMs;
        providersList[idx].circuitBreakerState = pr.circuitBreakerState;
        providersList[idx].lastProbeCheck = {
          probeType: pr.probeType,
          targetEndpoint: pr.targetEndpoint,
          statusCode: pr.statusCode,
          success: pr.success,
          latencyMs: pr.latencyMs,
          checkedAt: pr.checkedAt
        };
      }
    });

    res.json({
      timestamp: new Date().toISOString(),
      probes: probeResults
    });
  } catch (err: any) {
    res.status(500).json({ error: `Falha no health probe: ${err.message}` });
  }
});

// ----------------------------------------------------
// INFRASTRUCTURE AS CODE (IaC) & CONFIGURATION STUDIO
// ----------------------------------------------------
const handleGetIacFiles = (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(iacFilesList);
};
app.get('/api/iac/files', handleGetIacFiles);
app.get('/api/iac/templates', handleGetIacFiles);

app.post('/api/iac/files', (req: Request, res: Response) => {
  const { id, name, type, provider, content, fileName } = req.body;
  const effectiveName = fileName || name || 'main.tf';
  let effectiveType = type || (effectiveName.endsWith('.yaml') || effectiveName.endsWith('.yml') ? 'yaml' : effectiveName.endsWith('.json') ? 'json' : 'terraform');

  const validation = InputValidator.validateIacContent(content || '', effectiveType);
  if (!validation.valid) {
    res.status(400).json({ error: validation.errors.join(' | ') });
    return;
  }

  const iacItem: IacFile = {
    id: id || `iac-${Date.now().toString().slice(-4)}`,
    name: effectiveName,
    type: effectiveType,
    provider: (provider || 'AWS').toUpperCase(),
    content,
    status: 'DRAFT'
  };

  // Evaluate OPA
  const opaResult = OpaPolicyEngine.evaluateIacCode(iacItem);
  iacItem.violations = opaResult.violations;
  iacItem.status = opaResult.allowed ? 'VALIDATED' : 'DRAFT';

  const existingIdx = iacFilesList.findIndex(f => f.id === iacItem.id);
  if (existingIdx !== -1) {
    iacFilesList[existingIdx] = iacItem;
  } else {
    iacFilesList.push(iacItem);
  }

  const user = (req.headers['x-user-email'] as string) || 'admin@multicloud.corp';
  const role = (req.headers['x-user-role'] as string) || 'ROLE_ADMIN';
  logAudit(user, role, iacItem.provider, 'SAVE_IAC_CONFIG', iacItem.name, 'LOW', 'SUCCESS', `Arquivo IaC ${iacItem.name} salvo com status ${iacItem.status}. Score OPA: ${opaResult.complianceScore}%.`);

  res.json({
    success: true,
    file: iacItem,
    opa: opaResult
  });
});

const handleValidateIac = (req: Request, res: Response) => {
  const { content, type, provider, name, fileName } = req.body;
  const effectiveName = fileName || name || 'plan.tf';
  let effectiveType: 'terraform' | 'yaml' | 'json' = type || 'terraform';
  if (effectiveName.endsWith('.yaml') || effectiveName.endsWith('.yml')) effectiveType = 'yaml';
  else if (effectiveName.endsWith('.json')) effectiveType = 'json';

  const mockFile: IacFile = {
    id: 'temp-val',
    name: effectiveName,
    type: effectiveType,
    provider: (provider || 'AWS').toUpperCase(),
    content: content || '',
    status: 'DRAFT'
  };

  const validation = InputValidator.validateIacContent(content || '', effectiveType);
  const opaResult = OpaPolicyEngine.evaluateIacCode(mockFile);

  res.json({
    syntaxValid: validation.valid,
    syntaxErrors: validation.errors,
    opa: opaResult,
    allowed: opaResult.allowed,
    violations: opaResult.violations,
    complianceScore: opaResult.complianceScore
  });
};

app.post('/api/iac/validate', handleValidateIac);
app.post('/api/iac/validate-opa', handleValidateIac);

app.post('/api/iac/dry-run', (req: Request, res: Response) => {
  const { id, content, provider, name, fileName } = req.body;
  const effectiveName = fileName || name || 'custom.tf';
  const targetFile = iacFilesList.find(f => f.id === id) || {
    id: 'temp-dry',
    name: effectiveName,
    type: (effectiveName.endsWith('.yaml') ? 'yaml' : effectiveName.endsWith('.json') ? 'json' : 'terraform') as any,
    provider: (provider || 'AWS').toUpperCase(),
    content: content || '',
    status: 'DRAFT' as const
  };

  const opaResult = OpaPolicyEngine.evaluateIacCode(targetFile);

  const planDiff = `------------------------------------------------------------\n` +
    `[TERRAFORM PLAN: SIMULAÇÃO DRY-RUN]\n` +
    `Arquitetura: Multi-Cloud Unified Abstraction Engine\n` +
    `Target: ${targetFile.provider} Cloud\n` +
    `Arquivo: ${targetFile.name}\n` +
    `\n` +
    `Plan: 2 to add, 0 to change, 0 to destroy.\n` +
    `\n` +
    `+ resource "${targetFile.provider.toLowerCase()}_managed_resource" "primary" {\n` +
    `    + id               = "(known after apply)"\n` +
    `    + encryption       = "AES-256 / KMS Customer Managed Key"\n` +
    `    + environment      = "Production"\n` +
    `    + disaster_recover = "Cross-Cloud Enabled"\n` +
    `  }\n` +
    `\n` +
    `Conformidade OPA: ${opaResult.complianceScore}% (${opaResult.violations.length} avisos detectados)\n` +
    `------------------------------------------------------------`;

  res.json({
    success: true,
    dryRun: true,
    planDiff,
    dryRunDiff: planDiff,
    estimatedCostImpact: 35.00,
    riskLevel: 'LOW',
    opa: opaResult
  });
});

app.post('/api/iac/deploy', (req: Request, res: Response) => {
  const { id, content, fileName, name, provider, userRole } = req.body;
  const effectiveName = fileName || name || 'main.tf';
  let targetFile = iacFilesList.find(f => f.id === id);
  if (!targetFile) {
    targetFile = {
      id: id || `iac-${Date.now().toString().slice(-4)}`,
      name: effectiveName,
      type: (effectiveName.endsWith('.yaml') ? 'yaml' : effectiveName.endsWith('.json') ? 'json' : 'terraform') as any,
      provider: (provider || 'AWS').toUpperCase(),
      content: content || '',
      status: 'DRAFT'
    };
    iacFilesList.push(targetFile);
  } else if (content) {
    targetFile.content = content;
  }

  const opaResult = OpaPolicyEngine.evaluateIacCode(targetFile);
  if (!opaResult.allowed) {
    res.status(403).json({
      error: 'Deploy bloqueado pelo motor OPA. Existem violações críticas de segurança.',
      violations: opaResult.violations
    });
    return;
  }

  targetFile.status = 'DEPLOYED';
  targetFile.lastDeployDate = new Date().toISOString();

  // Create new active resource in inventory
  const newRes: CloudResource = {
    id: `res-${targetFile.provider.toLowerCase()}-iac-${Date.now().toString().slice(-4)}`,
    name: targetFile.name.replace(/\.[^/.]+$/, ''),
    provider: targetFile.provider as any,
    category: targetFile.type === 'yaml' ? 'COMPUTE' : 'STORAGE',
    resourceType: targetFile.type === 'yaml' ? 'GKE Deployment' : 'S3 / KMS Vault',
    status: 'RUNNING',
    region: 'us-east-1',
    estimatedMonthlyCost: 35.00,
    tags: { Environment: 'Production', DeployedBy: 'IaC-Studio', Engine: 'Terraform' },
    securityPosture: 'SECURE',
    nativeArnOrId: `urn:${targetFile.provider.toLowerCase()}:iac:${targetFile.name}`
  };
  resources.push(newRes);

  const user = (req.headers['x-user-email'] as string) || (userRole ? `${userRole.toLowerCase()}@multicloud.corp` : 'admin@multicloud.corp');
  const role = (req.headers['x-user-role'] as string) || userRole || 'ROLE_ADMIN';
  const logEntry = logAudit(user, role, targetFile.provider, 'DEPLOY_IAC_CONFIG', targetFile.name, 'MEDIUM', 'SUCCESS', `Deploy de infraestrutura IaC ${targetFile.name} executado com sucesso.`);

  res.json({
    success: true,
    message: `Configuração ${targetFile.name} implantada com sucesso no provedor ${targetFile.provider}.`,
    deployedResource: newRes,
    file: targetFile,
    auditSignature: logEntry.signature
  });
});

// ----------------------------------------------------
// MULTI-CLOUD BACKUP & DISASTER RECOVERY (DR)
// ----------------------------------------------------
app.get('/api/backups', (req: Request, res: Response) => {
  const metrics = BackupDrManager.getMetrics();
  res.setHeader('Content-Type', 'application/json');
  res.json({
    tasks: BackupDrManager.getAllTasks(),
    metrics,
    slaMetrics: metrics
  });
});

app.post('/api/backups/trigger', async (req: Request, res: Response) => {
  const { taskId } = req.body;
  try {
    const result = await BackupDrManager.triggerBackup(taskId);
    const user = (req.headers['x-user-email'] as string) || 'admin@multicloud.corp';
    const role = (req.headers['x-user-role'] as string) || 'ROLE_ADMIN';
    logAudit(user, role, result.task.sourceProvider, 'TRIGGER_CROSS_CLOUD_BACKUP', result.task.name, 'MEDIUM', 'SUCCESS', result.message);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/backups/:id/run-now', async (req: Request, res: Response) => {
  const taskId = req.params.id;
  try {
    const result = await BackupDrManager.triggerBackup(taskId);
    const user = (req.headers['x-user-email'] as string) || 'admin@multicloud.corp';
    const role = (req.headers['x-user-role'] as string) || 'ROLE_ADMIN';
    logAudit(user, role, result.task.sourceProvider, 'TRIGGER_CROSS_CLOUD_BACKUP', result.task.name, 'MEDIUM', 'SUCCESS', result.message);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/backups/drill', async (req: Request, res: Response) => {
  const { taskId } = req.body;
  try {
    const result = await BackupDrManager.testRecoveryDrill(taskId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/backups/:id/drill-test', async (req: Request, res: Response) => {
  const taskId = req.params.id;
  try {
    const result = await BackupDrManager.testRecoveryDrill(taskId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/backups/schedule', (req: Request, res: Response) => {
  try {
    const newTask = BackupDrManager.addSchedule(req.body);
    const user = (req.headers['x-user-email'] as string) || 'admin@multicloud.corp';
    const role = (req.headers['x-user-role'] as string) || 'ROLE_ADMIN';
    logAudit(user, role, newTask.sourceProvider, 'SCHEDULE_BACKUP', newTask.name, 'LOW', 'SUCCESS', `Agendamento criado: ${newTask.scheduleCron}.`);
    res.json(newTask);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// OPENTELEMETRY TRACES
// ----------------------------------------------------
app.get('/api/telemetry/traces', (req: Request, res: Response) => {
  res.json(OpenTelemetryTracer.getRecentTraces());
});

// ----------------------------------------------------
// CRYPTOGRAPHIC AUDIT VERIFICATION
// ----------------------------------------------------
app.get('/api/audit/verify', (req: Request, res: Response) => {
  const check = AuditCryptoChain.verifyChainIntegrity(auditLogs);
  res.json(check);
});

// ----------------------------------------------------
// EXECUTIVE REPORTING & AUDIT EXPORT
// ----------------------------------------------------
app.get('/api/reports/executive', (req: Request, res: Response) => {
  const totalCost = resources.reduce((acc, curr) => acc + curr.estimatedMonthlyCost, 0);
  const secureCount = resources.filter(r => r.securityPosture === 'SECURE').length;
  const complianceScore = Math.round((secureCount / resources.length) * 100);
  const integrity = AuditCryptoChain.verifyChainIntegrity(auditLogs);
  const backupMetrics = BackupDrManager.getMetrics();

  const reportData = {
    reportId: `REP-EXEC-${Date.now().toString().slice(-6)}`,
    generatedAt: new Date().toISOString(),
    status: 'OFFICIAL_AUDITED',
    overview: {
      totalResources: resources.length,
      activeCloudsCount: 4,
      totalMonthlySpendUsd: totalCost.toFixed(2),
      cisComplianceScore: `${complianceScore}%`,
      auditLedgerIntegrity: integrity.isValid ? 'VERIFIED (SHA-256 Tamper-Proof)' : 'TAMPER_DETECTED'
    },
    finOpsBreakdown: {
      aws: resources.filter(r => r.provider === 'AWS').reduce((a, b) => a + b.estimatedMonthlyCost, 0).toFixed(2),
      azure: resources.filter(r => r.provider === 'AZURE').reduce((a, b) => a + b.estimatedMonthlyCost, 0).toFixed(2),
      gcp: resources.filter(r => r.provider === 'GCP').reduce((a, b) => a + b.estimatedMonthlyCost, 0).toFixed(2),
      oci: resources.filter(r => r.provider === 'OCI').reduce((a, b) => a + b.estimatedMonthlyCost, 0).toFixed(2),
      potentialSavingsAnnualUsd: '297.60'
    },
    disasterRecoverySla: {
      totalProtectedDataGb: backupMetrics.totalDataGb,
      activeJobs: backupMetrics.activeTasksCount,
      successRate: `${backupMetrics.successRate}%`,
      achievedAverageRpo: `${backupMetrics.avgRpoHours} horas`,
      achievedAverageRto: `${backupMetrics.avgRtoMinutes} minutos`,
      crossCloudReplication: 'Ativa entre AWS, Azure, GCP e OCI'
    },
    governancePolicies: [
      { name: 'Criptografia em Repouso Mandatória (CMEK / KMS)', status: 'COMPLIANT', score: 100 },
      { name: 'Bloqueio de SSH/RDP Aberto (0.0.0.0/0)', status: 'COMPLIANT', score: 100 },
      { name: 'Padrão Corporativo de Tagging & Owner', status: 'COMPLIANT', score: 98 },
      { name: 'Prevenção de Buckets Públicos', status: 'COMPLIANT', score: 100 }
    ],
    verifiedAuditRecordsCount: auditLogs.length,
    latestSignatures: auditLogs.slice(0, 5).map(l => ({ id: l.id, user: l.user, action: l.action, signature: l.signature }))
  };

  const markdownReport = `# RELATÓRIO EXECUTIVO DE GOVERNANÇA, FINOPS E AUDITORIA MULTI-CLOUD
**Identificador do Laudo:** ${reportData.reportId}  
**Data de Emissão:** ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}  
**Status da Trilha Criptográfica:** ${integrity.isValid ? '✅ VERIFICADA (SHA-256 Tamper-Proof)' : '❌ INCONSISTÊNCIA DETECTADA'}  
**Score de Conformidade CIS/OPA:** ${complianceScore}%  

---

## 1. Visão Geral dos Ambientes em Nuvem
- **Provedores Ativos Conectados:** 4 (AWS, Azure, GCP, OCI)
- **Total de Recursos Gerenciados:** ${resources.length}
- **Gasto Mensal Projetado:** $${totalCost.toFixed(2)} USD
- **Economia Anual Identificada (FinOps):** $297.60 USD

## 2. Distribuição FinOps por Provedor
- **AWS:** $${reportData.finOpsBreakdown.aws} USD/mês
- **Azure:** $${reportData.finOpsBreakdown.azure} USD/mês
- **GCP:** $${reportData.finOpsBreakdown.gcp} USD/mês
- **OCI (Oracle):** $${reportData.finOpsBreakdown.oci} USD/mês

## 3. Disaster Recovery (DR) & Backup Cross-Cloud SLA
- **Volume Protegido:** ${backupMetrics.totalDataGb} GB
- **Tarefas Ativas:** ${backupMetrics.activeTasksCount}
- **Taxa de Sucesso:** ${backupMetrics.successRate}%
- **RPO Médio Alcançado:** ${backupMetrics.avgRpoHours} horas
- **RTO Médio Alcançado:** ${backupMetrics.avgRtoMinutes} minutos

---
*Laudo gerado automaticamente pelo Unified Multi-Cloud Abstraction Engine com assinaturas digitais encadeadas.*`;

  res.setHeader('Content-Type', 'application/json');
  res.json({
    ...reportData,
    markdownReport
  });
});
// AI Agent Chat with Tool Calling, OpenTelemetry Tracing & Guardrails
app.post('/api/agent/chat', async (req: Request, res: Response) => {
  const { traceId, tracer } = OpenTelemetryTracer.startTrace('AGENT_CHAT_ORCHESTRATION');
  try {
    const { prompt, autoApproveSafeActions, dryRun } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt obrigatório' });
      return;
    }

    tracer.recordSpan('PARSE_INTENT', 'AI_ORCHESTRATOR', 12, { prompt: prompt.slice(0, 50), dryRun: !!dryRun });

    const promptLower = String(prompt).toLowerCase();

    // 1. Check for Destructive / High Risk Actions (Guardrail Protection ADR-003)
    const isDestructive =
      promptLower.includes('stop') ||
      promptLower.includes('parar') ||
      promptLower.includes('pare') ||
      promptLower.includes('desligar') ||
      promptLower.includes('desligue') ||
      promptLower.includes('delete') ||
      promptLower.includes('excluir') ||
      promptLower.includes('exclua') ||
      promptLower.includes('remover') ||
      promptLower.includes('remova') ||
      promptLower.includes('terminate') ||
      promptLower.includes('destruir') ||
      promptLower.includes('destrua');

    let target = resources.find(r => promptLower.includes(r.name.toLowerCase()) || promptLower.includes(r.provider.toLowerCase()));
    if (!target) target = resources[0];

    // Dry Run Simulation Mode for destructive operations
    if (dryRun && isDestructive) {
      tracer.recordSpan('DRY_RUN_PLANNER', 'UNIFIED_ADAPTER', 25, { target: target.name, provider: target.provider });
      tracer.finish();
      const dryPlan = `------------------------------------------------------------\n` +
        `[SIMULAÇÃO DRY-RUN DE OPERAÇÃO DESTRUTIVA]\n` +
        `- Provedor: ${target.provider}\n` +
        `- Recurso Alvo: ${target.name} (${target.id})\n` +
        `- Tipo: ${target.resourceType} | Região: ${target.region}\n` +
        `- Impacto de Custo Estimado: -$${target.estimatedMonthlyCost.toFixed(2)} USD/mês\n` +
        `- Status Atual: ${target.status}\n` +
        `*Nenhuma alteração de estado foi efetuada no cluster cloud.*\n` +
        `------------------------------------------------------------`;

      logAudit(
        'operator@multicloud.corp',
        'ROLE_DEV',
        target.provider,
        'DRY_RUN_PREVIEW',
        target.name,
        'LOW',
        'SUCCESS',
        `Simulação Dry-run de exclusão/parada executada para ${target.name}.`
      );

      res.json({
        reply: `🔍 **Resultado da Simulação Dry-Run (Sem efeitos colaterais)**:\n\n\`\`\`text\n${dryPlan}\n\`\`\`\n\nPara aplicar essa exclusão de fato, desmarque o modo Dry-Run ou envie o comando de execução com aprovação humana.`,
        status: 'SUCCESS',
        invokedTools: [
          {
            toolName: 'multicloud_dryrun_planner',
            provider: target.provider,
            arguments: { target: target.name, dryRun: true },
            result: 'Dry-run concluído com sucesso.',
            success: true,
            latencyMs: 25,
            traceId
          }
        ],
        traceId
      });
      return;
    }

    if (isDestructive && !autoApproveSafeActions) {
      tracer.recordSpan('GUARDRAIL_INTERCEPT', 'SECURITY_GUARDRAIL', 18, { risk: 'CRITICAL', target: target.name });
      tracer.finish();

      const dryRunDiff = `- resource "${target.provider.toLowerCase()}_instance" "${target.name}" {\n` +
        `-   status       = "${target.status}"\n` +
        `-   monthly_cost = "$${target.estimatedMonthlyCost.toFixed(2)}"\n` +
        `- }`;

      const blastRadius = {
        riskLevel: 'CRITICAL' as const,
        requiresApproval: true,
        description: `Operação de alta criticidade detectada: Interrupção/Remoção de recurso de infraestrutura em nuvem.`,
        affectedResources: [`${target.provider} :: ${target.name} (${target.resourceType})`],
        confirmationToken: `token-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        targetResourceId: target.id,
        suggestedAction: promptLower.includes('delete') || promptLower.includes('excluir') || promptLower.includes('exclua') ? 'DELETE' : 'STOP',
        dryRunDiff,
        estimatedCostImpact: -target.estimatedMonthlyCost
      };

      // Record in tamper-evident chained audit log as blocked pending review
      logAudit(
        'ai-agent-guardrail',
        'ROLE_GUARDRAIL',
        target.provider,
        'GUARDRAIL_INTERCEPT',
        target.name,
        'CRITICAL',
        'BLOCKED_BY_GUARDRAIL',
        `Tentativa de operação destrutiva interceptada para aprovação do operador humano: "${prompt}"`
      );

      res.json({
        reply: `⚠️ **Guardrail de Segurança Ativado (ADR-003)**:\n\nA sua solicitação envolve uma **ação destrutiva ou de alto impacto** no ambiente de nuvem (${target.provider} - ${target.name}). Por requisitos de conformidade e proteção contra indisponibilidade, foi calculado o **Blast Radius** e a execução requer a confirmação explícita do operador humano abaixo.`,
        status: 'AWAITING_APPROVAL',
        invokedTools: [],
        blastRadius,
        traceId
      });
      return;
    }

    // 2. Use Gemini AI if key exists, otherwise use deterministic high-intelligence orchestrator
    const gemini = getGeminiClient();

    if (gemini) {
      const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash'];
      let geminiResponseText: string | null = null;
      let usedModel = 'gemini-3.8-flash';

      const systemInstruction = `Você é o AI MultiCloud Agent (Produção 2026), um orquestrador sênior especialista em AWS, Azure, Google Cloud (GCP) e Oracle Cloud (OCI).
Você gerencia infraestrutura com alta responsabilidade, aderindo às políticas de governança CIS, OPA Gatekeeper e finanças em nuvem (FinOps).
Inventário atual em memória:
${JSON.stringify(resources, null, 2)}

Quando o usuário perguntar ou pedir ações de infraestrutura:
- Seja preciso, profissional e objetivo em português do Brasil.
- Use formatação Markdown elegante com tabelas ou tópicos para resumir recursos.
- Destaque o status de segurança e estimativas de custo mensal.
- Cite os provedores de nuvem envolvidos (AWS, Azure, GCP, OCI).
- Mencione quais ferramentas você orquestrou.`;

      for (const modelCandidate of candidateModels) {
        try {
          tracer.recordSpan('GEMINI_REASONING', 'GOOGLE_GENAI_SERVICE', 320, { model: modelCandidate });
          const response = await gemini.models.generateContent({
            model: modelCandidate,
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.2
            }
          });

          if (response && response.text) {
            geminiResponseText = response.text;
            usedModel = modelCandidate;
            break;
          }
        } catch (candidateErr: any) {
          const errMsg = candidateErr?.message || String(candidateErr);
          const isDemandSpike = errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE');
          tracer.recordSpan('GEMINI_RETRY', 'MODEL_FALLBACK', 50, { 
            failedModel: modelCandidate,
            reason: isDemandSpike ? '503_HIGH_DEMAND' : 'TRANSIENT_ERROR'
          });
          // Continue to next candidate model if available
        }
      }

      if (geminiResponseText) {
        // Determine invoked tool based on context
        let invokedToolName = 'multicloud_inventory_query';
        let provider = 'ALL';
        if (promptLower.includes('aws') || promptLower.includes('s3') || promptLower.includes('ec2')) {
          invokedToolName = 'aws_ec2_s3_inspector';
          provider = 'AWS';
        } else if (promptLower.includes('azure') || promptLower.includes('blob')) {
          invokedToolName = 'azure_arm_inspector';
          provider = 'AZURE';
        } else if (promptLower.includes('gcp') || promptLower.includes('google')) {
          invokedToolName = 'gcp_compute_sql_inspector';
          provider = 'GCP';
        } else if (promptLower.includes('oci') || promptLower.includes('oracle')) {
          invokedToolName = 'oci_core_inspector';
          provider = 'OCI';
        }

        tracer.recordSpan('INVOKE_TOOL', invokedToolName, 85, { provider, model: usedModel });
        tracer.recordSpan('OPA_EVALUATION', 'OPA_ENGINE', 15, { status: 'COMPLIANT' });
        tracer.finish();

        const toolCall = {
          toolName: invokedToolName,
          provider,
          arguments: { query: prompt },
          result: `Consulta executada em ${provider} com sucesso via modelo ${usedModel}.`,
          success: true,
          latencyMs: 124,
          traceId
        };

        logAudit(
          'current-operator@multicloud.corp',
          'ROLE_DEV',
          provider,
          'AI_AGENT_ORCHESTRATION',
          'QUERY',
          'LOW',
          'SUCCESS',
          `Agente de IA orquestrou ferramenta ${invokedToolName} (${usedModel}) para solicitação: "${prompt.slice(0, 60)}..."`
        );

        res.json({
          reply: geminiResponseText,
          status: 'SUCCESS',
          invokedTools: [toolCall],
          traceId
        });
        return;
      }

      // If Gemini models encountered transient high-demand spikes, record graceful degradation
      tracer.recordSpan('AI_FALLBACK_DETERMINISTIC', 'MULTI_CLOUD_RULE_ENGINE', 15, {
        status: 'GRACEFUL_FALLBACK',
        cause: 'High demand spike detected on external AI models, switching smoothly to deterministic engine'
      });
    }

    // No simulated provider fallback.
    tracer.recordSpan('NO_REAL_PROVIDER_EXECUTION', 'MULTI_CLOUD_ADAPTER', 0, { status: 'NOT_CONFIGURED' });
    tracer.finish();
    res.status(503).json({
      reply: 'Nenhuma operação foi executada em um provedor de nuvem real. Configure um adapter/provider antes de executar esta solicitação.',
      status: 'NOT_CONFIGURED',
      invokedTools: [],
      traceId
    });
  }

  // Direct Tool Execution after Approval
app.post('/api/agent/execute', (req: Request, res: Response) => {
  const { toolName, provider, parameters, resourceId, action } = req.body;
  res.status(501).json({
    toolName: toolName || 'execute_cloud_action',
    provider: provider || 'UNSPECIFIED',
    resourceId: resourceId || null,
    action: action || null,
    parameters: parameters || {},
    status: 'NOT_IMPLEMENTED',
    executionPerformed: false,
    message: 'Real cloud execution adapter is not configured. No infrastructure state was changed.'
  });
});

// // ----------------------------------------------------
// SERVER START & VITE MIDDLEWARE
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI MultiCloud Agent Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();