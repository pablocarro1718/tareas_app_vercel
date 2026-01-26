import React from 'react';
import type { Task, TaskStatus } from '../../types';
import { Chip } from '../ui/Chip';

interface TaskItemProps {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDismiss: (id: string) => void;
  onClick: (task: Task) => void;
}

const statusColors = {
  todo: 'border-l-slate-500',
  doing: 'border-l-yellow-500',
  done: 'border-l-green-500'
};

const statusIcons = {
  todo: (
    <div className="w-5 h-5 rounded-full border-2 border-slate-500 hover:border-yellow-500 transition-colors" />
  ),
  doing: (
    <div className="w-5 h-5 rounded-full border-2 border-yellow-500 bg-yellow-500/20 flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-yellow-500" />
    </div>
  ),
  done: (
    <div className="w-5 h-5 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center">
      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )
};

export function TaskItem({ task, onStatusChange, onDismiss, onClick }: TaskItemProps) {
  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Cycle through statuses: todo -> doing -> done -> todo
    const nextStatus: TaskStatus =
      task.status === 'todo' ? 'doing' :
      task.status === 'doing' ? 'done' : 'todo';

    onStatusChange(task.id, nextStatus);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(task.id);
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    }

    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div
      className={`
        group relative bg-slate-800/50 hover:bg-slate-700/50
        border-l-4 ${statusColors[task.status]}
        rounded-r-lg p-3 cursor-pointer
        transition-all duration-150
        ${task.status === 'done' ? 'opacity-60' : ''}
      `}
      onClick={() => onClick(task)}
    >
      <div className="flex items-start gap-3">
        {/* Status toggle */}
        <button
          onClick={handleStatusClick}
          className="flex-shrink-0 mt-0.5"
          aria-label={`Cambiar estado de la tarea`}
        >
          {statusIcons[task.status]}
        </button>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <p className={`text-white ${task.status === 'done' ? 'line-through text-slate-400' : ''}`}>
            {task.title}
          </p>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {task.dueDate && (
              <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                📅 {formatDate(task.dueDate)}
              </span>
            )}

            {task.subTasks && task.subTasks.length > 0 && (
              <span className="text-xs text-slate-400">
                ✓ {task.subTasks.filter(s => s.done).length}/{task.subTasks.length}
              </span>
            )}

            {task.blocked?.isBlocked && (
              <Chip label="Bloqueado" type="default" size="sm" />
            )}

            {task.tags?.map(tag => (
              <Chip key={tag} label={tag} type="default" size="sm" />
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDismiss}
            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
            aria-label="Descartar tarea"
            title="Descartar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
