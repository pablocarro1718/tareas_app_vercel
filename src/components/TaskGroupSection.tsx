import { TaskItem } from './TaskItem';
import type { Task, TaskGroup } from '../types';

interface TaskGroupSectionProps {
  group: TaskGroup | null; // null = "General"
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onArchive: (id: string) => void;
  onClickTask: (task: Task) => void;
  onToggleCollapse?: (groupId: string) => void;
}

export function TaskGroupSection({
  group,
  tasks,
  onToggleComplete,
  onArchive,
  onClickTask,
  onToggleCollapse,
}: TaskGroupSectionProps) {
  const isGeneral = group === null;
  const isCollapsed = group?.isCollapsed ?? false;
  const activeTasks = tasks.filter((t) => !t.isArchived);
  const pendingCount = activeTasks.filter((t) => !t.isCompleted).length;

  if (activeTasks.length === 0 && isGeneral) return null;

  return (
    <div className="space-y-1">
      {/* Header */}
      <button
        onClick={() => {
          if (!isGeneral && group && onToggleCollapse) {
            onToggleCollapse(group.id);
          }
        }}
        className={`flex items-center gap-2 w-full px-1 py-2 ${
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
    </div>
  );
}
