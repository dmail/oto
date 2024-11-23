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
  const animationTimingFunction = easing
    ? createAnimationTimingFunction(easing)
    : "";
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
    element.style.animationTimingFunction = animationTimingFunction;
    return animateElement({
      id,
      element,
      from,
      to,
      duration,
      fill,
      iterations,
    });
  }, [
    id,
    elementRef.current,
    fromTransform,
    toTransform,
    duration,
    fill,
    iterations,
    animationTimingFunction,
  ]);

  return useAnimate({ animate, onStart, onCancel, onFinish });
};

const createAnimationTimingFunction = (easing, steps = 10) => {
  let i = 0;
  const values = [];
  const stepRatio = 1 / steps;
  let progress = 0;
  while (i < steps) {
    i++;
    const value = easing(progress);
    values.push(value);
    progress += stepRatio;
  }
  return `linear(${values.join(", ")});`;
};
