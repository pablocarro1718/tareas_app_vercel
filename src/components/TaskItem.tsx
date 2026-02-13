import { useState, useRef, useCallback } from 'react';
import type { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onArchive: (id: string) => void;
  onClick: (task: Task) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  mid: '#eab308',
  low: '#3b82f6',
};

const SWIPE_THRESHOLD = 100;

export function TaskItem({ task, onToggleComplete, onArchive, onClick, onDelete }: TaskItemProps) {
  const [justCompleted, setJustCompleted] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [swipedAway, setSwipedAway] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

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

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.isCompleted) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 400);
    }
    onToggleComplete(task.id);
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setSwiping(true);
    startLongPress();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;

    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // Determine direction on first significant move
    if (isHorizontalSwipe.current === null && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      isHorizontalSwipe.current = Math.abs(dx) > Math.abs(dy);
      // Cancel long press if user moves finger
      cancelLongPress();
    }

    if (!isHorizontalSwipe.current) return;

    // Only allow right swipe
    if (dx > 0) {
      setSwipeX(dx);
    }
  };

  const handleTouchEnd = () => {
    setSwiping(false);
    isHorizontalSwipe.current = null;
    cancelLongPress();

    if (swipeX >= SWIPE_THRESHOLD) {
      // Animate out then archive
      setSwipedAway(true);
      setTimeout(() => onArchive(task.id), 300);
    } else {
      setSwipeX(0);
    }
  };

  const handleClick = () => {
    if (didLongPress.current) {
      didLongPress.current = false;
      return;
    }
    onClick(task);
  };

  if (swipedAway) {
    return (
      <div className="h-0 overflow-hidden transition-all duration-300" />
    );
  }

  const swipeProgress = Math.min(swipeX / SWIPE_THRESHOLD, 1);

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Green background revealed on swipe */}
      <div
        className="absolute inset-0 bg-green-500 flex items-center pl-5 rounded-lg"
        style={{ opacity: swipeProgress }}
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>

      {/* Task card */}
      <div
        className="relative flex items-center gap-3 px-4 py-3 bg-white rounded-lg select-none"
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? 'none' : 'transform 0.2s ease-out',
        }}
        onClick={handleClick}
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowDeleteConfirm(true);
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Checkbox circle */}
        <button
          onClick={handleComplete}
          className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300"
          style={{
            borderColor: task.isCompleted || justCompleted ? '#22c55e' : '#cbd5e1',
            backgroundColor: task.isCompleted || justCompleted ? '#22c55e' : 'transparent',
          }}
        >
          {(task.isCompleted || justCompleted) && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </button>

        {/* Text with strikethrough animation */}
        <span
          className="flex-1 text-sm relative"
          style={{
            color: task.isCompleted ? '#94a3b8' : '#334155',
            transition: 'color 0.3s ease',
          }}
        >
          {task.text}
          {/* Animated strikethrough line */}
          {(task.isCompleted || justCompleted) && (
            <span
              className="absolute left-0 top-1/2 h-[1.5px] bg-slate-400"
              style={{
                animation: justCompleted ? 'strikethrough 0.3s ease-out forwards' : undefined,
                width: justCompleted ? undefined : '100%',
              }}
            />
          )}
        </span>

        {/* Notes indicator */}
        {task.notes && !task.isCompleted && (
          <svg className="w-3.5 h-3.5 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        )}

        {/* Priority indicator */}
        {task.priority && !task.isCompleted && (
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
          />
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xs p-5 space-y-4">
            <p className="text-base text-slate-800 text-center">
              Eliminar tarea?
            </p>
            <p className="text-sm text-slate-500 text-center truncate px-2">
              {task.text}
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
                  onDelete(task.id);
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
