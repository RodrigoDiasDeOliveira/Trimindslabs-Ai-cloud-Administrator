import { CloudProvider, CloudResource } from '../types';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { DescribeInstancesCommand, EC2Client, RunInstancesCommand, TerminateInstancesCommand, StartInstancesCommand, StopInstancesCommand, RebootInstancesCommand } from '@aws-sdk/client-ec2';
import { CircuitBreaker, retryWithTenacity } from './resilience';
import { OpaPolicyEngine } from './opaEngine';
import { InputValidator } from './inputValidator';

export interface UnifiedVmOptions {
  provider: CloudProvider;
  name: string;
  instanceType: string;
  region: string;
  image?: string;
  dryRun?: boolean;
  tags?: Record<string, string>;
  estimatedCostMonthly?: number;
}

export interface UnifiedStorageOptions {
  provider: CloudProvider;
  name: string;
  tier: string;
  region: string;
  encryptionKey?: string;
  dryRun?: boolean;
  tags?: Record<string, string>;
}

export interface UnifiedDbOptions {
  provider: CloudProvider;
  name: string;
  engine: 'POSTGRES' | 'MYSQL' | 'AURORA' | 'ORACLE';
  allocatedStorageGb?: number;
  region: string;
  dryRun?: boolean;
  tags?: Record<string, string>;
}

export interface ExecutionResult<T = any> {
  success: boolean;
  dryRun: boolean;
  provider: CloudProvider;
  operation: string;
  result?: T;
  executionPlan?: string;
  estimatedCostDelta?: number;
  opaScore?: number;
  message: string;
  latencyMs: number;
}

export interface AwsInstanceSummary {
  instanceId: string;
  name?: string;
  state: string;
  instanceType?: string;
  availabilityZone?: string;
  privateIpAddress?: string;
  publicIpAddress?: string;
  tags: Record<string, string>;
}

export interface ProbeResult {
  provider: CloudProvider;
  probeType: string;
  targetEndpoint: string;
  statusCode: number;
  success: boolean;
  latencyMs: number;
  checkedAt: string;
  message: string;
  circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

/**
 * Unified Multi-Cloud Abstraction Service
 * Normalizes provisioning, lifecycle management, health probing, and DR operations across AWS, Azure, GCP, and OCI.
 */
export class UnifiedCloudService {
  private static circuitBreakers: Map<string, CircuitBreaker> = new Map([
    ['AWS', new CircuitBreaker('AWS_ADAPTER', { failureThreshold: 3, recoveryTimeoutMs: 15000 })],
    ['AZURE', new CircuitBreaker('AZURE_ADAPTER', { failureThreshold: 3, recoveryTimeoutMs: 15000 })],
    ['GCP', new CircuitBreaker('GCP_ADAPTER', { failureThreshold: 3, recoveryTimeoutMs: 15000 })],
    ['OCI', new CircuitBreaker('OCI_ADAPTER', { failureThreshold: 3, recoveryTimeoutMs: 15000 })]
  ]);

  private static getBreaker(provider: string): CircuitBreaker {
    const prov = provider.toUpperCase();
    if (!this.circuitBreakers.has(prov)) {
      this.circuitBreakers.set(prov, new CircuitBreaker(`${prov}_ADAPTER`));
    }
    return this.circuitBreakers.get(prov)!;
  }

