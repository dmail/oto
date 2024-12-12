import { animateElement, animateSequence, EASING } from "animation";
import { useCallback } from "preact/hooks";
import { useAnimate } from "./use_animate.js";

export const useDigitsDisplayAnimation = ({
  elementRef,
  duration,
  playbackRate = 0.5,
  toY = -0.4,
  ...props
}) => {
  const animate = useCallback(() => {
    console.log("digits", elementRef.current);
    return animateDigitsDisplay(elementRef.current, {
      duration,
      playbackRate,
      toY,
    });
  }, [duration, playbackRate, toY]);

  return useAnimate({
    animate,
    ...props,
  });
};

const animateDigitsDisplay = (element, { toY, duration, playbackRate }) => {
  let from = 0;
  const interval = (to) => {
    const stepDuration = (to - from) * duration;
    from = to;
    return stepDuration;
  };
  const relativeToElementHeight = (ratio) => {
    return element.clientHeight * ratio;
  };
  const verticalMoves = [
    {
      y: relativeToElementHeight(toY),
      duration: interval(0.2),
      playbackRate: 0.2,
    },
    {
      y: relativeToElementHeight(toY / 2),
      duration: interval(0.4),
      playbackRate,
    },
    {
      y: relativeToElementHeight(toY / 4),
      duration: interval(0.6),
      playbackRate,
    },
    {
      y: relativeToElementHeight(0),
      duration: interval(1),
      playbackRate,
    },
  ];
  const steps = [];
  for (const { y, duration, playbackRate } of verticalMoves) {
    steps.push(() => {
      return animateElement({
        element,
        to: { y },
        duration: duration / 2,
        easing: EASING.EASE,
        playbackRate,
      });
    });
    steps.push(() => {
      return animateElement({
        element,
        to: { y: 0 },
        duration: duration / 2,
        easing: EASING.EASE,
        playbackRate,
      });
    });
  }
  return animateSequence(steps);
};
