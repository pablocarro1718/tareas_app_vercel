import Dexie, { type Table } from 'dexie';
import type { Folder, TaskGroup, Task, PendingClassification } from '../types';

export class TaskDatabase extends Dexie {
  folders!: Table<Folder, string>;
  taskGroups!: Table<TaskGroup, string>;
  tasks!: Table<Task, string>;
  pendingClassifications!: Table<PendingClassification, string>;

  constructor() {
    super('TareasDB');

    this.version(1).stores({
      folders: 'id, order, createdAt',
      taskGroups: 'id, folderId, order, createdAt',
      tasks: 'id, folderId, taskGroupId, isCompleted, isArchived, order, createdAt',
      pendingClassifications: 'id, taskId, createdAt',
    });

    // v2: Add notes field to tasks (default empty string)
    this.version(2).stores({
      folders: 'id, order, createdAt',
      taskGroups: 'id, folderId, order, createdAt',
      tasks: 'id, folderId, taskGroupId, isCompleted, isArchived, order, createdAt',
      pendingClassifications: 'id, taskId, createdAt',
    }).upgrade((tx) => {
      return tx.table('tasks').toCollection().modify((task) => {
        if (task.notes === undefined) {
          task.notes = '';
        }
      });
    });
  }
}

export const db = new TaskDatabase();
