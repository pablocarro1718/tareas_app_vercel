import Dexie, { type Table } from 'dexie';
import type { Task, ParsingResult, AppSettings } from '../types';

export class TaskDatabase extends Dexie {
  tasks!: Table<Task>;
  parsingResults!: Table<ParsingResult>;
  settings!: Table<AppSettings & { id: string }>;
  syncMeta!: Table<{ id: string; lastSyncTime: string; provider: string }>;

  constructor() {
    super('TareasDB');

    this.version(1).stores({
      tasks: 'id, status, createdAt, updatedAt, dismissed, *blockPath, *tags',
      parsingResults: 'id, taskId, source, confidence',
      settings: 'id',
      syncMeta: 'id, provider'
    });
  }
}

export const db = new TaskDatabase();

// Default settings
const DEFAULT_SETTINGS: AppSettings & { id: string } = {
  id: 'app-settings',
  llmEnabled: false,
  syncEnabled: false,
  theme: 'dark',
  language: 'es'
};

// Initialize settings if not present
export async function initializeSettings(): Promise<AppSettings> {
  const existing = await db.settings.get('app-settings');
  if (!existing) {
    await db.settings.add(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return existing;
}

// Get current settings
export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get('app-settings');
  return settings || DEFAULT_SETTINGS;
}

// Update settings
export async function updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  await db.settings.update('app-settings', updates);
  const updated = await db.settings.get('app-settings');
  return updated || DEFAULT_SETTINGS;
}

// Task CRUD operations
export async function createTask(task: Task): Promise<string> {
  await db.tasks.add(task);
  return task.id;
}

export async function getTask(id: string): Promise<Task | undefined> {
  return db.tasks.get(id);
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  await db.tasks.update(id, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id);
  // Also delete associated parsing results
  await db.parsingResults.where('taskId').equals(id).delete();
}

export async function getAllTasks(): Promise<Task[]> {
  return db.tasks.toArray();
}

export async function getActiveTasks(): Promise<Task[]> {
  return db.tasks
    .filter(task => !task.dismissed && task.status !== 'done')
    .toArray();
}

export async function getTasksByStatus(status: Task['status']): Promise<Task[]> {
  return db.tasks.where('status').equals(status).toArray();
}

export async function getTasksByBlock(blockPath: string[]): Promise<Task[]> {
  return db.tasks
    .filter(task => {
      if (task.blockPath.length < blockPath.length) return false;
      return blockPath.every((segment, i) => task.blockPath[i] === segment);
    })
    .toArray();
}

export async function searchTasks(query: string): Promise<Task[]> {
  const lowerQuery = query.toLowerCase();
  return db.tasks
    .filter(task =>
      task.rawText.toLowerCase().includes(lowerQuery) ||
      task.title.toLowerCase().includes(lowerQuery) ||
      task.notes?.toLowerCase().includes(lowerQuery) ||
      task.blockPath.some(b => b.toLowerCase().includes(lowerQuery))
    )
    .toArray();
}

// Parsing results operations
export async function saveParsingResult(result: ParsingResult): Promise<void> {
  // Replace existing result for the same task
  await db.parsingResults.where('taskId').equals(result.taskId).delete();
  await db.parsingResults.add(result);
}

export async function getParsingResult(taskId: string): Promise<ParsingResult | undefined> {
  return db.parsingResults.where('taskId').equals(taskId).first();
}

// Sync metadata operations
export async function getLastSyncTime(provider: string): Promise<string | null> {
  const meta = await db.syncMeta.where('provider').equals(provider).first();
  return meta?.lastSyncTime || null;
}

export async function setLastSyncTime(provider: string, time: string): Promise<void> {
  const existing = await db.syncMeta.where('provider').equals(provider).first();
  if (existing) {
    await db.syncMeta.update(existing.id, { lastSyncTime: time });
  } else {
    await db.syncMeta.add({
      id: `sync-${provider}`,
      provider,
      lastSyncTime: time
    });
  }
}

// Bulk operations for sync
export async function bulkUpsertTasks(tasks: Task[]): Promise<void> {
  await db.tasks.bulkPut(tasks);
}

export async function clearAllTasks(): Promise<void> {
  await db.tasks.clear();
  await db.parsingResults.clear();
}
