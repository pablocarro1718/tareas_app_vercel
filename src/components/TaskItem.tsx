import { useState, useRef } from 'react';
import type { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onArchive: (id: string) => void;
  onClick: (task: Task) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  mid: '#eab308',
  low: '#3b82f6',
};

const SWIPE_THRESHOLD = 100;

export function TaskItem({ task, onToggleComplete, onArchive, onClick }: TaskItemProps) {
  const [justCompleted, setJustCompleted] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [swipedAway, setSwipedAway] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

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
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;

    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // Determine direction on first significant move
    if (isHorizontalSwipe.current === null && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      isHorizontalSwipe.current = Math.abs(dx) > Math.abs(dy);
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

    if (swipeX >= SWIPE_THRESHOLD) {
      // Animate out then archive
      setSwipedAway(true);
      setTimeout(() => onArchive(task.id), 300);
    } else {
      setSwipeX(0);
    }
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
        className="relative flex items-center gap-3 px-4 py-3 bg-white rounded-lg"
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? 'none' : 'transform 0.2s ease-out',
        }}
        onClick={() => onClick(task)}
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

        {/* Priority indicator */}
        {task.priority && !task.isCompleted && (
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
          />
        )}
      </div>
    </div>
  );
}
