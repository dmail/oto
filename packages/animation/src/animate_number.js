import { animate } from "./animate.js";

export const animateNumber = ({ from, to, onprogress, ...props }) => {
  const animation = animate({
    ...props,
    onprogress: () => {
      const progressRatio = animation.progressRatio;
      const value = (to - from) * progressRatio;
      animation.value = value;
      onprogress();
    },
  });
  animation.value = from;
  return animation;
};
