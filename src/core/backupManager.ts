import { BackupTask, CloudProvider } from '../types';

export class BackupDrManager {
  private static tasks: BackupTask[] = [];

  static getAllTasks(): BackupTask[] {
    return [...this.tasks];
  }

  static getMetrics() {
    return {
      totalDataGb: '0.0',
      activeTasksCount: 0,
      successRate: 0,
      avgRpoHours: '0.0',
      avgRtoMinutes: 0,
      crossCloudEnabled: false
    };
  }

  static async triggerBackup(taskId: string): Promise<{ success: boolean; message: string; task?: BackupTask }> {
    return {
      success: false,
      message: `NOT_CONFIGURED: no real cross-cloud backup adapter is configured for task ${taskId}. No data was copied or mutated.`
    };
  }

  static async testRecoveryDrill(taskId: string): Promise<{ success: boolean; rtoAchievedMinutes: number; message: string }> {
    return {
      success: false,
      rtoAchievedMinutes: 0,
      message: `NOT_CONFIGURED: no real recovery adapter is configured for task ${taskId}. No restore was simulated.`
    };
  }

  static addSchedule(params: {
    name: string;
    sourceProvider: CloudProvider;
    targetProvider: CloudProvider;
    resourceId: string;
    resourceName: string;
    sizeGb: number;
    scheduleCron: string;
    rpoHours: number;
    rtoMinutes: number;
  }): BackupTask {
    throw new Error('NOT_CONFIGURED: persistent backup scheduling requires a real provider/storage adapter');
  }
}
