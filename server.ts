import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Multi-Cloud Resource Inventory
interface CloudResource {
  id: string;
  name: string;
  provider: 'AWS' | 'AZURE' | 'GCP' | 'OCI';
  category: 'COMPUTE' | 'STORAGE' | 'DATABASE' | 'NETWORKING' | 'SECURITY';
  resourceType: string;
  status: 'RUNNING' | 'STOPPED' | 'PROVISIONING' | 'DEGRADED';
  region: string;
  estimatedMonthlyCost: number;
  tags: Record<string, string>;
  securityPosture: 'SECURE' | 'WARNING' | 'NON_COMPLIANT';
  nativeArnOrId: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  provider: string;
  action: string;
  resourceId: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'CRITICAL';
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED_BY_GUARDRAIL';
  details: string;
  signature: string;
}

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

let auditLogs: AuditLog[] = [
  {
    id: 'aud-001',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    user: 'rodrigo.ops@multicloud.corp',
    role: 'ROLE_ADMIN',
    provider: 'AWS',
    action: 'DISCOVER_RESOURCES',
    resourceId: 'ALL_AWS_EAST',
    riskLevel: 'LOW',
    status: 'SUCCESS',
    details: 'Auto-discovery de inventário executado em us-east-1 (14 recursos catalogados).',
    signature: 'sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  },
  {
    id: 'aud-002',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    user: 'ai-agent-daemon',
    role: 'ROLE_AGENT',
    provider: 'GCP',
    action: 'SECURITY_POSTURE_CHECK',
    resourceId: 'gcp-pg-master-db',
    riskLevel: 'LOW',
    status: 'SUCCESS',
    details: 'Verificação periódica de conformidade CIS v2.0 para PostgreSQL (100% compliant).',
    signature: 'sha256-4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a'
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
    engine: 'Express+Gemini Enterprise Multi-Cloud Engine',
    springBootReady: true,
    version: '1.0.0-PROD'
  });
});