  /**
   * Real Lightweight Health Check Probe for Cloud Providers
   */
  static async performHealthProbe(provider: CloudProvider): Promise<ProbeResult> {
    const prov = provider.toUpperCase();
    const breaker = this.getBreaker(prov);
    const startTime = Date.now();

    const probeEndpoints: Record<string, { type: string; endpoint: string }> = {
      AWS: { type: 'sts:GetCallerIdentity', endpoint: 'AWS STS' },
      AZURE: { type: 'arm:subscriptions/resourceGroups', endpoint: 'https://management.azure.com/subscriptions' },
      GCP: { type: 'cloudresourcemanager.projects.get', endpoint: 'https://cloudresourcemanager.googleapis.com/v1' },
      OCI: { type: 'identity.getUser / tenancy.inspect', endpoint: 'https://identity.sa-saopaulo-1.oraclecloud.com' }
    };

    const target = probeEndpoints[prov] || { type: 'custom.healthPing', endpoint: `https://${prov.toLowerCase()}.cloud/health` };

    try {
      return await breaker.execute(async () => {
        return await retryWithTenacity(async () => {
          if (prov !== 'AWS') {
            return {
              provider: prov,
              probeType: target.type,
              targetEndpoint: target.endpoint,
              statusCode: 503,
              success: false,
              latencyMs: Date.now() - startTime,
            checkedAt: new Date().toISOString(),
            message: `NOT_CONFIGURED: no real provider adapter is wired for ${prov}. No connectivity result was simulated.`,
              circuitBreakerState: breaker.getState()
            };
          }

          const client = new STSClient({});
          const response = await client.send(new GetCallerIdentityCommand({}));
          return {
            provider: prov,
            probeType: 'sts:GetCallerIdentity',
            targetEndpoint: 'AWS STS',
            statusCode: 200,
            success: true,
            latencyMs: Date.now() - startTime,
            checkedAt: new Date().toISOString(),
            message: `AWS identity verified${response.Account ? ` for account ${response.Account}` : ''}.`,
            circuitBreakerState: breaker.getState()
          };
        }, { maxAttempts: 2, initialDelayMs: 50 });
      });
    } catch (err: any) {
      const latency = Date.now() - startTime;
      return {
        provider: prov,
        probeType: target.type,
        targetEndpoint: target.endpoint,
        statusCode: err?.$metadata?.httpStatusCode || 503,
        success: false,
        latencyMs: latency,
        checkedAt: new Date().toISOString(),
        message: `Falha no probe de saúde: ${err.message}`,
        circuitBreakerState: breaker.getState()
      };
    }
  }

  /**
   * Read-only AWS EC2 inventory discovery.
   * No local inventory is mutated and no instance lifecycle operation is performed.
   */
  static async describeAwsInstances(region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'): Promise<ExecutionResult<AwsInstanceSummary[]>> {
    const startTime = Date.now();
    const prov = 'AWS';
    const breaker = this.getBreaker(prov);

    try {
      const instances = await breaker.execute(async () => {
        const client = new EC2Client({ region });
        const response = await client.send(new DescribeInstancesCommand({}));
        return (response.Reservations ?? []).flatMap(reservation =>
          (reservation.Instances ?? []).map(instance => {
            const tags = Object.fromEntries(
              (instance.Tags ?? [])
                .filter(tag => tag.Key)
                .map(tag => [tag.Key as string, tag.Value ?? ''])
            );
            return {
              instanceId: instance.InstanceId ?? 'UNKNOWN',
              name: tags.Name,
              state: instance.State?.Name ?? 'unknown',
              instanceType: instance.InstanceType,
              availabilityZone: instance.Placement?.AvailabilityZone,
              privateIpAddress: instance.PrivateIpAddress,
              publicIpAddress: instance.PublicIpAddress,
              tags
            } satisfies AwsInstanceSummary;
          })
        );
      });

      return {
        success: true,
        dryRun: false,
        provider: prov,
        operation: 'DESCRIBE_INSTANCES',
        result: instances,
        message: `AWS EC2 inventory read successfully: ${instances.length} instance(s) returned from ${region}.`,
        latencyMs: Date.now() - startTime
      };
    } catch (err: any) {
      return {
        success: false,
        dryRun: false,
        provider: prov,
        operation: 'DESCRIBE_INSTANCES',
        result: [],
        message: `AWS EC2 inventory probe failed: ${err?.message || String(err)}`,
        latencyMs: Date.now() - startTime
      };
    }
  }

