import { animateNumber } from "./animate_number.js";
import { serieOfAnimations } from "./animation_sequence.js";
import { EASING } from "./easing.js";

const glowDuration = 300;
const glowStepDuration = glowDuration / 3;
export const glow = (
  canvas,
  { x = 0, y = 0, width = canvas.width, height = canvas.height } = {},
) => {
  const context = canvas.getContext("2d");
  const imageData = context.getImageData(x, y, width, height);
  const allColors = imageData.data;
  const pixelIndexes = [];
  for (let i = 0, n = allColors.length; i < n; i += 4) {
    const r = allColors[i];
    const g = allColors[i + 1];
    const b = allColors[i + 2];
    if (r === 0 && g === 0 && b === 0) {
      pixelIndexes.push(i);
    }
  }
  const setBlackPixelColor = (value) => {
    const [r, g, b] = value;
    for (const pixelIndex of pixelIndexes) {
      allColors[pixelIndex] = r;
      allColors[pixelIndex + 1] = g;
      allColors[pixelIndex + 2] = b;
    }
    // context.clearRect(0, 0, width, height);
    context.putImageData(imageData, 0, 0);
  };

  return serieOfAnimations([
    () => turnIntoWhite(setBlackPixelColor),
    () => turnIntoBlack(setBlackPixelColor),
    () => turnIntoWhite(setBlackPixelColor),
    () => turnIntoBlack(setBlackPixelColor),
  ]);
};
const turnIntoWhite = (setBlackPixelColor) => {
  const blackToWhiteColorAnimation = animateNumber({
    from: 0,
    to: 255,
    duration: glowStepDuration,
    easing: EASING.EASE_OUT_EXPO,
  });
  blackToWhiteColorAnimation.onprogress = () => {
    setBlackPixelColor([
      blackToWhiteColorAnimation.value,
      blackToWhiteColorAnimation.value,
      blackToWhiteColorAnimation.value,
    ]);
  };
  blackToWhiteColorAnimation.onprogress();
  return blackToWhiteColorAnimation;
};
const turnIntoBlack = (setBlackPixelColor) => {
  const whiteToBlackColorAnimation = animateNumber({
    from: 255,
    to: 0,
    duration: glowStepDuration,
    easing: EASING.EASE_OUT_EXPO,
  });
  whiteToBlackColorAnimation.onprogress = () => {
    setBlackPixelColor([
      whiteToBlackColorAnimation.value,
      whiteToBlackColorAnimation.value,
      whiteToBlackColorAnimation.value,
    ]);
  };
  whiteToBlackColorAnimation.onprogress();
  return whiteToBlackColorAnimation;
};
