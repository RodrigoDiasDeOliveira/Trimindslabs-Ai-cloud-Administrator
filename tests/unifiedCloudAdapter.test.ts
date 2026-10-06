import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { UnifiedCloudService } from '../src/core/unifiedCloudAdapter';
import { CloudResource } from '../src/types';

describe('Unified Multi-Cloud Abstraction Layer Tests', () => {
  const mockInventory: CloudResource[] = [
    {
      id: 'res-test-01',
      name: 'test-ec2-node',
      provider: 'AWS',
      category: 'COMPUTE',
      resourceType: 'EC2 t3.large',
      status: 'RUNNING',
      region: 'us-east-1',
      estimatedMonthlyCost: 67.20,
      tags: { Environment: 'Production', Owner: 'DevOps' },
      securityPosture: 'SECURE',
      nativeArnOrId: 'i-1234567890abcdef0'
    }
  ];

  it('deve manter o Dry-Run sem alterar o inventário', async () => {
    const initialCount = mockInventory.length;
    const result = await UnifiedCloudService.createVm(
      {
        provider: 'AWS',
        name: 'test-dry-run-instance',
        instanceType: 't3.micro',
        region: 'us-east-1',
        dryRun: true,
        tags: { Environment: 'Production', Owner: 'CoreOps' }
      },
      mockInventory
    );

    assert.equal(result.success, true);
    assert.equal(result.dryRun, true);
    assert.ok(result.executionPlan?.includes('DRY-RUN MODE'));
    assert.equal(mockInventory.length, initialCount);
  });

  it('não deve simular provisionamento em provider sem adapter real', async () => {
    const initialCount = mockInventory.length;
    const result = await UnifiedCloudService.createVm(
      {
        provider: 'GCP',
        name: 'test-real-compute-gcp',
        instanceType: 'e2-standard-2',
        region: 'us-central1',
        dryRun: false,
        tags: { Environment: 'Production', Owner: 'GCPTeam' }
      },
      mockInventory
    );

    assert.equal(result.success, false);
    assert.equal(result.dryRun, false);
    assert.equal(mockInventory.length, initialCount);
    assert.match(result.message, /^REAL_PROVIDER_ADAPTER_NOT_CONFIGURED:/);
  });

  it('deve manter o término em Dry-Run sem alterar o inventário', async () => {
    const target = mockInventory[0];
    const initialCount = mockInventory.length;

    const result = await UnifiedCloudService.terminateVm('AWS', target.id, { dryRun: true }, mockInventory);

    assert.equal(result.success, true);
    assert.equal(result.dryRun, true);
    assert.ok(result.executionPlan?.includes('DRY-RUN MODE'));
    assert.equal(result.estimatedCostDelta, -target.estimatedMonthlyCost);
    assert.equal(mockInventory.length, initialCount);
  });

  it('deve reportar providers sem adapter real como não configurados', async () => {
    for (const provider of ['AZURE', 'GCP', 'OCI'] as const) {
      const probe = await UnifiedCloudService.performHealthProbe(provider);
      assert.equal(probe.provider, provider);
      assert.equal(probe.success, false);
      assert.equal(probe.statusCode, 503);
      assert.match(probe.message, /^NOT_CONFIGURED:/);
    }
  });

  it('deve executar probe AWS apenas quando credenciais reais estiverem disponíveis', async () => {
    const probe = await UnifiedCloudService.performHealthProbe('AWS');
    assert.equal(probe.provider, 'AWS');
    if (probe.success) {
      assert.equal(probe.statusCode, 200);
      assert.ok(probe.latencyMs > 0);
      assert.match(probe.message, /^AWS identity verified/);
    } else {
      assert.equal(probe.statusCode, 503);
      assert.ok(probe.message.length > 0);
    }
  });
});
