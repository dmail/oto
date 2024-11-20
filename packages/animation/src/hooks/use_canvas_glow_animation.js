import { useCallback } from "preact/hooks";
import { glow } from "../glow.js";
import { useAnimate } from "./use_animate.js";

export const useCanvasGlowAnimation = ({
  id,
  elementRef,
  from,
  to,
  iterations = 2,
  duration = 300,
  onStart,
  onCancel,
  onFinish,
}) => {
  const animate = useCallback(() => {
    const canvas = elementRef.current;
    if (!canvas) {
      console.warn("no canvas");
      return null;
    }
    return glow(canvas, {
      from,
      to,
      duration,
      iterations,
    });
  }, [id, elementRef.current, from, to, duration, iterations]);

  return useAnimate({ animate, onStart, onCancel, onFinish });
};
