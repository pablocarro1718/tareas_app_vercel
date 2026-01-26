import { useState } from 'react';
import type { TaskGroup as TaskGroupType, Task, TaskStatus } from '../../types';
import { TaskItem } from './TaskItem';

interface TaskGroupProps {
  group: TaskGroupType;
  onTaskStatusChange: (id: string, status: TaskStatus) => void;
  onTaskDismiss: (id: string) => void;
  onTaskClick: (task: Task) => void;
  depth?: number;
  defaultExpanded?: boolean;
}

export function TaskGroup({
  group,
  onTaskStatusChange,
  onTaskDismiss,
  onTaskClick,
  depth = 0,
  defaultExpanded = true
}: TaskGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Count active tasks (todo + doing)
  const countActiveTasks = (g: TaskGroupType): number => {
    const direct = g.tasks.filter(t => t.status !== 'done').length;
    const nested = g.subGroups.reduce((acc, sub) => acc + countActiveTasks(sub), 0);
    return direct + nested;
  };

  const totalActive = countActiveTasks(group);
  const totalTasks = group.tasks.length + group.subGroups.reduce((acc, sub) => acc + sub.tasks.length, 0);

  // Separate done tasks
  const activeTasks = group.tasks.filter(t => t.status !== 'done');
  const doneTasks = group.tasks.filter(t => t.status === 'done');

  // State for showing done tasks
  const [showDone, setShowDone] = useState(false);

  const hasContent = group.tasks.length > 0 || group.subGroups.length > 0;

  if (!hasContent) return null;

  // Indentation styling
  const indentClass = depth > 0 ? `ml-${Math.min(depth * 4, 12)}` : '';

  return (
    <div className={`${indentClass}`}>
      {/* Group header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 py-2 px-3 rounded-lg
          hover:bg-slate-700/30 transition-colors text-left"
      >
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        <span className="text-white font-medium">
          {group.block.name}
        </span>

        <span className="text-xs text-slate-400 ml-2">
          {totalActive > 0 ? `${totalActive} pendiente${totalActive !== 1 ? 's' : ''}` : 'Todo completado'}
        </span>

        {/* Progress indicator */}
        {totalTasks > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${((totalTasks - totalActive) / totalTasks) * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">
              {totalTasks - totalActive}/{totalTasks}
            </span>
          </div>
        )}
      </button>

      {/* Group content */}
      {expanded && (
        <div className="mt-1 space-y-1">
          {/* Active tasks */}
          {activeTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onStatusChange={onTaskStatusChange}
              onDismiss={onTaskDismiss}
              onClick={onTaskClick}
            />
          ))}

          {/* Sub-groups */}
          {group.subGroups.map(subGroup => (
            <TaskGroup
              key={subGroup.block.pathId}
              group={subGroup}
              onTaskStatusChange={onTaskStatusChange}
              onTaskDismiss={onTaskDismiss}
              onTaskClick={onTaskClick}
              depth={depth + 1}
            />
          ))}

          {/* Done tasks (collapsed by default) */}
          {doneTasks.length > 0 && (
            <div className="mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDone(!showDone);
                }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors
                  flex items-center gap-1 py-1 px-3"
              >
                <svg
                  className={`w-3 h-3 transition-transform ${showDone ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {doneTasks.length} completada{doneTasks.length !== 1 ? 's' : ''}
              </button>

              {showDone && (
                <div className="mt-1 space-y-1">
                  {doneTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onStatusChange={onTaskStatusChange}
                      onDismiss={onTaskDismiss}
                      onClick={onTaskClick}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
