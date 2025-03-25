import { useState, useEffect, useRef } from "react";

export function useDimensions(ref: React.RefObject<HTMLElement | null>) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        for (const entry of entries) {
          if (entry.target === ref.current) {
            setDimensions({
              width: entry.contentRect.width,
              height: entry.contentRect.height,
            });
          }
        }
      }, 100);
    });

    if (ref.current) {
      resizeObserver.observe(ref.current);
      // Set initial dimensions
      setDimensions({
        width: ref.current.offsetWidth,
        height: ref.current.offsetHeight,
      });
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      resizeObserver.disconnect();
    };
  }, [ref]);

  return dimensions;
}
