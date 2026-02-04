import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './database';
import {
  createFolder,
  getFolders,
  getFolder,
  updateFolder,
  deleteFolder,
  reorderFolders,
  createTaskGroup,
  getTaskGroups,
  updateTaskGroup,
  deleteTaskGroup,
  createTask,
  getTasks,
  getTasksByGroup,
  getPendingTaskCount,
  updateTask,
  toggleTaskCompleted,
  archiveTask,
  deleteTask,
  reorderTasks,
  addPendingClassification,
  getPendingClassifications,
  removePendingClassification,
} from './operations';
import { FOLDER_COLORS } from '../types';

beforeEach(async () => {
  await db.folders.clear();
  await db.taskGroups.clear();
  await db.tasks.clear();
  await db.pendingClassifications.clear();
});

// ============================================================
// Folders
// ============================================================

describe('Folders CRUD', () => {
  it('creates a folder with auto-assigned color', async () => {
    const folder = await createFolder({ name: 'Trabajo' });
    expect(folder.name).toBe('Trabajo');
    expect(folder.color).toBe(FOLDER_COLORS[0]);
    expect(folder.order).toBe(0);
    expect(folder.llmContext).toBe('');
    expect(folder.keywords).toEqual([]);
  });

  it('auto-rotates colors for new folders', async () => {
    const f1 = await createFolder({ name: 'A' });
    const f2 = await createFolder({ name: 'B' });
    const f3 = await createFolder({ name: 'C' });
    expect(f1.color).toBe(FOLDER_COLORS[0]);
    expect(f2.color).toBe(FOLDER_COLORS[1]);
    expect(f3.color).toBe(FOLDER_COLORS[2]);
  });

  it('lists folders ordered by order field', async () => {
    await createFolder({ name: 'B' });
    await createFolder({ name: 'A' });
    const folders = await getFolders();
    expect(folders).toHaveLength(2);
    expect(folders[0].name).toBe('B');
    expect(folders[1].name).toBe('A');
  });

  it('gets a folder by id', async () => {
    const created = await createFolder({ name: 'Test' });
    const found = await getFolder(created.id);
    expect(found).toBeDefined();
    expect(found!.name).toBe('Test');
  });

  it('updates a folder', async () => {
    const folder = await createFolder({ name: 'Old' });
    await updateFolder(folder.id, { name: 'New', llmContext: 'context' });
    const updated = await getFolder(folder.id);
    expect(updated!.name).toBe('New');
    expect(updated!.llmContext).toBe('context');
    expect(updated!.updatedAt).toBeDefined();
  });

  it('deletes a folder and its groups and tasks', async () => {
    const folder = await createFolder({ name: 'ToDelete' });
    const group = await createTaskGroup({ folderId: folder.id, name: 'G1' });
    await createTask({ folderId: folder.id, taskGroupId: group.id, text: 'T1' });

    await deleteFolder(folder.id);

    expect(await getFolders()).toHaveLength(0);
    expect(await getTaskGroups(folder.id)).toHaveLength(0);
    expect(await getTasks(folder.id)).toHaveLength(0);
  });

  it('reorders folders', async () => {
    const f1 = await createFolder({ name: 'First' });
    const f2 = await createFolder({ name: 'Second' });
    const f3 = await createFolder({ name: 'Third' });

    await reorderFolders([f3.id, f1.id, f2.id]);

    const folders = await getFolders();
    expect(folders[0].name).toBe('Third');
    expect(folders[1].name).toBe('First');
    expect(folders[2].name).toBe('Second');
  });
});

// ============================================================
// Task Groups
// ============================================================

describe('TaskGroups CRUD', () => {
  it('creates a task group in a folder', async () => {
    const folder = await createFolder({ name: 'F' });
    const group = await createTaskGroup({ folderId: folder.id, name: 'Urgente' });
    expect(group.folderId).toBe(folder.id);
    expect(group.name).toBe('Urgente');
    expect(group.isCollapsed).toBe(false);
    expect(group.order).toBe(0);
  });

  it('lists task groups for a folder', async () => {
    const folder = await createFolder({ name: 'F' });
    await createTaskGroup({ folderId: folder.id, name: 'A' });
    await createTaskGroup({ folderId: folder.id, name: 'B' });
    const groups = await getTaskGroups(folder.id);
    expect(groups).toHaveLength(2);
    expect(groups[0].name).toBe('A');
  });

  it('updates a task group', async () => {
    const folder = await createFolder({ name: 'F' });
    const group = await createTaskGroup({ folderId: folder.id, name: 'Old' });
    await updateTaskGroup(group.id, { name: 'New', isCollapsed: true });
    const groups = await getTaskGroups(folder.id);
    expect(groups[0].name).toBe('New');
    expect(groups[0].isCollapsed).toBe(true);
  });

  it('deleting a group moves its tasks to General (null)', async () => {
    const folder = await createFolder({ name: 'F' });
    const group = await createTaskGroup({ folderId: folder.id, name: 'G' });
    const task = await createTask({ folderId: folder.id, taskGroupId: group.id, text: 'T' });

    await deleteTaskGroup(group.id);

    const groups = await getTaskGroups(folder.id);
    expect(groups).toHaveLength(0);

    const tasks = await getTasks(folder.id);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe(task.id);
    expect(tasks[0].taskGroupId).toBeNull();
  });
});

