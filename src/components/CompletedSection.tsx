import { useState } from 'react';
import { TaskItem } from './TaskItem';
import type { Task } from '../types';

interface CompletedSectionProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onArchive: (id: string) => void;
  onClickTask: (task: Task) => void;
}

export function CompletedSection({
  tasks,
  onToggleComplete,
  onArchive,
  onClickTask,
}: CompletedSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const archivedTasks = tasks.filter((t) => t.isArchived);

  if (archivedTasks.length === 0) return null;

  return (
    <div className="space-y-1 mt-4">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full px-1 py-2 active:bg-slate-100 rounded-lg"
      >
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>

        <span className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
          Completadas
        </span>

        <span className="text-xs text-slate-400">{archivedTasks.length}</span>
      </button>

      {/* Archived tasks */}
      {isExpanded && (
        <div className="space-y-1">
          {archivedTasks.map((task) => (
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
    </div>
  );
}
