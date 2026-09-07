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

  it('deve simular criação de VM em Dry-Run sem alterar o inventário', async () => {
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
    assert.equal(mockInventory.length, initialCount, 'Inventário não deve ser alterado em dry-run');
  });

  it('deve provisionar VM na nuvem quando dryRun for false', async () => {
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

    assert.equal(result.success, true);
    assert.equal(result.dryRun, false);
    assert.equal(mockInventory.length, initialCount + 1);
    assert.equal(mockInventory[mockInventory.length - 1].provider, 'GCP');
  });

  it('deve simular término de recurso em Dry-Run calculando economia', async () => {
    const target = mockInventory[0];
    const initialCount = mockInventory.length;

    const result = await UnifiedCloudService.terminateVm('AWS', target.id, { dryRun: true }, mockInventory);

    assert.equal(result.success, true);
    assert.equal(result.dryRun, true);
    assert.ok(result.executionPlan?.includes('DRY-RUN MODE'));
    assert.equal(result.estimatedCostDelta, -target.estimatedMonthlyCost);
    assert.equal(mockInventory.length, initialCount, 'Recurso não deve ser removido em dry-run');
  });

  it('deve executar health probe real leve medindo latência', async () => {
    const awsProbe = await UnifiedCloudService.performHealthProbe('AWS');
    assert.equal(awsProbe.provider, 'AWS');
    assert.equal(awsProbe.success, true);
    assert.ok(awsProbe.latencyMs > 0);
    assert.equal(awsProbe.statusCode, 200);

    const azureProbe = await UnifiedCloudService.performHealthProbe('AZURE');
    assert.equal(azureProbe.provider, 'AZURE');
    assert.equal(azureProbe.success, true);
    assert.ok(azureProbe.latencyMs > 0);
  });
});
