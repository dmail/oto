import { animateElement, stepFromAnimationDescription } from "animation";
import { useCallback } from "preact/hooks";
import { useAnimate } from "./use_animate.js";

export const useElementAnimation = ({
  id,
  elementRef,
  from,
  to,
  duration = 500,
  iterations = 1,
  fill = "forwards",
  onStart,
  onCancel,
  onFinish,
  easing,
}) => {
  const [fromTransform] = stepFromAnimationDescription(from);
  const [toTransform] = stepFromAnimationDescription(to);

  const animate = useCallback(() => {
    const element = elementRef.current;
    if (!element) {
      console.warn("no element");
      return null;
    }
    const steps = [];
    if (fromTransform) {
      steps.push({ transform: fromTransform });
    }
    steps.push({ transform: toTransform });
    return animateElement({
      id,
      element,
      from,
      to,
      duration,
      fill,
      iterations,
      easing,
    });
  }, [
    id,
    elementRef.current,
    fromTransform,
    toTransform,
    duration,
    fill,
    iterations,
    easing,
  ]);

  return useAnimate({ animate, onStart, onCancel, onFinish });
};
