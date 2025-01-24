import { animateRatio } from "../ratio/animate_ratio.js";
import { applyRatioToDiff } from "../utils/apply_ratio_to_diff.js";
import { WELL_KNOWN_COLORS } from "../utils/well_known_colors.js";

export const animateColor = (
  fromColor,
  toColor,
  { effect, ...params } = {},
) => {
  if (typeof fromColor === "string") fromColor = WELL_KNOWN_COLORS[fromColor];
  if (typeof toColor === "string") toColor = WELL_KNOWN_COLORS[toColor];
  const [rFrom, gFrom, bFrom] = fromColor;
  const [rTo, gTo, bTo] = toColor;
  let r = rFrom;
  let g = gFrom;
  let b = bFrom;
  const colorAnimation = animateRatio({
    ...params,
    type: "color_animation",
    effect: (ratio) => {
      r = applyRatioToDiff(rFrom, rTo, ratio);
      g = applyRatioToDiff(gFrom, gTo, ratio);
      b = applyRatioToDiff(bFrom, bTo, ratio);
      const color = [r, g, b];
      if (effect) {
        effect(color);
      }
    },
  });
  return colorAnimation;
};
