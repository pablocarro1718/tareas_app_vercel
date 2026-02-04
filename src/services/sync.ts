import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { db } from '../db/database';
import type { Folder, TaskGroup, Task } from '../types';

// ============================================================
// Push local changes to Firestore
// ============================================================

export async function pushFolder(folder: Folder): Promise<void> {
  try {
    await setDoc(doc(firestore, 'folders', folder.id), folder);
  } catch {
    // Offline – will sync when connection returns via listener
  }
}

export async function pushTaskGroup(group: TaskGroup): Promise<void> {
  try {
    await setDoc(doc(firestore, 'taskGroups', group.id), group);
  } catch {
    // Offline
  }
}

export async function pushTask(task: Task): Promise<void> {
  try {
    await setDoc(doc(firestore, 'tasks', task.id), task);
  } catch {
    // Offline
  }
}

export async function deleteRemoteFolder(id: string): Promise<void> {
  try {
    await deleteDoc(doc(firestore, 'folders', id));
  } catch {
    // Offline
  }
}

export async function deleteRemoteTaskGroup(id: string): Promise<void> {
  try {
    await deleteDoc(doc(firestore, 'taskGroups', id));
  } catch {
    // Offline
  }
}

export async function deleteRemoteTask(id: string): Promise<void> {
  try {
    await deleteDoc(doc(firestore, 'tasks', id));
  } catch {
    // Offline
  }
}

// ============================================================
// Push all local data to Firestore (initial sync)
// ============================================================

export async function pushAllToFirestore(): Promise<void> {
  try {
    const folders = await db.folders.toArray();
    const taskGroups = await db.taskGroups.toArray();
    const tasks = await db.tasks.toArray();

    for (const f of folders) await pushFolder(f);
    for (const g of taskGroups) await pushTaskGroup(g);
    for (const t of tasks) await pushTask(t);
  } catch {
    // Will retry on next sync
  }
}

// ============================================================
// Listen to Firestore changes and merge into IndexedDB
// ============================================================

let unsubFolders: Unsubscribe | null = null;
let unsubTaskGroups: Unsubscribe | null = null;
let unsubTasks: Unsubscribe | null = null;

// Flag to ignore snapshot updates triggered by our own writes
let ignoreNextSnapshot = false;

export function startSyncListeners(): void {
  // Folders
  unsubFolders = onSnapshot(collection(firestore, 'folders'), async (snapshot) => {
    if (ignoreNextSnapshot) return;
    for (const change of snapshot.docChanges()) {
      const data = change.doc.data() as Folder;
      if (change.type === 'added' || change.type === 'modified') {
        const local = await db.folders.get(data.id);
        // Only update if remote is newer or doesn't exist locally
        if (!local || data.updatedAt > local.updatedAt) {
          await db.folders.put(data);
        }
      } else if (change.type === 'removed') {
        await db.folders.delete(data.id);
      }
    }
  });

  // Task Groups
  unsubTaskGroups = onSnapshot(collection(firestore, 'taskGroups'), async (snapshot) => {
    if (ignoreNextSnapshot) return;
    for (const change of snapshot.docChanges()) {
      const data = change.doc.data() as TaskGroup;
      if (change.type === 'added' || change.type === 'modified') {
        const local = await db.taskGroups.get(data.id);
        if (!local || data.updatedAt > local.updatedAt) {
          await db.taskGroups.put(data);
        }
      } else if (change.type === 'removed') {
        await db.taskGroups.delete(data.id);
      }
    }
  });

  // Tasks
  unsubTasks = onSnapshot(collection(firestore, 'tasks'), async (snapshot) => {
    if (ignoreNextSnapshot) return;
    for (const change of snapshot.docChanges()) {
      const data = change.doc.data() as Task;
      if (change.type === 'added' || change.type === 'modified') {
        const local = await db.tasks.get(data.id);
        if (!local || data.updatedAt > local.updatedAt) {
          await db.tasks.put(data);
        }
      } else if (change.type === 'removed') {
        await db.tasks.delete(data.id);
      }
    }
  });
}

export function stopSyncListeners(): void {
  unsubFolders?.();
  unsubTaskGroups?.();
  unsubTasks?.();
  unsubFolders = null;
  unsubTaskGroups = null;
  unsubTasks = null;
}

/**
 * Temporarily ignore incoming snapshots (used when pushing local changes
 * so we don't re-apply our own writes).
 */
export function withIgnoreSnapshot(fn: () => Promise<void>): Promise<void> {
  ignoreNextSnapshot = true;
  return fn().finally(() => {
    setTimeout(() => {
      ignoreNextSnapshot = false;
    }, 500);
  });
}
