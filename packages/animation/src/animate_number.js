import { animate } from "./animate.js";
import { applyRatioToDiff } from "./apply_ratio_to_diff.js";

export const animateNumber = ({
  from,
  to,
  // step = 0.0000001,// TODO
  effect,
  ...props
}) => {
  const numberAnimation = animate({
    ...props,
    effect: (ratio, anim) => {
      const value = applyRatioToDiff(from, to, ratio);
      anim.value = value;
      if (effect) {
        effect(value, anim);
      }
    },
  });
  return numberAnimation;
};
