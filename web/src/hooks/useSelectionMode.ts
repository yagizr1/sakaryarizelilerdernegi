import { useCallback, useRef, useState } from "react";

const LONG_MS = 450;

export function useSelectionMode() {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const timerRef = useRef<number | null>(null);
  const longPressedRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const exit = useCallback(() => {
    setSelecting(false);
    setSelected(new Set());
  }, []);

  const enter = useCallback(() => {
    setSelecting(true);
    setSelected(new Set());
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const startWith = useCallback((id: string) => {
    longPressedRef.current = true;
    setSelecting(true);
    setSelected(new Set([id]));
    try {
      navigator.vibrate?.(25);
    } catch {
      /* ignore */
    }
  }, []);

  const bindItem = useCallback(
    (id: string) => ({
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button !== 0 && e.pointerType === "mouse") return;
        longPressedRef.current = false;
        clearTimer();
        if (selecting) return;
        timerRef.current = window.setTimeout(() => startWith(id), LONG_MS);
      },
      onPointerUp: () => clearTimer(),
      onPointerLeave: () => clearTimer(),
      onPointerCancel: () => clearTimer(),
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    }),
    [selecting, startWith]
  );

  /** true dönerse normal tıklama (navigate/expand) yapılmamalı */
  const handleClick = useCallback(
    (id: string) => {
      if (longPressedRef.current) {
        longPressedRef.current = false;
        return true;
      }
      if (selecting) {
        toggle(id);
        return true;
      }
      return false;
    },
    [selecting, toggle]
  );

  return {
    selecting,
    selected,
    count: selected.size,
    ids: [...selected],
    isSelected: (id: string) => selected.has(id),
    exit,
    enter,
    toggle,
    bindItem,
    handleClick,
  };
}
