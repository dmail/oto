import { animate } from "./animate.js";

export const animateNumber = ({ from, to, onprogress, ...props }) => {
  const numberAnimation = animate({
    ...props,
    onprogress: () => {
      const progressRatio = numberAnimation.progressRatio;
      const value = (to - from) * progressRatio;
      numberAnimation.value = value;
      onprogress();
    },
  });
  numberAnimation.value = from;
  return numberAnimation;
};
