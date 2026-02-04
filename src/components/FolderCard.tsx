import { useLiveQuery } from 'dexie-react-hooks';
import { getPendingTaskCount } from '../db/operations';
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

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
      style={{ backgroundColor: folder.color + '18' }}
    >
      {/* Color dot */}
      <div
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: folder.color }}
      />

      {/* Name and count */}
      <div className="flex-1 text-left">
        <p className="font-medium text-slate-800">{folder.name}</p>
      </div>

      {/* Pending count */}
      {pendingCount > 0 && (
        <span
          className="text-sm font-medium px-2 py-0.5 rounded-full"
          style={{ color: folder.color }}
        >
          {pendingCount}
        </span>
      )}

      {/* Arrow */}
      <svg
        className="w-5 h-5 text-slate-400 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  );
}
