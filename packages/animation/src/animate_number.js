import { animate } from "./animate.js";

export const animateNumber = ({ from, to, onprogress, ...props }) => {
  const numberAnimation = animate({
    ...props,
    onprogress: () => {
      const progressRatio = numberAnimation.progressRatio;
      const value = progressRatio === 0 ? from : (to - from) * progressRatio;
      numberAnimation.value = value;
      onprogress();
    },
  });
  return numberAnimation;
};
