import { useCallback, useRef } from "react";

/**
 * Custom hook for pointer-event-based dragging (floating chat panel).
 * Uses setPointerCapture for reliable tracking without external libraries.
 */
export function useFloatDrag(options: {
  onDrag: (x: number, y: number) => void;
  enabled: boolean;
}) {
  const startPos = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!options.enabled) return;
      // Only handle primary button
      if (e.button !== 0) return;

      // Don't start drag when clicking interactive elements inside the handle
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, select, textarea, [role="button"], [role="menuitem"]')) return;

      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);

      // Get current panel position from inline style or computed
      const panel = el.closest("[data-float-panel]") as HTMLElement | null;
      const ox = panel ? parseFloat(panel.style.left) || 0 : 0;
      const oy = panel ? parseFloat(panel.style.top) || 0 : 0;

      startPos.current = { px: e.clientX, py: e.clientY, ox, oy };

      const onPointerMove = (ev: PointerEvent) => {
        if (!startPos.current) return;
        const dx = ev.clientX - startPos.current.px;
        const dy = ev.clientY - startPos.current.py;
        const newX = Math.max(0, Math.min(window.innerWidth - 100, startPos.current.ox + dx));
        const newY = Math.max(0, Math.min(window.innerHeight - 50, startPos.current.oy + dy));
        options.onDrag(newX, newY);
      };

      const onPointerUp = () => {
        startPos.current = null;
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [options.enabled, options.onDrag]
  );

  return {
    dragHandleProps: {
      onPointerDown,
      style: options.enabled ? { cursor: "grab" } as React.CSSProperties : undefined,
    },
  };
}

/**
 * Custom hook for pointer-event-based resizing (floating chat panel).
 */
export function useFloatResize(options: {
  onResize: (w: number, h: number) => void;
  enabled: boolean;
  minWidth: number;
  minHeight: number;
}) {
  const startPos = useRef<{ px: number; py: number; ow: number; oh: number } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!options.enabled) return;
      if (e.button !== 0) return;

      e.stopPropagation();
      e.preventDefault();
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);

      const panel = el.closest("[data-float-panel]") as HTMLElement | null;
      const ow = panel ? panel.offsetWidth : 420;
      const oh = panel ? panel.offsetHeight : 600;

      startPos.current = { px: e.clientX, py: e.clientY, ow, oh };

      const onPointerMove = (ev: PointerEvent) => {
        if (!startPos.current) return;
        const dx = ev.clientX - startPos.current.px;
        const dy = ev.clientY - startPos.current.py;
        const newW = Math.max(options.minWidth, startPos.current.ow + dx);
        const newH = Math.max(options.minHeight, startPos.current.oh + dy);
        options.onResize(newW, newH);
      };

      const onPointerUp = () => {
        startPos.current = null;
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [options.enabled, options.onResize, options.minWidth, options.minHeight]
  );

  return {
    resizeHandleProps: {
      onPointerDown,
      style: {
        cursor: "nwse-resize",
        position: "absolute" as const,
        bottom: 0,
        right: 0,
        width: "16px",
        height: "16px",
        zIndex: 10,
      },
    },
  };
}
