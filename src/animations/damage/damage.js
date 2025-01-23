import { animateElement } from "../element/animate_element.js";
import { animateSequence } from "../list/animate_sequence.js";
import { EASING } from "../utils/easing.js";

export const animateDamageDisplay = (
  element,
  { toY = -0.4, duration, playbackRate = 0.5 },
) => {
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
      return animateElement(element, {
        to: { y },
        duration: duration / 2,
        easing: EASING.EASE,
        playbackRate,
      });
    });
    steps.push(() => {
      return animateElement(element, {
        to: { y: 0 },
        duration: duration / 2,
        easing: EASING.EASE,
        playbackRate,
      });
    });
  }
  return animateSequence(steps, {
    onstart: () => {
      element.style.display = "";
    },
    onfinish: () => {
      element.style.display = "none";
    },
  });
};
