import { animateElement, animateSequence, EASING } from "animation";
import { useCallback } from "preact/hooks";
import { useAnimate } from "./use_animate.js";

export const useDigitsDisplayAnimation = ({ elementRef, ...props }) => {
  const animate = useCallback(() => {
    return animateDigitsDisplay(elementRef.current);
  }, []);

  return useAnimate({
    animate,
    ...props,
  });
};

const animateDigitsDisplay = (element) => {
  const verticalMoves = [
    { y: 10, duration: 200 },
    { y: 6, duration: 100 },
    { y: 3, duration: 100 },
    { y: 2, duration: 100 },
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
