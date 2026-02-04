import { useState, useRef, useCallback } from 'react';

interface SortableState {
  draggingIndex: number | null;
  overIndex: number | null;
}

interface UseSortableOptions {
  onReorder: (fromIndex: number, toIndex: number) => void;
  longPressMs?: number;
}

export function useSortable({ onReorder, longPressMs = 400 }: UseSortableOptions) {
  const [state, setState] = useState<SortableState>({
    draggingIndex: null,
    overIndex: null,
  });

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartY = useRef(0);
  const itemRects = useRef<DOMRect[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const captureItemRects = useCallback(() => {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll('[data-sortable-item]');
    itemRects.current = Array.from(items).map((el) => el.getBoundingClientRect());
  }, []);

  const handleTouchStart = useCallback(
    (index: number, e: React.TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;

      longPressTimer.current = setTimeout(() => {
        isDragging.current = true;
        captureItemRects();
        setState({ draggingIndex: index, overIndex: index });
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, longPressMs);
    },
    [longPressMs, captureItemRects]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      // Cancel long press if moved too much before activation
      if (!isDragging.current) {
        const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
        if (dy > 10) {
          cancelLongPress();
        }
        return;
      }

      e.preventDefault();
      const touchY = e.touches[0].clientY;

      // Find which item we're over
      const newOverIndex = itemRects.current.findIndex(
        (rect) => touchY >= rect.top && touchY <= rect.bottom
      );

      if (newOverIndex >= 0 && newOverIndex !== state.overIndex) {
        setState((s) => ({ ...s, overIndex: newOverIndex }));
      }
    },
    [state.overIndex, cancelLongPress]
  );

  const handleTouchEnd = useCallback(() => {
    cancelLongPress();

    if (isDragging.current && state.draggingIndex !== null && state.overIndex !== null) {
      if (state.draggingIndex !== state.overIndex) {
        onReorder(state.draggingIndex, state.overIndex);
      }
    }

    isDragging.current = false;
    setState({ draggingIndex: null, overIndex: null });
  }, [state.draggingIndex, state.overIndex, onReorder, cancelLongPress]);

  return {
    containerRef,
    draggingIndex: state.draggingIndex,
    overIndex: state.overIndex,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
