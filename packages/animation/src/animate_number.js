import { animate } from "./animate.js";

export const animateNumber = ({ from, to, onprogress, ...props }) => {
  const numberAnimation = animate({
    ...props,
    onprogress: () => {
      const ratio = numberAnimation.ratio;
      const value = ratio === 0 ? from : (to - from) * ratio;
      numberAnimation.value = value;
      if (onprogress) {
        onprogress();
      }
    },
  });
  numberAnimation.value = from;
  return numberAnimation;
};
