import { fromTransformations } from "matrix";
import { useMemo } from "preact/hooks";
import { useImage } from "./use_image.js";

export const useSprite = ({
  id,
  url,
  x,
  y,
  width,
  height,
  mirrorX,
  mirrorY,
  transparentColor,
}) => {
  if (x === undefined) {
    x = 0;
  } else {
    x = parseInt(x);
  }
  if (y === undefined) {
    y = 0;
  } else {
    y = parseInt(y);
  }
  if (id === "taurus") {
    console.log({ url, x, y });
  }
  width = parseInt(width);
  height = parseInt(height);
  if (transparentColor) {
    if (typeof transparentColor[0] === "number") {
      transparentColor = [transparentColor];
    }
  } else {
    transparentColor = [];
  }
  const [image] = useImage(url);
  const shouldReplace = useMemo(
    () => createShouldReplace(transparentColor),
    transparentColor.map((color) => `${color[0]}${color[1]}${color[2]}`),
  );
  const imageTransformed = useMemo(() => {
    if (!image) {
      return null;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    const transformations = {
      ...(mirrorX || mirrorY
        ? {
            flip: {
              x: mirrorX,
              y: mirrorY,
            },
            translate: {
              x: mirrorX ? -parseInt(width) : 0,
              y: mirrorY ? -parseInt(height) : 0,
            },
          }
        : {}),
    };
    const hasTransformations = Object.keys(transformations).length > 0;
    context.clearRect(0, 0, width, height);
    if (hasTransformations) {
      context.save();
      const matrix = fromTransformations(transformations);
      context.setTransform(...matrix);
      // context.setTransform(-1, 0, 0, 1, parseInt(width), 0);
    }
    context.drawImage(image, x, y, width, height, 0, 0, width, height);
    if (hasTransformations) {
      context.restore();
    }
    if (shouldReplace) {
      const imageData = context.getImageData(0, 0, width, height);
      const pixels = imageData.data;

      for (let i = 0, n = pixels.length; i < n; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        if (shouldReplace(r, g, b)) {
          pixels[i + 3] = 0;
        }
      }
      context.putImageData(imageData, 0, 0);
    }
    return canvas;
  }, [id, image, mirrorX, mirrorY, shouldReplace, x, y, width, height]);

  return imageTransformed;
};

const createShouldReplace = (colorsToReplace) => {
  if (colorsToReplace.length === 0) {
    return null;
  }
  if (colorsToReplace.length === 1) {
    const colorToReplace = colorsToReplace[0];
    const rToReplace = parseInt(colorToReplace[0]);
    const gToReplace = parseInt(colorToReplace[1]);
    const bToReplace = parseInt(colorToReplace[2]);
    return (r, g, b) => {
      return r === rToReplace && g === gToReplace && b === bToReplace;
    };
  }
  return (r, g, b) => {
    return colorsToReplace.some((c) => {
      return r === c[0] && g === c[1] && b === c[2];
    });
  };
};
