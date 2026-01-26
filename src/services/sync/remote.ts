import type { SyncProvider, Task } from '../../types';
import { getLastSyncTime, setLastSyncTime } from '../../db/database';

/**
 * Remote sync provider (stubbed)
 *
 * This provider implements the interface for syncing to a remote server.
 * In v0, it's a stub that simulates network behavior.
 *
 * Future implementation would:
 * 1. Use a token for authentication
 * 2. Optionally encrypt data with a user passphrase (E2E)
 * 3. Sync to a REST API endpoint
 */
export class RemoteSyncProvider implements SyncProvider {
  name = 'remote';
  private token: string | null = null;

  // In-memory storage for stubbed server
  private mockServerStorage: Task[] = [];

  constructor(token?: string) {
    this.token = token || null;
  }

  setToken(token: string): void {
    this.token = token;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    // Stub: simulate network check
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }

  async push(tasks: Task[]): Promise<void> {
    if (!this.token) {
      throw new Error('No sync token configured');
    }

    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 200));

    // Stub: store in mock server storage
    this.mockServerStorage = [...tasks];
    await setLastSyncTime(this.name, new Date().toISOString());

    console.log(`[RemoteSync] Pushed ${tasks.length} tasks to server (stubbed)`);
  }

  async pull(): Promise<Task[]> {
    if (!this.token) {
      throw new Error('No sync token configured');
    }

    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 200));

    // Stub: return mock server storage
    console.log(`[RemoteSync] Pulled ${this.mockServerStorage.length} tasks from server (stubbed)`);
    return this.mockServerStorage;
  }

  async getLastSyncTime(): Promise<string | null> {
    return getLastSyncTime(this.name);
  }
}

// Singleton instance
export const remoteSyncProvider = new RemoteSyncProvider();

/**
 * Remote Sync API Contract
 *
 * This documents the expected API for a real remote sync implementation.
 *
 * Authentication:
 * - Uses a secret token (generated once, stored locally)
 * - Token sent in Authorization header
 *
 * Endpoints:
 *
 * GET /health
 * - Check if server is available
 * - Response: { "status": "ok" }
 *
 * PUT /tasks
 * - Upsert all tasks (full sync)
 * - Headers:
 *   - Authorization: Bearer <token>
 *   - Content-Type: application/json
 *   - X-Encrypted: true|false
 * - Body: Task[] (possibly encrypted)
 * - Response: { "synced": number, "timestamp": string }
 *
 * GET /tasks
 * - Retrieve all tasks
 * - Headers:
 *   - Authorization: Bearer <token>
 * - Response: Task[] (possibly encrypted)
 *
 * GET /tasks/since/:timestamp
 * - Retrieve tasks modified since timestamp (incremental sync)
 * - Headers:
 *   - Authorization: Bearer <token>
 * - Response: Task[] (possibly encrypted)
 *
 * DELETE /tasks/:id
 * - Delete a specific task
 * - Headers:
 *   - Authorization: Bearer <token>
 * - Response: { "deleted": true }
 */
export const REMOTE_SYNC_API_CONTRACT = {
  baseUrl: 'https://api.tareas.example.com',
  endpoints: {
    health: {
      method: 'GET',
      path: '/health',
      response: { status: 'ok' }
    },
    pushTasks: {
      method: 'PUT',
      path: '/tasks',
      headers: {
        Authorization: 'Bearer <token>',
        'Content-Type': 'application/json',
        'X-Encrypted': 'true|false'
      },
      body: 'Task[]',
      response: { synced: 'number', timestamp: 'string' }
    },
    pullTasks: {
      method: 'GET',
      path: '/tasks',
      headers: {
        Authorization: 'Bearer <token>'
      },
      response: 'Task[]'
    },
    pullTasksSince: {
      method: 'GET',
      path: '/tasks/since/:timestamp',
      headers: {
        Authorization: 'Bearer <token>'
      },
      response: 'Task[]'
    },
    deleteTask: {
      method: 'DELETE',
      path: '/tasks/:id',
      headers: {
        Authorization: 'Bearer <token>'
      },
      response: { deleted: 'boolean' }
    }
  }
};
