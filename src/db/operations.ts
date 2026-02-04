import { v4 as uuid } from 'uuid';
import { db } from './database';
import { FOLDER_COLORS } from '../types';
import type { Folder, TaskGroup, Task, PendingClassification } from '../types';

// ============================================================
// Folders
// ============================================================

export async function createFolder(
  data: Pick<Folder, 'name'> & Partial<Pick<Folder, 'color' | 'llmContext' | 'keywords'>>
): Promise<Folder> {
  const now = new Date().toISOString();
  const count = await db.folders.count();
  const color = data.color ?? FOLDER_COLORS[count % FOLDER_COLORS.length];

  const folder: Folder = {
    id: uuid(),
    name: data.name,
    color,
    order: count,
    llmContext: data.llmContext ?? '',
    keywords: data.keywords ?? [],
    createdAt: now,
    updatedAt: now,
  };

  await db.folders.add(folder);
  return folder;
}

export async function getFolders(): Promise<Folder[]> {
  return db.folders.orderBy('order').toArray();
}

export async function getFolder(id: string): Promise<Folder | undefined> {
  return db.folders.get(id);
}

export async function updateFolder(
  id: string,
  changes: Partial<Omit<Folder, 'id' | 'createdAt'>>
): Promise<void> {
  await db.folders.update(id, {
    ...changes,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteFolder(id: string): Promise<void> {
  await db.transaction('rw', [db.folders, db.taskGroups, db.tasks], async () => {
    await db.tasks.where('folderId').equals(id).delete();
    await db.taskGroups.where('folderId').equals(id).delete();
    await db.folders.delete(id);
  });
}

export async function reorderFolders(orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.folders, async () => {
    const now = new Date().toISOString();
    for (let i = 0; i < orderedIds.length; i++) {
      await db.folders.update(orderedIds[i], { order: i, updatedAt: now });
    }
  });
}

// ============================================================
// Task Groups
// ============================================================

export async function createTaskGroup(
  data: Pick<TaskGroup, 'folderId' | 'name'>
): Promise<TaskGroup> {
  const now = new Date().toISOString();
  const count = await db.taskGroups.where('folderId').equals(data.folderId).count();

  const group: TaskGroup = {
    id: uuid(),
    folderId: data.folderId,
    name: data.name,
    order: count,
    isCollapsed: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.taskGroups.add(group);
  return group;
}

export async function getTaskGroups(folderId: string): Promise<TaskGroup[]> {
  return db.taskGroups.where('folderId').equals(folderId).sortBy('order');
}

export async function updateTaskGroup(
  id: string,
  changes: Partial<Omit<TaskGroup, 'id' | 'folderId' | 'createdAt'>>
): Promise<void> {
  await db.taskGroups.update(id, {
    ...changes,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteTaskGroup(id: string): Promise<void> {
  await db.transaction('rw', [db.taskGroups, db.tasks], async () => {
    // Las tareas del grupo pasan a "General" (taskGroupId = null)
    await db.tasks.where('taskGroupId').equals(id).modify({ taskGroupId: null });
    await db.taskGroups.delete(id);
  });
}

export async function reorderTaskGroups(folderId: string, orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.taskGroups, async () => {
    const now = new Date().toISOString();
    for (let i = 0; i < orderedIds.length; i++) {
      await db.taskGroups.update(orderedIds[i], { order: i, updatedAt: now });
    }
  });
  // Suppress unused variable warning
  void folderId;
}

// ============================================================
// Tasks
// ============================================================

export async function createTask(
  data: Pick<Task, 'folderId' | 'text'> &
    Partial<Pick<Task, 'taskGroupId' | 'priority'>>
): Promise<Task> {
  const now = new Date().toISOString();

  // Calcular order: última posición dentro de su grupo
  let count: number;
  if (data.taskGroupId) {
    count = await db.tasks
      .where('taskGroupId')
      .equals(data.taskGroupId)
      .count();
  } else {
    count = await db.tasks
      .where('[folderId+taskGroupId]')
      .between([data.folderId, ''], [data.folderId, '\uffff'])
      .count()
      .catch(() =>
        // Fallback: si el índice compuesto no existe, contamos manualmente
        db.tasks
          .where('folderId')
          .equals(data.folderId)
          .filter((t) => t.taskGroupId === null)
          .count()
      );
  }

  const task: Task = {
    id: uuid(),
    folderId: data.folderId,
    taskGroupId: data.taskGroupId ?? null,
    text: data.text,
    priority: data.priority ?? null,
    isCompleted: false,
    isArchived: false,
    order: count,
    createdAt: now,
    updatedAt: now,
  };

  await db.tasks.add(task);
  return task;
}

export async function getTasks(folderId: string): Promise<Task[]> {
  return db.tasks.where('folderId').equals(folderId).sortBy('order');
}

export async function getTasksByGroup(
  folderId: string,
  taskGroupId: string | null
): Promise<Task[]> {
  return db.tasks
    .where('folderId')
    .equals(folderId)
    .filter((t) => t.taskGroupId === taskGroupId)
    .sortBy('order');
}

export async function getPendingTaskCount(folderId: string): Promise<number> {
  return db.tasks
    .where('folderId')
    .equals(folderId)
    .filter((t) => !t.isCompleted && !t.isArchived)
    .count();
}

export async function updateTask(
  id: string,
  changes: Partial<Omit<Task, 'id' | 'createdAt'>>
): Promise<void> {
  await db.tasks.update(id, {
    ...changes,
    updatedAt: new Date().toISOString(),
  });
}

export async function toggleTaskCompleted(id: string): Promise<void> {
  const task = await db.tasks.get(id);
  if (!task) return;
  await db.tasks.update(id, {
    isCompleted: !task.isCompleted,
    updatedAt: new Date().toISOString(),
  });
}

export async function archiveTask(id: string): Promise<void> {
  await db.tasks.update(id, {
    isArchived: true,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id);
}

export async function reorderTasks(orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.tasks, async () => {
    const now = new Date().toISOString();
    for (let i = 0; i < orderedIds.length; i++) {
      await db.tasks.update(orderedIds[i], { order: i, updatedAt: now });
    }
  });
}

// ============================================================
// Pending Classifications (cola offline)
// ============================================================

export async function addPendingClassification(
  taskId: string,
  rawText: string
): Promise<PendingClassification> {
  const entry: PendingClassification = {
    id: uuid(),
    taskId,
    rawText,
    createdAt: new Date().toISOString(),
  };
  await db.pendingClassifications.add(entry);
  return entry;
}

export async function getPendingClassifications(): Promise<PendingClassification[]> {
  return db.pendingClassifications.orderBy('createdAt').toArray();
}

export async function removePendingClassification(id: string): Promise<void> {
  await db.pendingClassifications.delete(id);
}
