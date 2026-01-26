import type { SyncProvider, Task } from '../../types';
import { localSyncProvider } from './local';
import { getAllTasks, bulkUpsertTasks } from '../../db/database';

export { localSyncProvider } from './local';
export { remoteSyncProvider, REMOTE_SYNC_API_CONTRACT } from './remote';

/**
 * Sync manager that coordinates between local and remote providers
 */
class SyncManager {
  private activeProvider: SyncProvider = localSyncProvider;

  setProvider(provider: SyncProvider): void {
    this.activeProvider = provider;
  }

  getProvider(): SyncProvider {
    return this.activeProvider;
  }

  /**
   * Sync local data with the active provider
   *
   * Strategy: Last-write-wins with timestamp comparison
   * In future versions, implement proper conflict resolution
   */
  async sync(): Promise<{ pushed: number; pulled: number }> {
    const isAvailable = await this.activeProvider.isAvailable();
    if (!isAvailable) {
      throw new Error(`Sync provider "${this.activeProvider.name}" is not available`);
    }

    // Get local tasks
    const localTasks = await getAllTasks();

    // Pull remote tasks
    const remoteTasks = await this.activeProvider.pull();

    // Merge strategy: compare by updatedAt timestamp
    const merged = this.mergeTasks(localTasks, remoteTasks);

    // Save merged results locally
    if (merged.length > 0) {
      await bulkUpsertTasks(merged);
    }

    // Push merged results to remote
    await this.activeProvider.push(merged);

    return {
      pushed: merged.length,
      pulled: remoteTasks.length
    };
  }

  /**
   * Merge local and remote tasks using last-write-wins strategy
   */
  private mergeTasks(local: Task[], remote: Task[]): Task[] {
    const taskMap = new Map<string, Task>();

    // Add all local tasks
    for (const task of local) {
      taskMap.set(task.id, task);
    }

    // Merge remote tasks (last-write-wins)
    for (const remoteTask of remote) {
      const localTask = taskMap.get(remoteTask.id);

      if (!localTask) {
        // New task from remote
        taskMap.set(remoteTask.id, remoteTask);
      } else {
        // Compare timestamps
        const localTime = new Date(localTask.updatedAt).getTime();
        const remoteTime = new Date(remoteTask.updatedAt).getTime();

        if (remoteTime > localTime) {
          taskMap.set(remoteTask.id, remoteTask);
        }
        // Otherwise keep local version
      }
    }

    return Array.from(taskMap.values());
  }

  /**
   * Force push all local data (overwrites remote)
   */
  async forcePush(): Promise<void> {
    const tasks = await getAllTasks();
    await this.activeProvider.push(tasks);
  }

  /**
   * Force pull all remote data (overwrites local)
   */
  async forcePull(): Promise<void> {
    const tasks = await this.activeProvider.pull();
    await bulkUpsertTasks(tasks);
  }
}

export const syncManager = new SyncManager();
