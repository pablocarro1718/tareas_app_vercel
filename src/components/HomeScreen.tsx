import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  getFolders,
  createFolder,
  reorderFolders,
  createTask,
  createTaskGroup,
  getTaskGroups,
  addPendingClassification,
} from '../db/operations';
import { FolderCard } from './FolderCard';
import { CreateFolderModal } from './CreateFolderModal';
import { ChatInput } from './ChatInput';
import { SettingsModal } from './SettingsModal';
import { useSortable } from '../hooks/useSortable';
import { parseTaskInput } from '../services/parser';
import { classifyTask, findFolderByName } from '../services/classifier';
import { getApiKey } from '../services/apiKey';

interface HomeScreenProps {
  onOpenFolder: (folderId: string) => void;
}

export function HomeScreen({ onOpenFolder }: HomeScreenProps) {
  const folders = useLiveQuery(() => getFolders(), [], []);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);

  const handleReorder = useCallback(
    async (fromIndex: number, toIndex: number) => {
      const ids = folders.map((f) => f.id);
      const [moved] = ids.splice(fromIndex, 1);
      ids.splice(toIndex, 0, moved);
      await reorderFolders(ids);
    },
    [folders]
  );

  const {
    containerRef,
    draggingIndex,
    overIndex,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useSortable({ onReorder: handleReorder });

  const handleCreateFolder = async (name: string, color: string) => {
    await createFolder({ name, color });
    setShowCreateModal(false);
  };

  const handleChatSubmit = async (rawText: string) => {
    if (folders.length === 0) return;

    const { text, taskGroupName, priority } = parseTaskInput(rawText);
    if (!text) return;

    setIsClassifying(true);

    try {
      // Determine target folder
      let targetFolderId: string;
      const apiKey = getApiKey();
      const isOnline = navigator.onLine;

      if (isOnline && apiKey) {
        // Try LLM classification
        const suggestedName = await classifyTask(text, folders, apiKey);
        const matchedFolder = suggestedName
          ? findFolderByName(suggestedName, folders)
          : null;
        targetFolderId = matchedFolder?.id ?? folders[0].id;
      } else if (!isOnline) {
        // Offline: use first folder, queue for later
        targetFolderId = folders[0].id;
      } else {
        // No API key: use first folder
        targetFolderId = folders[0].id;
      }

      // Determine task group (if specified with >)
      let taskGroupId: string | null = null;
      if (taskGroupName) {
        const existingGroups = await getTaskGroups(targetFolderId);
        const existingGroup = existingGroups.find(
          (g) => g.name.toLowerCase() === taskGroupName.toLowerCase()
        );
        if (existingGroup) {
          taskGroupId = existingGroup.id;
        } else {
          // Create new group
          const newGroup = await createTaskGroup({
            folderId: targetFolderId,
            name: taskGroupName,
          });
          taskGroupId = newGroup.id;
        }
      }

      // Create the task
      const task = await createTask({
        folderId: targetFolderId,
        taskGroupId: taskGroupId ?? undefined,
        text,
        priority,
      });

      // If offline, queue for classification later
      if (!isOnline) {
        await addPendingClassification(task.id, rawText);
      }
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-14 pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Tareas</h1>
        <div className="flex items-center gap-2">
          {/* Settings button */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 active:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a7.723 7.723 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Create folder button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-500 text-white active:bg-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </header>

      {/* Folder list */}
      <div
        ref={containerRef}
        className="flex-1 px-4 pb-4 space-y-2 overflow-y-auto"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-slate-400">
            <svg className="w-16 h-16 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            <p className="text-base">No hay carpetas</p>
            <p className="text-sm mt-1">Pulsa + para crear una</p>
          </div>
        ) : (
          folders.map((folder, index) => (
            <div
              key={folder.id}
              data-sortable-item
              onTouchStart={(e) => handleTouchStart(index, e)}
              className="transition-all duration-150"
              style={{
                opacity: draggingIndex === index ? 0.5 : 1,
                transform:
                  draggingIndex !== null &&
                  overIndex !== null &&
                  draggingIndex !== overIndex &&
                  index === overIndex
                    ? `translateY(${draggingIndex < overIndex ? -8 : 8}px)`
                    : undefined,
              }}
            >
              <FolderCard
                folder={folder}
                onClick={() => {
                  if (draggingIndex === null) onOpenFolder(folder.id);
                }}
              />
            </div>
          ))
        )}
      </div>

      {/* Chat input (fixed bottom) */}
      <ChatInput onSubmit={handleChatSubmit} disabled={isClassifying || folders.length === 0} />

      {/* Modals */}
      <CreateFolderModal
        open={showCreateModal}
        defaultColorIndex={folders.length}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateFolder}
      />

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
