import { animate } from "./animate.js";
import { applyRatioToDiff } from "./apply_ratio_to_diff.js";

export const animateNumber = ({ from, to, onprogress, ...props }) => {
  const numberAnimation = animate({
    ...props,
    onprogress: () => {
      numberAnimation.value = applyRatioToDiff(from, to, numberAnimation.ratio);
      if (onprogress) {
        onprogress();
      }
    },
  });
  numberAnimation.value = from;
  return numberAnimation;
};
