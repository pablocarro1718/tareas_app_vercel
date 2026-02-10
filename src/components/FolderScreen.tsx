import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  getFolder,
  getTaskGroups,
  getTasks,
  toggleTaskCompleted,
  archiveTask,
  updateTaskGroup,
  deleteTaskGroup,
  updateTask,
  deleteTask,
  updateFolder,
  deleteFolder,
  createTaskGroup,
} from '../db/operations';
import { TaskGroupSection } from './TaskGroupSection';
import { CompletedSection } from './CompletedSection';
import { EditTaskModal } from './EditTaskModal';
import { EditFolderModal } from './EditFolderModal';
import { CreateTaskGroupModal } from './CreateTaskGroupModal';
import type { Task } from '../types';

interface FolderScreenProps {
  folderId: string;
  onBack: () => void;
}

export function FolderScreen({ folderId, onBack }: FolderScreenProps) {
  const folder = useLiveQuery(() => getFolder(folderId), [folderId]);
  const taskGroups = useLiveQuery(() => getTaskGroups(folderId), [folderId], []);
  const allTasks = useLiveQuery(() => getTasks(folderId), [folderId], []);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showFolderConfig, setShowFolderConfig] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  if (!folder) return null;

  const generalTasks = allTasks.filter((t) => t.taskGroupId === null);
  const tasksByGroup = (groupId: string) =>
    allTasks.filter((t) => t.taskGroupId === groupId);

  const handleToggleComplete = async (taskId: string) => {
    await toggleTaskCompleted(taskId);
  };

  const handleArchive = async (taskId: string) => {
    await archiveTask(taskId);
  };

  const handleClickTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleToggleCollapse = async (groupId: string) => {
    const group = taskGroups.find((g) => g.id === groupId);
    if (group) {
      await updateTaskGroup(groupId, { isCollapsed: !group.isCollapsed });
    }
  };

  const handleSaveTask = async (
    id: string,
    changes: { text: string; priority: Task['priority']; folderId: string }
  ) => {
    await updateTask(id, changes);
    setEditingTask(null);
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
    setEditingTask(null);
  };

  const handleSaveFolder = async (changes: {
    name: string;
    color: string;
    llmContext: string;
    keywords: string[];
  }) => {
    await updateFolder(folderId, changes);
    setShowFolderConfig(false);
  };

  const handleDeleteFolder = async () => {
    await deleteFolder(folderId);
    onBack();
  };

  const handleDeleteTaskGroup = async (groupId: string) => {
    await deleteTaskGroup(groupId);
  };

  const handleCreateTaskGroup = async (name: string) => {
    await createTaskGroup({ folderId, name });
    setShowCreateGroup(false);
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-14 pb-3">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 active:bg-slate-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className="flex-1 flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: folder.color }}
          />
          <h1 className="text-xl font-bold text-slate-800 truncate">{folder.name}</h1>
        </div>

        {/* Config button */}
        <button
          onClick={() => setShowFolderConfig(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 active:bg-slate-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a7.723 7.723 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Add task group button */}
        <button
          onClick={() => setShowCreateGroup(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-500 text-white active:bg-blue-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 pb-6 space-y-4 overflow-y-auto">
        {/* General section */}
        <TaskGroupSection
          group={null}
          tasks={generalTasks}
          onToggleComplete={handleToggleComplete}
          onArchive={handleArchive}
          onClickTask={handleClickTask}
        />

        {/* Task groups */}
        {taskGroups.map((group) => (
          <TaskGroupSection
            key={group.id}
            group={group}
            tasks={tasksByGroup(group.id)}
            onToggleComplete={handleToggleComplete}
            onArchive={handleArchive}
            onClickTask={handleClickTask}
            onToggleCollapse={handleToggleCollapse}
            onDeleteGroup={handleDeleteTaskGroup}
          />
        ))}

        {/* Empty state */}
        {allTasks.filter((t) => !t.isArchived).length === 0 && (
          <div className="flex flex-col items-center justify-center pt-16 text-slate-400">
            <svg className="w-14 h-14 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-base">Sin tareas</p>
            <p className="text-sm mt-1">Usa el chat en Home para añadir tareas</p>
          </div>
        )}

        {/* Completed section */}
        <CompletedSection
          tasks={allTasks}
          onToggleComplete={handleToggleComplete}
          onArchive={handleArchive}
          onClickTask={handleClickTask}
        />
      </div>

      {/* Modals */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}

      {showFolderConfig && (
        <EditFolderModal
          folder={folder}
          onClose={() => setShowFolderConfig(false)}
          onSave={handleSaveFolder}
          onDelete={handleDeleteFolder}
        />
      )}

      <CreateTaskGroupModal
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onSave={handleCreateTaskGroup}
      />
    </div>
  );
}
