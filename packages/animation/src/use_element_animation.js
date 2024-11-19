import {
  animateElement,
  stepFromAnimationDescription,
} from "./animate_element.js";

import { useCallback, useLayoutEffect, useMemo, useRef } from "preact/hooks";

const noop = () => {};

export const useElementAnimation = ({
  id,
  elementRef,
  from,
  to,
  duration = 500,
  iterations = 1,
  fill = "forwards",
  onStart = noop,
  onCancel = noop,
  onFinish = noop,
}) => {
  const [fromTransform] = stepFromAnimationDescription(from);
  const [toTransform] = stepFromAnimationDescription(to);
  const animationRef = useRef();

  const play = useCallback(() => {
    const element = elementRef.current;
    if (!element) {
      console.warn("no element");
      return;
    }
    const steps = [];
    if (fromTransform) {
      steps.push({ transform: fromTransform });
    }
    steps.push({ transform: toTransform });
    const elementAnimation = animateElement({
      element,
      from,
      to,
      duration,
      fill,
      iterations,
    });
    animationRef.current = elementAnimation;
    elementAnimation.oncancel = () => {
      animationRef.current = null;
      onCancel();
    };
    elementAnimation.onfinish = onFinish;
    onStart();
  }, [
    id,
    elementRef.current,
    fromTransform,
    toTransform,
    duration,
    fill,
    iterations,
    onStart,
    onCancel,
    onFinish,
  ]);
  const pause = useCallback(() => {
    const animation = animationRef.current;
    if (!animation) {
      return;
    }
    animation.pause();
  }, []);
  const cancel = useCallback(() => {
    const animation = animationRef.current;
    if (!animation) {
      return;
    }
    if (animation.playState !== "finished") {
      animation.cancel();
    }
  }, []);

  useLayoutEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return useMemo(() => {
    return { play, pause, cancel };
  }, [play, pause, cancel]);
};
