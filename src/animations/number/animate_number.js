import { animateRatio } from "../ratio/animate_ratio.js";
import { applyRatioToDiff } from "../utils/apply_ratio_to_diff.js";

export const animateNumber = (
  from,
  to,
  {
    // step = 0.0000001, // TODO
    effect,
    ...props
  } = {},
) => {
  const numberAnimation = animateRatio({
    ...props,
    type: "number_animation",
    effect: (ratio) => {
      const value = applyRatioToDiff(from, to, ratio);
      if (effect) {
        effect(value);
      }
    },
  });
  return numberAnimation;
};
