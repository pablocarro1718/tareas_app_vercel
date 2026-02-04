import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  getPendingClassifications,
  removePendingClassification,
  getFolders,
  updateTask,
} from '../db/operations';
import { classifyTask, findFolderByName } from '../services/classifier';
import { getApiKey } from '../services/apiKey';

/**
 * Procesa la cola de clasificaciones pendientes cuando vuelve la conexión.
 */
export function useOfflineQueue() {
  const pending = useLiveQuery(() => getPendingClassifications(), [], []);

  useEffect(() => {
    const processQueue = async () => {
      const apiKey = getApiKey();
      if (!apiKey || !navigator.onLine || pending.length === 0) return;

      const folders = await getFolders();
      if (folders.length === 0) return;

      for (const entry of pending) {
        try {
          const suggestedName = await classifyTask(entry.rawText, folders, apiKey);
          const matchedFolder = suggestedName
            ? findFolderByName(suggestedName, folders)
            : null;

          if (matchedFolder) {
            await updateTask(entry.taskId, { folderId: matchedFolder.id });
          }

          await removePendingClassification(entry.id);
        } catch {
          // Keep in queue, retry next time
          break;
        }
      }
    };

    // Process on mount and when coming online
    processQueue();
    window.addEventListener('online', processQueue);
    return () => window.removeEventListener('online', processQueue);
  }, [pending]);
}
