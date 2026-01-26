import type { SyncProvider, Task } from '../../types';
import { getAllTasks, bulkUpsertTasks, getLastSyncTime, setLastSyncTime } from '../../db/database';

/**
 * Local-only sync provider
 *
 * This provider doesn't actually sync anywhere - it's the default
 * provider that just stores everything locally in IndexedDB.
 */
export class LocalSyncProvider implements SyncProvider {
  name = 'local';

  async isAvailable(): Promise<boolean> {
    // Local storage is always available
    return true;
  }

  async push(tasks: Task[]): Promise<void> {
    // Local provider just saves to IndexedDB
    await bulkUpsertTasks(tasks);
    await setLastSyncTime(this.name, new Date().toISOString());
  }

  async pull(): Promise<Task[]> {
    // Pull just returns local tasks
    return getAllTasks();
  }

  async getLastSyncTime(): Promise<string | null> {
    return getLastSyncTime(this.name);
  }
}

export const localSyncProvider = new LocalSyncProvider();
