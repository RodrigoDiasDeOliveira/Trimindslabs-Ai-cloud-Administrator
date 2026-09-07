export type CloudProvider = 'AWS' | 'AZURE' | 'GCP' | 'OCI' | string;

export type ResourceCategory = 'COMPUTE' | 'STORAGE' | 'DATABASE' | 'NETWORKING' | 'SECURITY';

export type AppTheme = 'dark' | 'midnight' | 'light';

export type UserRole = 'ROLE_ADMIN' | 'ROLE_DEV' | 'ROLE_OBSERVER' | 'ROLE_FINOPS' | 'ROLE_SECURITY_AUDITOR';

export type GranularPermission = 
  | 'READ' 
  | 'WRITE' 
  | 'EXECUTE_CRITICAL' 
  | 'BLAST_RADIUS_APPROVE' 
  | 'MANAGE_CLOUDS' 
  | 'EXPORT_AUDIT'
  | 'IAC_DEPLOY'
  | 'BACKUP_OPERATE'
  | 'POLICY_MANAGE'
  | 'FINOPS_VIEW';

export interface AuthUser {
  username: string;
  displayName: string;
  role: UserRole;
  token: string;
  permissions: GranularPermission[];
}

export interface CloudResource {
  id: string;
  name: string;
  provider: CloudProvider;
  category: ResourceCategory;
  resourceType: string;
  status: 'RUNNING' | 'STOPPED' | 'PROVISIONING' | 'DEGRADED';
  region: string;
  estimatedMonthlyCost: number;
  tags: Record<string, string>;
  securityPosture: 'SECURE' | 'WARNING' | 'NON_COMPLIANT';
  nativeArnOrId: string;
}

export interface ProviderStatus {
  provider: CloudProvider;
  status: 'HEALTHY' | 'CONNECTED' | 'DEGRADED' | 'NOT_CONFIGURED';
  defaultRegion: string;
  activeResourcesCount: number;
  latencyMs: number;
  credentialsValid: boolean;
  availableServices: string[];
  circuitBreakerState?: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  lastProbeCheck?: {
    probeType: string;
    targetEndpoint: string;
    statusCode: number;
    success: boolean;
    latencyMs: number;
    checkedAt: string;
  };
}

export interface ToolCall {
  toolName: string;
  provider: string;
  arguments: Record<string, any>;
  result: string;
  success: boolean;
  latencyMs?: number;
  traceId?: string;
  spanId?: string;
}

export interface BlastRadius {
  riskLevel: 'LOW' | 'MEDIUM' | 'CRITICAL';
  requiresApproval: boolean;
  description: string;
  affectedResources: string[];
  confirmationToken: string;
  targetResourceId?: string;
  suggestedAction?: string;
  dryRunDiff?: string;
  estimatedCostImpact?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  status?: 'SUCCESS' | 'AWAITING_APPROVAL' | 'FAILED';
  invokedTools?: ToolCall[];
  blastRadius?: BlastRadius;
  traceId?: string;
}

export interface AuditLog {
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
  previousHash: string;
  signature: string;
}

export interface PolicyItem {
  id: string;
  name: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING';
  violationsCount: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  remediation?: string;
}

export interface CostRecommendation {
  provider: CloudProvider;
  resource: string;
  recommendation: string;
  potentialSavings: number;
}

export interface GovernanceData {
  complianceScore: number;
  totalMonthlyEstimate: string;
  activeCloudCount: number;
  totalResources: number;
  policies: PolicyItem[];
  costOptimizationRecommendations: CostRecommendation[];
}

// OPA / Policy as Code Types
export interface PolicyViolation {
  policyId: string;
  policyName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  resourceName?: string;
}

export interface OpaEvaluationResult {
  allowed: boolean;
  violations: PolicyViolation[];
  complianceScore: number;
  evaluatedAt: string;
}

// IaC Configuration File Types
export interface IacFile {
  id: string;
  name: string;
  type: 'terraform' | 'json' | 'yaml';
  provider: CloudProvider;
  content: string;
  status: 'DRAFT' | 'VALIDATED' | 'DEPLOYED';
  lastDeployDate?: string;
  dryRunDiff?: string;
  violations?: PolicyViolation[];
}

// Multi-Cloud Backup & DR Types
export interface BackupTask {
  id: string;
  name: string;
  sourceProvider: CloudProvider;
  targetProvider: CloudProvider;
  resourceId: string;
  resourceName: string;
  sizeGb: number;
  status: 'COMPLETED' | 'RUNNING' | 'SCHEDULED' | 'FAILED';
  scheduleCron: string;
  lastRun: string;
  nextRun: string;
  rpoHours: number;
  rtoMinutes: number;
  verificationHash: string;
  crossCloudReplicated: boolean;
}

// OpenTelemetry Spans
export interface OtelSpan {
  spanId: string;
  parentSpanId?: string;
  name: string;
  service: string;
  status: 'OK' | 'ERROR';
  durationMs: number;
  startTime: string;
  attributes: Record<string, any>;
}

export interface OtelTrace {
  traceId: string;
  rootOperation: string;
  timestamp: string;
  durationMs: number;
  spans: OtelSpan[];
  status: 'OK' | 'ERROR';
}
