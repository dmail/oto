import { animateElement, animateSequence, EASING } from "animation";
import { useCallback } from "preact/hooks";
import { useAnimate } from "./use_animate.js";

export const useHeroReceiveDamageAnimation = ({ elementRef, onFinish }) => {
  const animate = useCallback(() => {
    return animateHeroReceivedDamage(elementRef.current);
  }, [onFinish]);

  return useAnimate({
    animate,
    onFinish,
  });
};

const animateHeroReceivedDamage = (element) => {
  const verticalMoves = [
    { y: 10, duration: 20 },
    { y: 6, duration: 10 },
    { y: 3, duration: 10 },
    { y: 2, duration: 10 },
  ];
  const steps = [];
  for (const { y, duration } of verticalMoves) {
    steps.push(() => {
      return animateElement({
        element,
        to: { y },
        duration,
        easing: EASING.EASE,
      });
    });
    steps.push(() => {
      return animateElement({
        element,
        to: { y: 0 },
        duration,
        easing: EASING.EASE,
      });
    });
  }
  return animateSequence(steps);
};