// ============================================================
// Tasks
// ============================================================

describe('Tasks CRUD', () => {
  it('creates a task in General (no group)', async () => {
    const folder = await createFolder({ name: 'F' });
    const task = await createTask({ folderId: folder.id, text: 'Comprar leche' });
    expect(task.folderId).toBe(folder.id);
    expect(task.taskGroupId).toBeNull();
    expect(task.text).toBe('Comprar leche');
    expect(task.priority).toBeNull();
    expect(task.isCompleted).toBe(false);
    expect(task.isArchived).toBe(false);
  });

  it('creates a task with priority', async () => {
    const folder = await createFolder({ name: 'F' });
    const task = await createTask({ folderId: folder.id, text: 'Urgente', priority: 'high' });
    expect(task.priority).toBe('high');
  });

  it('lists tasks for a folder', async () => {
    const folder = await createFolder({ name: 'F' });
    await createTask({ folderId: folder.id, text: 'A' });
    await createTask({ folderId: folder.id, text: 'B' });
    const tasks = await getTasks(folder.id);
    expect(tasks).toHaveLength(2);
  });

  it('filters tasks by group', async () => {
    const folder = await createFolder({ name: 'F' });
    const group = await createTaskGroup({ folderId: folder.id, name: 'G' });
    await createTask({ folderId: folder.id, text: 'In General' });
    await createTask({ folderId: folder.id, taskGroupId: group.id, text: 'In Group' });

    const generalTasks = await getTasksByGroup(folder.id, null);
    expect(generalTasks).toHaveLength(1);
    expect(generalTasks[0].text).toBe('In General');

    const groupTasks = await getTasksByGroup(folder.id, group.id);
    expect(groupTasks).toHaveLength(1);
    expect(groupTasks[0].text).toBe('In Group');
  });

  it('counts pending tasks (not completed, not archived)', async () => {
    const folder = await createFolder({ name: 'F' });
    await createTask({ folderId: folder.id, text: 'Pending 1' });
    await createTask({ folderId: folder.id, text: 'Pending 2' });
    const done = await createTask({ folderId: folder.id, text: 'Done' });
    await toggleTaskCompleted(done.id);
    const archived = await createTask({ folderId: folder.id, text: 'Archived' });
    await archiveTask(archived.id);

    const count = await getPendingTaskCount(folder.id);
    expect(count).toBe(2);
  });

  it('toggles task completed', async () => {
    const folder = await createFolder({ name: 'F' });
    const task = await createTask({ folderId: folder.id, text: 'T' });
    expect(task.isCompleted).toBe(false);

    await toggleTaskCompleted(task.id);
    const t1 = await db.tasks.get(task.id);
    expect(t1!.isCompleted).toBe(true);

    await toggleTaskCompleted(task.id);
    const t2 = await db.tasks.get(task.id);
    expect(t2!.isCompleted).toBe(false);
  });

  it('archives a task', async () => {
    const folder = await createFolder({ name: 'F' });
    const task = await createTask({ folderId: folder.id, text: 'T' });
    await archiveTask(task.id);
    const updated = await db.tasks.get(task.id);
    expect(updated!.isArchived).toBe(true);
  });

  it('updates a task', async () => {
    const folder = await createFolder({ name: 'F' });
    const task = await createTask({ folderId: folder.id, text: 'Old' });
    await updateTask(task.id, { text: 'New', priority: 'mid' });
    const updated = await db.tasks.get(task.id);
    expect(updated!.text).toBe('New');
    expect(updated!.priority).toBe('mid');
  });

  it('deletes a task', async () => {
    const folder = await createFolder({ name: 'F' });
    const task = await createTask({ folderId: folder.id, text: 'T' });
    await deleteTask(task.id);
    const found = await db.tasks.get(task.id);
    expect(found).toBeUndefined();
  });

  it('reorders tasks', async () => {
    const folder = await createFolder({ name: 'F' });
    const t1 = await createTask({ folderId: folder.id, text: 'First' });
    const t2 = await createTask({ folderId: folder.id, text: 'Second' });
    const t3 = await createTask({ folderId: folder.id, text: 'Third' });

    await reorderTasks([t3.id, t1.id, t2.id]);

    const tasks = await getTasks(folder.id);
    expect(tasks[0].text).toBe('Third');
    expect(tasks[1].text).toBe('First');
    expect(tasks[2].text).toBe('Second');
  });
});

// ============================================================
// Pending Classifications
// ============================================================

describe('PendingClassifications', () => {
  it('adds and retrieves pending classifications', async () => {
    const folder = await createFolder({ name: 'F' });
    const task = await createTask({ folderId: folder.id, text: 'T' });
    await addPendingClassification(task.id, 'comprar leche');

    const pending = await getPendingClassifications();
    expect(pending).toHaveLength(1);
    expect(pending[0].rawText).toBe('comprar leche');
    expect(pending[0].taskId).toBe(task.id);
  });

  it('removes a pending classification', async () => {
    const folder = await createFolder({ name: 'F' });
    const task = await createTask({ folderId: folder.id, text: 'T' });
    const entry = await addPendingClassification(task.id, 'test');
    await removePendingClassification(entry.id);

    const pending = await getPendingClassifications();
    expect(pending).toHaveLength(0);
  });
});
