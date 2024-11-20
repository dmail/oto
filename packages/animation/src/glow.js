import { animate } from "./animate.js";
import { animationSequence } from "./animation_sequence.js";
import { EASING } from "./easing.js";

const COLORS = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  red: [255, 0, 0],
  green: [0, 255, 0],
};

export const glow = (
  canvas,
  {
    fromColor = "black",
    toColor = "white",
    duration = 300,
    iterations = 2,
    x = 0,
    y = 0,
    width = canvas.width,
    height = canvas.height,
    onprogress,
  } = {},
) => {
  if (typeof fromColor === "string") fromColor = COLORS[fromColor];
  if (typeof toColor === "string") toColor = COLORS[toColor];
  const [rFrom, gFrom, bFrom] = fromColor;
  let r = rFrom;
  let g = gFrom;
  let b = bFrom;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const imageData = context.getImageData(x, y, width, height);
  const allColors = imageData.data;
  const pixelIndexes = [];
  for (let i = 0, n = allColors.length; i < n; i += 4) {
    const rCandidate = allColors[i];
    const gCandidate = allColors[i + 1];
    const bCandidate = allColors[i + 2];
    if (rCandidate === rFrom && gCandidate === gFrom && bCandidate === bFrom) {
      pixelIndexes.push(i);
    }
  }

  const glowStepDuration = duration / (iterations * 2);
  const animateColor = (nextColor) => {
    const [rTo, gTo, bTo] = nextColor;
    const colorAnimation = animate({
      onprogress: () => {
        r = (rTo - rFrom) * colorAnimation.ratio;
        g = (gTo - gFrom) * colorAnimation.ratio;
        b = (bTo - bFrom) * colorAnimation.ratio;
        for (const pixelIndex of pixelIndexes) {
          allColors[pixelIndex] = r;
          allColors[pixelIndex + 1] = g;
          allColors[pixelIndex + 2] = b;
        }
        // context.clearRect(0, 0, width, height);
        context.putImageData(imageData, 0, 0);
        glowAnimation.color = [r, g, b];
        if (onprogress) {
          onprogress();
        }
      },
      duration: glowStepDuration,
      easing: EASING.EASE_OUT_EXPO,
    });
    return colorAnimation;
  };

  const animationExecutors = [];
  let i = 0;
  while (i < iterations) {
    i++;
    animationExecutors.push(() => animateColor(toColor));
    animationExecutors.push(() => animateColor(fromColor));
  }
  const glowAnimation = animationSequence(animationExecutors);
  return glowAnimation;
};
