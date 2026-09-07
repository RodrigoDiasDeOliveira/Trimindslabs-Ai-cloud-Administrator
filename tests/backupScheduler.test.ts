import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BackupDrManager } from '../src/core/backupManager';

describe('Multi-Cloud Backup & Disaster Recovery Tests', () => {
  it('deve listar tarefas de backup multi-cloud e métricas de RPO/RTO', () => {
    const tasks = BackupDrManager.getAllTasks();
    assert.ok(tasks.length >= 3, 'Deve haver ao menos 3 tarefas cadastradas');

    const metrics = BackupDrManager.getMetrics();
    assert.ok(Number(metrics.totalDataGb) > 0);
    assert.ok(Number(metrics.avgRpoHours) > 0);
    assert.ok(metrics.avgRtoMinutes > 0);
    assert.equal(metrics.crossCloudEnabled, true);
  });

  it('deve executar backup imediato com replicação e hash de integridade', async () => {
    const tasks = BackupDrManager.getAllTasks();
    const task = tasks[0];

    const result = await BackupDrManager.triggerBackup(task.id);
    assert.equal(result.success, true);
    assert.equal(result.task.status, 'COMPLETED');
    assert.ok(result.task.verificationHash.startsWith('sha256-'));
  });

  it('deve simular teste de restauração (Drill DR) validando RTO', async () => {
    const tasks = BackupDrManager.getAllTasks();
    const task = tasks[0];

    const drillResult = await BackupDrManager.testRecoveryDrill(task.id);
    assert.equal(drillResult.success, true);
    assert.ok(drillResult.rtoAchievedMinutes <= task.rtoMinutes);
  });

  it('deve agendar uma nova tarefa de backup multi-cloud', () => {
    const initialCount = BackupDrManager.getAllTasks().length;

    const newTask = BackupDrManager.addSchedule({
      name: 'PostgreSQL Cross-Backup to Azure',
      sourceProvider: 'AWS',
      targetProvider: 'AZURE',
      resourceId: 'res-aws-03',
      resourceName: 'aurora-pg-primary',
      sizeGb: 150,
      scheduleCron: '0 */12 * * * (A cada 12 horas)',
      rpoHours: 2,
      rtoMinutes: 15
    });

    assert.equal(newTask.crossCloudReplicated, true);
    assert.equal(BackupDrManager.getAllTasks().length, initialCount + 1);
  });
});
