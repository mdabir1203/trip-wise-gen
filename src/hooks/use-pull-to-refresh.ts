import { useCallback, useRef } from "react";

type PullToRefreshOptions = {
  threshold?: number;
  onRefresh: () => void;
};

export function usePullToRefresh<T extends HTMLElement>({
  onRefresh,
  threshold = 68,
}: PullToRefreshOptions) {
  const startYRef = useRef<number | null>(null);
  const isPullingRef = useRef(false);
  const containerRef = useRef<T | null>(null);

  const onTouchStart = useCallback(
    (event: TouchEvent) => {
      const container = containerRef.current;
      if (!container) return;
      if (container.scrollTop === 0) {
        startYRef.current = event.touches[0].clientY;
        isPullingRef.current = true;
      }
    },
    []
  );

  const onTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!isPullingRef.current || startYRef.current === null) return;
      const currentY = event.touches[0].clientY;
      const distance = currentY - startYRef.current;

      if (distance > threshold) {
        isPullingRef.current = false;
        startYRef.current = null;
        onRefresh();
      }
    },
    [onRefresh, threshold]
  );

  const reset = useCallback(() => {
    isPullingRef.current = false;
    startYRef.current = null;
  }, []);

  const setRef = useCallback(
    (node: T | null) => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("touchstart", onTouchStart);
        containerRef.current.removeEventListener("touchmove", onTouchMove);
        containerRef.current.removeEventListener("touchend", reset);
      }

      containerRef.current = node;

      if (node) {
        node.addEventListener("touchstart", onTouchStart, { passive: true });
        node.addEventListener("touchmove", onTouchMove, { passive: true });
        node.addEventListener("touchend", reset, { passive: true });
      }
    },
    [onTouchMove, onTouchStart, reset]
  );

  return setRef;
}
