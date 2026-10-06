import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BackupDrManager } from '../src/core/backupManager';

describe('Multi-Cloud Backup & Disaster Recovery Tests', () => {
  it('deve declarar backup/DR como NOT_CONFIGURED sem adapter real', () => {
    const tasks = BackupDrManager.getAllTasks();
    assert.equal(tasks.length, 0);

    const metrics = BackupDrManager.getMetrics();
    assert.equal(metrics.totalDataGb, '0.0');
    assert.equal(metrics.activeTasksCount, 0);
    assert.equal(metrics.successRate, 0);
    assert.equal(metrics.avgRpoHours, '0.0');
    assert.equal(metrics.avgRtoMinutes, 0);
    assert.equal(metrics.crossCloudEnabled, false);
  });

  it('não deve simular execução de backup', async () => {
    const result = await BackupDrManager.triggerBackup('missing-task');
    assert.equal(result.success, false);
    assert.match(result.message, /^NOT_CONFIGURED:/);
    assert.equal(result.task, undefined);
  });

  it('não deve simular um recovery drill', async () => {
    const result = await BackupDrManager.testRecoveryDrill('missing-task');
    assert.equal(result.success, false);
    assert.equal(result.rtoAchievedMinutes, 0);
    assert.match(result.message, /^NOT_CONFIGURED:/);
  });

  it('não deve cadastrar agenda persistente sem adapter real', () => {
    assert.throws(
      () => BackupDrManager.addSchedule({
        name: 'PostgreSQL Cross-Backup to Azure',
        sourceProvider: 'AWS',
        targetProvider: 'AZURE',
        resourceId: 'res-aws-03',
        resourceName: 'aurora-pg-primary',
        sizeGb: 150,
        scheduleCron: '0 */12 * * * (A cada 12 horas)',
        rpoHours: 2,
        rtoMinutes: 15
      }),
      /NOT_CONFIGURED:/
    );
  });
});
