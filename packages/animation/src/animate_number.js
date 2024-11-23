import { animate } from "./animate.js";
import { applyRatioToDiff } from "./apply_ratio_to_diff.js";

export const animateNumber = ({
  from,
  to,
  // step = 0.0000001,// TODO
  onprogress,
  ...props
}) => {
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
