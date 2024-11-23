import { animateElement, animateSequence } from "animation";
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
  const steps = [
    // go fast top
    () => {
      return animateElement({
        element,
        to: { y: -30 },
        duration: 100,
      });
    },
    // then
    () => {
      return animateElement({
        element,
        to: { y: 10 },
        duration: 100,
      });
    },
    () => {
      return animateElement({
        element,
        to: { y: -10 },
        duration: 100,
      });
    },
  ];
  return animateSequence(steps);
};
