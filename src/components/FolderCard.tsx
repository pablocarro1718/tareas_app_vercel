import { useLiveQuery } from 'dexie-react-hooks';
import { getPendingTaskCount, getHighPriorityTaskCount } from '../db/operations';
import type { Folder } from '../types';

interface FolderCardProps {
  folder: Folder;
  onClick: () => void;
}

export function FolderCard({ folder, onClick }: FolderCardProps) {
  const pendingCount = useLiveQuery(
    () => getPendingTaskCount(folder.id),
    [folder.id],
    0
  );
  const highPriorityCount = useLiveQuery(
    () => getHighPriorityTaskCount(folder.id),
    [folder.id],
    0
  );

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
      style={{ backgroundColor: folder.color }}
    >
      {/* Left content */}
      <div className="flex-1 text-left">
        <p className="font-bold text-white text-lg">{folder.name}</p>

        {/* Keywords + stats pills */}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {folder.keywords.slice(0, 3).map((kw) => (
            <span
              key={kw}
              className="px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: 'white' }}
            >
              {kw}
            </span>
          ))}
          {pendingCount > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: 'white' }}
            >
              {pendingCount} {pendingCount === 1 ? 'tarea' : 'tareas'}
            </span>
          )}
          {highPriorityCount > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{ backgroundColor: 'rgba(255,255,255,0.35)', color: 'white' }}
            >
              {highPriorityCount} urgente{highPriorityCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <svg
        className="w-6 h-6 text-white shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  );
}
