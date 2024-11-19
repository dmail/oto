import { animate } from "./animate.js";
import { serieOfAnimations } from "./animation_sequence.js";
import { EASING } from "./easing.js";

const COLORS = {
  black: [0, 0, 0],
  white: [255, 255, 255],
};

const glowDuration = 300;
const glowStepDuration = glowDuration / 3;
export const glow = (
  canvas,
  {
    fromColor = "black",
    toColor = "white",
    iterations = 2,
    x = 0,
    y = 0,
    width = canvas.width,
    height = canvas.height,
  } = {},
) => {
  const context = canvas.getContext("2d");
  const imageData = context.getImageData(x, y, width, height);
  const allColors = imageData.data;
  const pixelIndexes = [];
  if (typeof fromColor === "string") fromColor = COLORS[fromColor];
  if (typeof toColor === "string") toColor = COLORS[toColor];
  const [rToReplace, gToReplace, bToReplace] = fromColor;
  for (let i = 0, n = allColors.length; i < n; i += 4) {
    const r = allColors[i];
    const g = allColors[i + 1];
    const b = allColors[i + 2];
    if (r === rToReplace && g === gToReplace && b === bToReplace) {
      pixelIndexes.push(i);
    }
  }
  const setPixelsColor = (value) => {
    const [r, g, b] = value;
    for (const pixelIndex of pixelIndexes) {
      allColors[pixelIndex] = r;
      allColors[pixelIndex + 1] = g;
      allColors[pixelIndex + 2] = b;
    }
    // context.clearRect(0, 0, width, height);
    context.putImageData(imageData, 0, 0);
  };

  const animationExecutors = [];
  let i = 0;
  while (i < iterations) {
    i++;
    animationExecutors.push(() => turnInto(setPixelsColor, fromColor, toColor));
    animationExecutors.push(() => turnInto(setPixelsColor, toColor, fromColor));
  }
  return serieOfAnimations(animationExecutors);
};
const turnInto = (setPixelsColor, fromColor, toColor) => {
  const [rFrom, gFrom, bFrom] = fromColor;
  const [rTo, gTo, bTo] = toColor;
  const colorAnimation = animate({
    onprogress: () => {
      const r = (rTo - rFrom) * colorAnimation.progressRatio;
      const g = (gTo - gFrom) * colorAnimation.progressRatio;
      const b = (bTo - bFrom) * colorAnimation.progressRatio;
      setPixelsColor([r, g, b]);
    },
    duration: glowStepDuration,
    easing: EASING.EASE_OUT_EXPO,
  });
  colorAnimation.onprogress();
  return colorAnimation;
};