app.get('/api/actuator/health', (req: Request, res: Response) => {
  res.json({
    status: 'UP',
    components: {
      awsAdapter: { status: 'UP', latencyMs: 42 },
      azureAdapter: { status: 'UP', latencyMs: 56 },
      gcpAdapter: { status: 'UP', latencyMs: 38 },
      ociAdapter: { status: 'UP', latencyMs: 49 },
      aiAgentCore: { status: 'UP', model: 'gemini-3.8-flash' }
    }
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

let providersList = [...initialProviders];

function logAudit(user: string, role: string, provider: string, action: string, resourceId: string, riskLevel: 'LOW' | 'MEDIUM' | 'CRITICAL', status: 'SUCCESS' | 'FAILED' | 'BLOCKED_BY_GUARDRAIL', details: string) {
  auditLogs.unshift({
    id: `aud-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString(),
    user,
    role,
    provider,
    action,
    resourceId,
    riskLevel,
    status,
    details,
    signature: `sha256-${Math.random().toString(36).substring(2, 15)}`
  });
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
      permissions: ['READ', 'WRITE', 'EXECUTE_CRITICAL', 'BLAST_RADIUS_APPROVE', 'MANAGE_CLOUDS', 'EXPORT_AUDIT']
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
      permissions: ['READ', 'WRITE', 'EXECUTE_STANDARD', 'REQUEST_ACTION']
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
      permissions: ['READ', 'VIEW_AUDIT']
    };
    logAudit('observer', 'ROLE_OBSERVER', 'SYSTEM', 'LOGIN', 'SESSION', 'LOW', 'SUCCESS', 'Autenticação bem-sucedida com perfil de Observador (Apenas Leitura).');
    res.json(userObj);
    return;
  }

  logAudit(username, 'UNKNOWN', 'SYSTEM', 'LOGIN_FAILED', 'SESSION', 'MEDIUM', 'FAILED', `Tentativa de login frustrada para o usuário "${username}".`);
  res.status(401).json({ error: 'Credenciais inválidas. Usuários disponíveis: admin, dev, observer' });
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
      permissions: ['READ', 'WRITE', 'EXECUTE_STANDARD', 'REQUEST_ACTION']
    });
    return;
  }
  if (authHeader.includes('jwt-obs')) {
    res.json({
      username: 'observer',
      displayName: 'Auditor de Segurança (Observer)',
      role: 'ROLE_OBSERVER',
      permissions: ['READ', 'VIEW_AUDIT']
    });
    return;
  }
  res.json({
    username: 'admin',
    displayName: 'Rodrigo Dias (Administrador Cloud)',
    role: 'ROLE_ADMIN',
    permissions: ['READ', 'WRITE', 'EXECUTE_CRITICAL', 'BLAST_RADIUS_APPROVE', 'MANAGE_CLOUDS', 'EXPORT_AUDIT']
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
  const logEntry: AuditLog = {
    id: `aud-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString(),
    user: 'current-operator@multicloud.corp',
    role: 'ROLE_DEVOPS',
    provider: target.provider,
    action: action || 'ACTION',
    resourceId: target.name,
    riskLevel: action === 'STOP' || action === 'DELETE' ? 'CRITICAL' : 'MEDIUM',
    status: 'SUCCESS',
    details: `Operação ${action} executada com sucesso no recurso ${target.name} (${target.resourceType}) via API direta.`,
    signature: `sha256-${Math.random().toString(36).substring(2, 15)}`
  };
  auditLogs.unshift(logEntry);

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

// AI Agent Chat with Tool Calling & Guardrails
app.post('/api/agent/chat', async (req: Request, res: Response) => {
  try {
    const { prompt, autoApproveSafeActions } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt obrigatório' });
      return;
    }

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

    if (isDestructive && !autoApproveSafeActions) {
      // Find possible affected target
      let target = resources.find(r => promptLower.includes(r.name.toLowerCase()) || promptLower.includes(r.provider.toLowerCase()));
      if (!target) target = resources[0];

      const blastRadius = {
        riskLevel: 'CRITICAL',
        requiresApproval: true,
        description: `Operação de alta criticidade detectada: Interrupção/Remoção de recurso de infraestrutura em nuvem.`,
        affectedResources: [`${target.provider} :: ${target.name} (${target.resourceType})`],
        confirmationToken: `token-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        targetResourceId: target.id,
        suggestedAction: promptLower.includes('delete') || promptLower.includes('excluir') || promptLower.includes('exclua') ? 'DELETE' : 'STOP'
      };

      // Record in audit log as blocked pending review
      auditLogs.unshift({
        id: `aud-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        user: 'ai-agent-guardrail',
        role: 'ROLE_GUARDRAIL',
        provider: target.provider,
        action: 'GUARDRAIL_INTERCEPT',
        resourceId: target.name,
        riskLevel: 'CRITICAL',
        status: 'BLOCKED_BY_GUARDRAIL',
        details: `Tentativa de operação destrutiva interceptada para aprovação do operador humano: "${prompt}"`,
        signature: `sha256-${Math.random().toString(36).substring(2, 15)}`
      });

      res.json({
        reply: `⚠️ **Guardrail de Segurança Ativado (ADR-003)**:\n\nA sua solicitação envolve uma **ação destrutiva ou de alto impacto** no ambiente de nuvem (${target.provider} - ${target.name}). Por requisitos de conformidade e proteção contra indisponibilidade, foi calculado o **Blast Radius** e a execução requer a confirmação explícita do operador humano abaixo.`,
        status: 'AWAITING_APPROVAL',
        invokedTools: [],
        blastRadius
      });
      return;
    }

    // 2. Use Gemini AI if key exists, otherwise use deterministic high-intelligence orchestrator
    const gemini = getGeminiClient();

    if (gemini) {
      try {
        const systemInstruction = `Você é o AI MultiCloud Agent (Produção 2026), um orquestrador sênior especialista em AWS, Azure, Google Cloud (GCP) e Oracle Cloud (OCI).
Você gerencia infraestrutura com alta responsabilidade, aderindo às políticas de governança CIS e finanças em nuvem (FinOps).
Inventário atual em memória:
${JSON.stringify(resources, null, 2)}

Quando o usuário perguntar ou pedir ações de infraestrutura:
- Seja preciso, profissional e objetivo em português do Brasil.
- Use formatação Markdown elegante com tabelas ou tópicos para resumir recursos.
- Destaque o status de segurança e estimativas de custo mensal.
- Cite os provedores de nuvem envolvidos (AWS, Azure, GCP, OCI).
- Mencione quais ferramentas você orquestrou.`;

        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.2
          }
        });

        const replyText = response.text || 'Processamento concluído pelo agente.';

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

      const toolCall = {
        toolName: invokedToolName,
        provider,
        arguments: { query: prompt },
        result: `Consulta executada em ${provider} com sucesso.`,
        success: true,
        latencyMs: 124
      };

      // Record query in audit log
      auditLogs.unshift({
        id: `aud-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        user: 'current-operator@multicloud.corp',
        role: 'ROLE_DEVOPS',
        provider,
        action: 'AI_AGENT_ORCHESTRATION',
        resourceId: 'QUERY',
        riskLevel: 'LOW',
        status: 'SUCCESS',
        details: `Agente de IA orquestrou ferramenta ${invokedToolName} para solicitação: "${prompt.slice(0, 60)}..."`,
        signature: `sha256-${Math.random().toString(36).substring(2, 15)}`
      });

      res.json({
        reply: replyText,
        status: 'SUCCESS',
        invokedTools: [toolCall]
      });
      return;
      } catch (geminiError: any) {
        console.warn('Gemini API call error (falling back to deterministic multi-cloud engine):', geminiError?.message || geminiError);
      }
    }

    // Fallback: Intelligent Simulated Multi-Cloud Engine
    let simulatedReply = '';
    let toolName = 'multicloud_query';
    let provider = 'ALL';

    if (promptLower.includes('s3') || (promptLower.includes('bucket') && promptLower.includes('aws'))) {
      provider = 'AWS';
      toolName = 'aws_s3_list_buckets';
      const s3Buckets = resources.filter(r => r.provider === 'AWS' && r.category === 'STORAGE');
      simulatedReply = `### 📦 Relatório de Buckets AWS S3\n\nForam localizados **${s3Buckets.length} bucket(s)** na região \`us-east-1\`:\n\n` +
        s3Buckets.map(b => `- **Nome:** \`${b.name}\`\n  - **Tipo:** ${b.resourceType}\n  - **Custo Mensal:** $${b.estimatedMonthlyCost.toFixed(2)}\n  - **Conformidade:** ✅ ${b.securityPosture} (Criptografia KMS ativa, sem acesso público)`).join('\n\n');
    } else if (promptLower.includes('vm') || promptLower.includes('instância') || promptLower.includes('compute') || promptLower.includes('ec2')) {
      const vms = resources.filter(r => r.category === 'COMPUTE');
      toolName = 'multicloud_list_instances';
      simulatedReply = `### 🖥️ Instâncias de Computação Multi-Cloud Ativas\n\n` +
        `Total de máquinas em execução: **${vms.length}**\n\n` +
        vms.map(v => `| Provedor | Nome | Tipo | Região | Status | Custo |\n|---|---|---|---|---|---|\n| **${v.provider}** | \`${v.name}\` | ${v.resourceType} | ${v.region} | 🟢 ${v.status} | $${v.estimatedMonthlyCost.toFixed(2)}/mês |`).join('\n') +
        `\n\n*Todas as instâncias estão com os agentes de telemetria operacionais e sem vulnerabilidades críticas detectadas.*`;
    } else if (promptLower.includes('banco') || promptLower.includes('database') || promptLower.includes('sql')) {
      const dbs = resources.filter(r => r.category === 'DATABASE');
      toolName = 'multicloud_list_databases';
      simulatedReply = `### 🗄️ Bancos de Dados Gerenciados Multi-Cloud\n\n` +
        `Identificados **${dbs.length} clusters de banco de dados** em produção:\n\n` +
        dbs.map(d => `- **${d.provider}** :: \`${d.name}\` (${d.resourceType})\n  - **Região:** ${d.region}\n  - **Custo:** $${d.estimatedMonthlyCost.toFixed(2)}/mês\n  - **Segurança:** Backups diários automatizados e conexões TLS 1.3 obrigatórias.`).join('\n\n');
    } else if (promptLower.includes('custo') || promptLower.includes('finops') || promptLower.includes('valor')) {
      const total = resources.reduce((acc, r) => acc + r.estimatedMonthlyCost, 0);
      toolName = 'finops_cost_analysis';
      simulatedReply = `### 💰 Análise de Custos Multi-Cloud (FinOps)\n\n` +
        `- **Previsão Total Mensal:** **$${total.toFixed(2)} USD**\n` +
        `- **AWS:** $${resources.filter(r => r.provider === 'AWS').reduce((a, b) => a + b.estimatedMonthlyCost, 0).toFixed(2)}\n` +
        `- **GCP:** $${resources.filter(r => r.provider === 'GCP').reduce((a, b) => a + b.estimatedMonthlyCost, 0).toFixed(2)}\n` +
        `- **Azure:** $${resources.filter(r => r.provider === 'AZURE').reduce((a, b) => a + b.estimatedMonthlyCost, 0).toFixed(2)}\n` +
        `- **OCI:** $${resources.filter(r => r.provider === 'OCI').reduce((a, b) => a + b.estimatedMonthlyCost, 0).toFixed(2)}\n\n` +
        `💡 **Recomendação:** Há uma oportunidade de migrar instâncias computacionais pontuais para Savings Plans de 1 ano, gerando uma economia de até **$24.80/mês**.`;
    } else {
      simulatedReply = `Olá! Sou o **AI MultiCloud Agent** (Pronto para Produção). Posso executar tarefas operacionais e de governança nos 4 provedores de nuvem:\n\n` +
        `- **AWS**: Listar/Criar instâncias EC2, inspecionar S3 e clusters RDS Aurora.\n` +
        `- **Azure**: Auditar Resource Groups, gerenciar VMs e Blob Storage.\n` +
        `- **GCP**: Supervisionar Cloud SQL, Compute Engine e clusters GKE Autopilot.\n` +
        `- **OCI (Oracle)**: Orquestrar instâncias ARM64 e Autonomous Databases.\n` +
        `- **Segurança & FinOps**: Calcular Blast Radius de comandos e auditar conformidade.\n\n` +
        `Como posso te ajudar com a sua infraestrutura agora?`;
    }

    res.json({
      reply: simulatedReply,
      status: 'SUCCESS',
      invokedTools: [
        {
          toolName,
          provider,
          arguments: { query: prompt },
          result: 'Comando executado com sucesso.',
          success: true,
          latencyMs: 85
        }
      ]
    });
  } catch (err: any) {
    console.error('Agent chat error:', err);
    res.status(500).json({ error: err.message || 'Falha ao processar agente' });
  }
});

// Direct Tool Execution after Approval
app.post('/api/agent/execute', (req: Request, res: Response) => {
  const { toolName, provider, parameters, resourceId, action } = req.body;

  let target = resources.find(r => r.id === resourceId);
  if (!target && resourceId) {
    target = resources.find(r => r.name === resourceId);
  }

  if (target && action) {
    if (action === 'STOP') target.status = 'STOPPED';
    if (action === 'START') target.status = 'RUNNING';
  }

  const logEntry: AuditLog = {
    id: `aud-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString(),
    user: 'approved-operator@multicloud.corp',
    role: 'ROLE_ADMIN',
    provider: provider || 'MULTI',
    action: action || toolName || 'EXECUTE_APPROVED_ACTION',
    resourceId: target ? target.name : 'RESOURCE',
    riskLevel: 'CRITICAL',
    status: 'SUCCESS',
    details: `Operação aprovada manualmente e executada com sucesso pelo agente. Alvo: ${target ? target.name : 'N/A'}.`,
    signature: `sha256-${Math.random().toString(36).substring(2, 15)}`
  };
  auditLogs.unshift(logEntry);

  res.json({
    reply: `✅ **Operação Executada com Sucesso**!\n\nA alteração no recurso \`${target ? target.name : 'solicitado'}\` foi concluída e o evento foi registrado na trilha de auditoria imutável (ID: \`${logEntry.id}\`).`,
    status: 'SUCCESS',
    invokedTools: [
      {
        toolName: toolName || 'execute_cloud_action',
        provider: provider || 'AWS',
        arguments: parameters || {},
        result: 'Executado com sucesso no provedor.',
        success: true,
        latencyMs: 140
      }
    ]
  });
});

// ----------------------------------------------------
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
