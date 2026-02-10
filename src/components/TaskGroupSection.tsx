import { useState, useRef, useCallback } from 'react';
import { TaskItem } from './TaskItem';
import type { Task, TaskGroup } from '../types';

interface TaskGroupSectionProps {
  group: TaskGroup | null; // null = "General"
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onArchive: (id: string) => void;
  onClickTask: (task: Task) => void;
  onToggleCollapse?: (groupId: string) => void;
  onDeleteGroup?: (groupId: string) => void;
}

export function TaskGroupSection({
  group,
  tasks,
  onToggleComplete,
  onArchive,
  onClickTask,
  onToggleCollapse,
  onDeleteGroup,
}: TaskGroupSectionProps) {
  const isGeneral = group === null;
  const isCollapsed = group?.isCollapsed ?? false;
  const activeTasks = tasks.filter((t) => !t.isArchived);
  const pendingCount = activeTasks.filter((t) => !t.isCompleted).length;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Long press detection
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const startLongPress = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setShowDeleteConfirm(true);
    }, 600);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = () => {
    if (didLongPress.current) {
      didLongPress.current = false;
      return;
    }
    if (!isGeneral && group && onToggleCollapse) {
      onToggleCollapse(group.id);
    }
  };

  if (activeTasks.length === 0 && isGeneral) return null;

  return (
    <div className="space-y-1">
      {/* Header */}
      <button
        onClick={handleClick}
        onMouseDown={!isGeneral ? startLongPress : undefined}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onTouchStart={!isGeneral ? startLongPress : undefined}
        onTouchEnd={cancelLongPress}
        onContextMenu={(e) => {
          if (!isGeneral) {
            e.preventDefault();
            setShowDeleteConfirm(true);
          }
        }}
        className={`flex items-center gap-2 w-full px-1 py-2 select-none ${
          isGeneral ? '' : 'active:bg-slate-100 rounded-lg'
        }`}
        disabled={isGeneral}
      >
        {/* Collapse chevron (not for General) */}
        {!isGeneral && (
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isCollapsed ? '' : 'rotate-90'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        )}

        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          {isGeneral ? 'General' : group!.name}
        </span>

        {pendingCount > 0 && (
          <span className="text-xs text-slate-400">{pendingCount}</span>
        )}
      </button>

      {/* Task list */}
      {!isCollapsed && (
        <div className="space-y-1">
          {activeTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onArchive={onArchive}
              onClick={onClickTask}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && group && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xs p-5 space-y-4">
            <p className="text-base text-slate-800 text-center">
              Eliminar grupo <strong>{group.name}</strong>?
            </p>
            <p className="text-sm text-slate-500 text-center">
              Las tareas se moverán a General.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-lg text-slate-600 bg-slate-100 font-medium active:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDeleteGroup?.(group.id);
                }}
                className="flex-1 py-2.5 rounded-lg text-white bg-red-500 font-medium active:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
