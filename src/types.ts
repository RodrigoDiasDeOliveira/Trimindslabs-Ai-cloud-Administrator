export type CloudProvider = 'AWS' | 'AZURE' | 'GCP' | 'OCI' | string;

export type ResourceCategory = 'COMPUTE' | 'STORAGE' | 'DATABASE' | 'NETWORKING' | 'SECURITY';

export type AppTheme = 'dark' | 'midnight' | 'light';

export type UserRole = 'ROLE_ADMIN' | 'ROLE_DEV' | 'ROLE_OBSERVER';

export interface AuthUser {
  username: string;
  displayName: string;
  role: UserRole;
  token: string;
  permissions: string[];
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
}

export interface ToolCall {
  toolName: string;
  provider: string;
  arguments: Record<string, any>;
  result: string;
  success: boolean;
  latencyMs?: number;
}

export interface BlastRadius {
  riskLevel: 'LOW' | 'MEDIUM' | 'CRITICAL';
  requiresApproval: boolean;
  description: string;
  affectedResources: string[];
  confirmationToken: string;
  targetResourceId?: string;
  suggestedAction?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  status?: 'SUCCESS' | 'AWAITING_APPROVAL' | 'FAILED';
  invokedTools?: ToolCall[];
  blastRadius?: BlastRadius;
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
  signature: string;
}

export interface PolicyItem {
  id: string;
  name: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING';
  violationsCount: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
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
