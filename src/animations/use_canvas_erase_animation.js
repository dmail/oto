import { erase } from "animation";
import { useCallback } from "preact/hooks";
import { useAnimate } from "./use_animate.js";

export const useCanvasEraseAnimation = ({
  id,
  elementRef,
  iterations = 4,
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
    return erase(canvas, {
      duration,
      iterations,
    });
  }, [id, elementRef.current, duration, iterations]);

  return useAnimate({ animate, onStart, onCancel, onFinish });
};
