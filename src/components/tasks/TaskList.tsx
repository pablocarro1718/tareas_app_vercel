import type { Task, TaskStatus, TaskGroup as TaskGroupType } from '../../types';
import { TaskGroup } from './TaskGroup';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  taskGroups: TaskGroupType[];
  ungroupedTasks?: Task[];
  onTaskStatusChange: (id: string, status: TaskStatus) => void;
  onTaskDismiss: (id: string) => void;
  onTaskClick: (task: Task) => void;
  emptyMessage?: string;
}

export function TaskList({
  taskGroups,
  ungroupedTasks = [],
  onTaskStatusChange,
  onTaskDismiss,
  onTaskClick,
  emptyMessage = 'No hay tareas. ¡Escribe algo abajo para empezar!'
}: TaskListProps) {
  const hasContent = taskGroups.length > 0 || ungroupedTasks.length > 0;

  if (!hasContent) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-slate-400 text-lg">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Task groups */}
      {taskGroups.map(group => (
        <TaskGroup
          key={group.block.pathId || 'unassigned'}
          group={group}
          onTaskStatusChange={onTaskStatusChange}
          onTaskDismiss={onTaskDismiss}
          onTaskClick={onTaskClick}
        />
      ))}

      {/* Ungrouped tasks (if any separate from groups) */}
      {ungroupedTasks.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-slate-400 px-3 py-2">
            Sin asignar
          </h3>
          {ungroupedTasks.map(task => (
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
  );
}
