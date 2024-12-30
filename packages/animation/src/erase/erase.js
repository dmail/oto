import { animate } from "../animate.js";
import { animateSequence } from "../animate_sequence.js";

export const erase = (
  canvas,
  {
    duration = 300,
    x = 0,
    y = 0,
    width = canvas.width,
    height = canvas.height,
    iterations = 4,
  } = {},
) => {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const imageData = context.getImageData(x, y, width, height);
  const allColors = imageData.data;
  const nonTransparentPixelSet = new Set();
  let pixelX = 0;
  let pixelY = 0;
  for (let i = 0, n = allColors.length; i < n; i += 4) {
    const alpha = allColors[i + 3];
    if (alpha !== 0) {
      nonTransparentPixelSet.add({
        index: i,
        x: pixelX,
        y: pixelY,
      });
      pixelX++;
      if (pixelX === width) {
        pixelX = 0;
        pixelY++;
      }
    }
  }

  const executors = [];
  let i = 0;
  const eraseStepDuration = duration / iterations;
  while (i < iterations) {
    executors.push(() => {
      return animate({
        onstart: () => {
          for (const nonTransparentPixel of nonTransparentPixelSet) {
            if (nonTransparentPixel.x % 4 === 0) {
              allColors[nonTransparentPixel.index + 3] = 0;
              nonTransparentPixelSet.delete(nonTransparentPixel);
            }
          }
          // erase some pixels
          context.putImageData(imageData, 0, 0);
        },
        duration: eraseStepDuration,
      });
    });
    i++;
  }
  return animateSequence(executors);
};