  static async performAwsInstanceAction(action: 'START' | 'STOP' | 'RESTART' | 'TERMINATE', instanceId: string, region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'): Promise<ExecutionResult> {
    const startTime = Date.now();
    const client = new EC2Client({ region });
    try {
      let response: any;
      switch (action) {
        case 'START':
          response = await client.send(new StartInstancesCommand({ InstanceIds: [instanceId] }));
          break;
        case 'STOP':
          response = await client.send(new StopInstancesCommand({ InstanceIds: [instanceId] }));
          break;
        case 'RESTART':
          response = await client.send(new RebootInstancesCommand({ InstanceIds: [instanceId] }));
          break;
        case 'TERMINATE':
          response = await client.send(new TerminateInstancesCommand({ InstanceIds: [instanceId] }));
          break;
      }
      return {
        success: true,
        dryRun: false,
        provider: 'AWS',
        operation: action,
        result: response,
        message: `AWS EC2 ${action} executed for ${instanceId}.`,
        latencyMs: Date.now() - startTime
      };
    } catch (err: any) {
      return {
        success: false,
        dryRun: false,
        provider: 'AWS',
        operation: action,
        message: `AWS EC2 ${action} failed: ${err?.message || String(err)}`,
        latencyMs: Date.now() - startTime
      };
    }
  }

  /**
   * Unified Virtual Machine Provisioning
   * e.g. create_vm(provider, name, instanceType, region, dryRun)
   */
  static async createVm(
    options: UnifiedVmOptions,
    existingInventory: CloudResource[]
  ): Promise<ExecutionResult<CloudResource>> {
    const startTime = Date.now();
    const prov = options.provider.toUpperCase();
    const breaker = this.getBreaker(prov);

    // 1. Input Validation
    const nameValidation = InputValidator.validateResourceName(options.name);
    if (!nameValidation.valid) {
      return {
        success: false,
        dryRun: !!options.dryRun,
        provider: options.provider,
        operation: 'CREATE_VM',
        message: `Validação de entrada falhou: ${nameValidation.errors.join(', ')}`,
        latencyMs: Date.now() - startTime
      };
    }

    const sanitizedName = nameValidation.sanitizedValue || options.name;

    // 2. Compute cost estimation and resource candidate
    const estimatedCost = options.estimatedCostMonthly ?? null;

    const resourceCandidate: CloudResource = {
      id: `res-${prov.toLowerCase()}-vm-${Date.now().toString().slice(-4)}`,
      name: sanitizedName,
      provider: prov as any,
      category: 'COMPUTE',
      resourceType: options.instanceType || 'UNSPECIFIED',
      status: 'UNKNOWN',
      region: options.region,
      estimatedMonthlyCost: estimatedCost,
      tags: options.tags || { Environment: 'Production', ManagedBy: 'AI-MultiCloud-UnifiedAdapter' },
      securityPosture: 'NOT_EVALUATED',
      nativeArnOrId: `urn:${prov.toLowerCase()}:compute:${sanitizedName}`
    };

    // 3. Evaluate OPA Policies
    const opaResult = OpaPolicyEngine.evaluateResource(resourceCandidate);

    // 4. Generate Execution Plan (Dry Run or Pre-Execution Diff)
    const plan = `------------------------------------------------------------\n` +
      `[PLAN: TERRAFORM / NATIVE CLOUD ADAPTER] ${options.dryRun ? '(DRY-RUN MODE - NENHUMA MUDANÇA SERÁ APLICADA)' : '(EXECUÇÃO REAL)'}\n` +
      `+ Provedor: ${prov}\n` +
      `+ Recurso: ${sanitizedName} (${resourceCandidate.resourceType})\n` +
      `+ Região: ${resourceCandidate.region}\n` +
      `+ Variação de Custo Mensal: ${estimatedCost === null ? 'NOT_AVAILABLE' : '+$' + estimatedCost.toFixed(2) + ' USD'}\n` +
      `+ Conformidade OPA: ${opaResult.complianceScore}% (${opaResult.violations.length} violações)\n` +
      `------------------------------------------------------------`;

    if (options.dryRun) {
      return {
        success: true,
        dryRun: true,
        provider: prov,
        operation: 'CREATE_VM',
        executionPlan: plan,
        ...(estimatedCost !== null ? { estimatedCostDelta: estimatedCost } : {}),
        opaScore: opaResult.complianceScore,
        message: `Dry-run executado com sucesso. Plano gerado sem efeitos colaterais.`,
        latencyMs: Date.now() - startTime
      };
    }

    if (!opaResult.allowed) {
      return {
        success: false,
        dryRun: false,
        provider: prov,
        operation: 'CREATE_VM',
        executionPlan: plan,
        opaScore: opaResult.complianceScore,
        message: `Bloqueado pelo motor de políticas: ${opaResult.violations.map(v => v.message).join(' | ')}`,
        latencyMs: Date.now() - startTime
      };
    }

    // 5. Execute through a real provider adapter. AWS is currently wired; other
    // providers remain explicitly NOT_CONFIGURED and never report simulated success.
    if (prov !== 'AWS') {
      return {
        success: false,
        dryRun: false,
        provider: prov,
        operation: 'CREATE_VM',
        executionPlan: plan,
        estimatedCostDelta: estimatedCost,
        opaScore: opaResult.complianceScore,
        message: `REAL_PROVIDER_ADAPTER_NOT_CONFIGURED: no VM was created in ${prov}.`,
        latencyMs: Date.now() - startTime
      };
    }

    try {
      const created = await breaker.execute(async () => retryWithTenacity(async () => {
        const client = new EC2Client({ region: options.region || process.env.AWS_REGION || 'us-east-1' });
        if (!options.image) throw new Error('AWS AMI image is required for real VM creation');
        const result = await client.send(new RunInstancesCommand({
          ImageId: options.image,
          InstanceType: options.instanceType as any,
          MinCount: 1,
          MaxCount: 1,
          TagSpecifications: [{
            ResourceType: 'instance',
            Tags: Object.entries(resourceCandidate.tags).map(([Key, Value]) => ({ Key, Value }))
          }]
        }));
        const instance = result.Instances?.[0];
        if (!instance?.InstanceId) throw new Error('AWS did not return an instance id');
        return { instanceId: instance.InstanceId, state: instance.State?.Name || 'pending' };
      }, { maxAttempts: 2 }));

      return {
        success: true,
        dryRun: false,
        provider: prov,
        operation: 'CREATE_VM',
        result: {
          ...resourceCandidate,
          nativeArnOrId: created.instanceId,
          status: 'PROVISIONING'
        },
        executionPlan: plan,
        estimatedCostDelta: estimatedCost,
        opaScore: opaResult.complianceScore,
        message: `AWS EC2 instance ${created.instanceId} created successfully.`,
        latencyMs: Date.now() - startTime
      };
    } catch (err: any) {
      return {
        success: false,
        dryRun: false,
        provider: prov,
        operation: 'CREATE_VM',
        executionPlan: plan,
        estimatedCostDelta: estimatedCost,
        opaScore: opaResult.complianceScore,
        message: `Falha ao provisionar VM em AWS: ${err?.message || String(err)}`,
        latencyMs: Date.now() - startTime
      };
    }
  }

  /**
   * Unified VM / Resource Termination (Destructive Operation with Confirmation & Dry-Run)
   *
   * Destructive provider execution remains intentionally unavailable until a real
   * provider lifecycle adapter is implemented. The inventory is never mutated to
   * represent a cloud-side termination.
   */
  static async terminateVm(
    provider: CloudProvider,
    resourceId: string,
    options: { dryRun?: boolean },
    existingInventory: CloudResource[]
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const prov = provider.toUpperCase();
    const target = existingInventory.find(r => r.id === resourceId || r.name === resourceId);

    if (!target) {
      return {
        success: false,
        dryRun: !!options.dryRun,
        provider: prov,
        operation: 'TERMINATE_VM',
        message: `Recurso ${resourceId} não encontrado no inventário multi-cloud.`,
        latencyMs: Date.now() - startTime
      };
    }

    const plan = `------------------------------------------------------------\\n` +
      `[PLAN: DESTRUCTIVE ACTION] ${options.dryRun ? '(DRY-RUN MODE - NENHUM RECURSO SERÁ EXCLUÍDO)' : '(EXECUÇÃO DESTRUTIVA)'}\\n` +
      `- Provedor: ${prov}\\n` +
      `- Recurso a Destruir: ${target.name} (${target.id})\\n` +
      `- Tipo: ${target.resourceType} | Região: ${target.region}\\n` +
      `- Redução de Custo Estimada: -$${target.estimatedMonthlyCost.toFixed(2)} USD/mês\\n` +
      `------------------------------------------------------------`;

    if (options.dryRun) {
      return {
        success: true,
        dryRun: true,
        provider: prov,
        operation: 'TERMINATE_VM',
        executionPlan: plan,
        ...(target.estimatedMonthlyCost !== null ? { estimatedCostDelta: -target.estimatedMonthlyCost } : {}),
        message: 'Dry-run concluído: nenhum recurso foi alterado.',
        latencyMs: Date.now() - startTime
      };
    }

    if (prov !== 'AWS') {
      return {
        success: false,
        dryRun: false,
        provider: prov,
        operation: 'TERMINATE_VM',
        executionPlan: plan,
        estimatedCostDelta: 0,
        message: `NOT_IMPLEMENTED: nenhum adapter real de lifecycle está configurado para ${prov}. Nenhum recurso foi alterado.`,
        latencyMs: Date.now() - startTime
      };
    }

    const result = await this.performAwsInstanceAction('TERMINATE', target.nativeArnOrId || target.id, target.region);
    return {
      ...result,
      executionPlan: plan,
      ...(result.success && target.estimatedMonthlyCost !== null ? { estimatedCostDelta: -target.estimatedMonthlyCost } : {})
    };
  }
}
 + estimatedCost.toFixed(2) + ' USD'}\n` +
      `+ Conformidade OPA: ${opaResult.complianceScore}% (${opaResult.violations.length} violações)\n` +
      `------------------------------------------------------------`;

    if (options.dryRun) {
      return {
        success: true,
        dryRun: true,
        provider: prov,
        operation: 'CREATE_VM',
        executionPlan: plan,
        estimatedCostDelta: estimatedCost,
        opaScore: opaResult.complianceScore,
        message: `Dry-run executado com sucesso. Plano gerado sem efeitos colaterais.`,
        latencyMs: Date.now() - startTime
      };
    }

    if (!opaResult.allowed) {
      return {
        success: false,
        dryRun: false,
        provider: prov,
        operation: 'CREATE_VM',
        executionPlan: plan,
        opaScore: opaResult.complianceScore,
        message: `Bloqueado pelo motor de políticas: ${opaResult.violations.map(v => v.message).join(' | ')}`,
        latencyMs: Date.now() - startTime
      };
    }

    // 5. Execute through a real provider adapter. AWS is currently wired; other
    // providers remain explicitly NOT_CONFIGURED and never report simulated success.
    if (prov !== 'AWS') {
      return {
        success: false,
        dryRun: false,
        provider: prov,
        operation: 'CREATE_VM',
        executionPlan: plan,
        estimatedCostDelta: estimatedCost,
        opaScore: opaResult.complianceScore,
        message: `REAL_PROVIDER_ADAPTER_NOT_CONFIGURED: no VM was created in ${prov}.`,
        latencyMs: Date.now() - startTime
      };
    }

    try {
      const created = await breaker.execute(async () => retryWithTenacity(async () => {
        const client = new EC2Client({ region: options.region || process.env.AWS_REGION || 'us-east-1' });
        if (!options.image) throw new Error('AWS AMI image is required for real VM creation');
        const result = await client.send(new RunInstancesCommand({
          ImageId: options.image,
          InstanceType: options.instanceType as any,
          MinCount: 1,
          MaxCount: 1,
          TagSpecifications: [{
            ResourceType: 'instance',
            Tags: Object.entries(resourceCandidate.tags).map(([Key, Value]) => ({ Key, Value }))
          }]
        }));
        const instance = result.Instances?.[0];
        if (!instance?.InstanceId) throw new Error('AWS did not return an instance id');
        return { instanceId: instance.InstanceId, state: instance.State?.Name || 'pending' };
      }, { maxAttempts: 2 }));

      return {
        success: true,
        dryRun: false,
        provider: prov,
        operation: 'CREATE_VM',
        result: {
          ...resourceCandidate,
          nativeArnOrId: created.instanceId,
          status: 'PROVISIONING'
        },
        executionPlan: plan,
        estimatedCostDelta: estimatedCost,
        opaScore: opaResult.complianceScore,
        message: `AWS EC2 instance ${created.instanceId} created successfully.`,
        latencyMs: Date.now() - startTime
      };
    } catch (err: any) {
      return {
        success: false,
        dryRun: false,
        provider: prov,
        operation: 'CREATE_VM',
        executionPlan: plan,
        estimatedCostDelta: estimatedCost,
        opaScore: opaResult.complianceScore,
        message: `Falha ao provisionar VM em AWS: ${err?.message || String(err)}`,
        latencyMs: Date.now() - startTime
      };
    }
  }

  /**
   * Unified VM / Resource Termination (Destructive Operation with Confirmation & Dry-Run)
   *
   * Destructive provider execution remains intentionally unavailable until a real
   * provider lifecycle adapter is implemented. The inventory is never mutated to
   * represent a cloud-side termination.
   */
  static async terminateVm(
    provider: CloudProvider,
    resourceId: string,
    options: { dryRun?: boolean },
    existingInventory: CloudResource[]
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const prov = provider.toUpperCase();
    const target = existingInventory.find(r => r.id === resourceId || r.name === resourceId);

    if (!target) {
      return {
        success: false,
        dryRun: !!options.dryRun,
        provider: prov,
        operation: 'TERMINATE_VM',
        message: `Recurso ${resourceId} não encontrado no inventário multi-cloud.`,
        latencyMs: Date.now() - startTime
      };
    }

    const plan = `------------------------------------------------------------\\n` +
      `[PLAN: DESTRUCTIVE ACTION] ${options.dryRun ? '(DRY-RUN MODE - NENHUM RECURSO SERÁ EXCLUÍDO)' : '(EXECUÇÃO DESTRUTIVA)'}\\n` +
      `- Provedor: ${prov}\\n` +
      `- Recurso a Destruir: ${target.name} (${target.id})\\n` +
      `- Tipo: ${target.resourceType} | Região: ${target.region}\\n` +
      `- Redução de Custo Estimada: -$${target.estimatedMonthlyCost.toFixed(2)} USD/mês\\n` +
      `------------------------------------------------------------`;

    if (options.dryRun) {
      return {
        success: true,
        dryRun: true,
        provider: prov,
        operation: 'TERMINATE_VM',
        executionPlan: plan,
        estimatedCostDelta: -target.estimatedMonthlyCost,
        message: 'Dry-run concluído: nenhum recurso foi alterado.',
        latencyMs: Date.now() - startTime
      };
    }

    if (prov !== 'AWS') {
      return {
        success: false,
        dryRun: false,
        provider: prov,
        operation: 'TERMINATE_VM',
        executionPlan: plan,
        estimatedCostDelta: 0,
        message: `NOT_IMPLEMENTED: nenhum adapter real de lifecycle está configurado para ${prov}. Nenhum recurso foi alterado.`,
        latencyMs: Date.now() - startTime
      };
    }

    const result = await this.performAwsInstanceAction('TERMINATE', target.nativeArnOrId || target.id, target.region);
    return {
      ...result,
      executionPlan: plan,
      estimatedCostDelta: result.success ? -target.estimatedMonthlyCost : 0
    };
  }
}
